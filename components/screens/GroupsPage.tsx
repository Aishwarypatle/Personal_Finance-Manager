'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, Download, Pencil, Plus, ReceiptText, Trash2, UsersRound, X } from 'lucide-react';
import { today, formatCurrency, formatDate } from '@/lib/format';
import { calculateSettlements } from '@/lib/settlements';
import type { ExpenseGroup, GroupExpense } from '@/lib/types';
import { PageHeading } from '@/components/shared/PageHeading';
import { Skeleton } from '@/components/shared/Skeleton';
import { downloadGroupReport } from '@/lib/groupReport';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Modal, ModalHeader } from '@/components/ui/Modal';

type Props = {
  groups: ExpenseGroup[];
  expenses: GroupExpense[];
  selected: number;
  isLoading?: boolean;
  setSelected: (id: number) => void;
  onCreateGroup: (group: ExpenseGroup) => void;
  onUpdateGroup: (group: ExpenseGroup) => void;
  onDeleteGroup: (group: ExpenseGroup) => void;
  onAddExpense: (expense: GroupExpense) => void;
  onUpdateExpense: (expense: GroupExpense) => void;
  onDeleteExpense: (expense: GroupExpense) => void;
  onSettleUp: (groupId: number, from: string, to: string, amount: number) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
};

export function GroupsPage({
  groups,
  expenses,
  selected,
  isLoading = false,
  setSelected,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onSettleUp,
  onToast,
}: Props) {
  const [dialog, setDialog] = useState<'group' | 'expense' | ''>('');
  const [error, setError] = useState('');
  const [editingGroup, setEditingGroup] = useState<ExpenseGroup | null>(null);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);
  const [unequalSplit, setUnequalSplit] = useState(false);

  const group = groups.find((item) => item.id === selected) || groups[0];
  const groupExpenses = group ? expenses.filter((expense) => expense.groupId === group.id) : [];
  const total = groupExpenses
    .filter((expense) => !expense.isSettlement)
    .reduce((sum, expense) => sum + expense.amount, 0);
  const { balances, settlements } = group ? calculateSettlements(group, groupExpenses) : { balances: [], settlements: [] };

  const createGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const friends = String(data.get('members') || '').split(',').map((member) => member.trim()).filter(Boolean);
    if (!name || friends.length === 0) return;
    const uniqueMembers = [...new Set(friends.filter((member) => member.toLowerCase() !== 'you'))];
    const nextGroup = { id: editingGroup?.id || Date.now(), name, members: ['You', ...uniqueMembers] };
    if (editingGroup) onUpdateGroup(nextGroup); else onCreateGroup(nextGroup);
    setDialog('');
    setEditingGroup(null);
  };

  const addExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!group) return;
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get('amount'));
    if (!Number.isFinite(amount) || amount <= 0) {
      const message = 'Enter a valid total amount.';
      setError(message);
      onToast(message, 'error');
      return;
    }
    const shares: Record<string, number> = {};
    const equalShare = Math.round((amount / group.members.length) * 100) / 100;
    group.members.forEach((member, index) => {
      shares[member] = unequalSplit
        ? Number(data.get(`share-${member}`)) || 0
        : index === group.members.length - 1
          ? Math.round((amount - equalShare * (group.members.length - 1)) * 100) / 100
          : equalShare;
    });
    const shareTotal = Object.values(shares).reduce((sum, share) => sum + share, 0);
    if (Math.round(shareTotal * 100) !== Math.round(amount * 100)) {
      const message = `Shares total ${formatCurrency(shareTotal)}. They must add up to ${formatCurrency(amount)}.`;
      setError(message);
      onToast(message, 'error');
      return;
    }
    const nextExpense = {
      id: editingExpense?.id || Date.now(),
      groupId: group.id,
      title: String(data.get('title') || '').trim(),
      paidBy: String(data.get('paidBy')),
      amount,
      date: String(data.get('date')),
      shares,
    };
    if (editingExpense) onUpdateExpense(nextExpense); else onAddExpense(nextExpense);
    setDialog('');
    setEditingExpense(null);
    setError('');
  };

  return (
    <>
      <PageHeading
        eyebrow="SHARED SPENDING"
        title="Groups"
        subtitle="Split shared expenses and see who owes whom."
        action={<div className="heading-actions">
          <Button variant="outline" size="sm" disabled={isLoading} onClick={() => { setEditingGroup(null); setDialog('group'); }}><Plus size={15} /> New group</Button>
          {group && !isLoading && <Button variant="primary" size="sm" onClick={() => { setError(''); setEditingExpense(null); setUnequalSplit(false); setDialog('expense'); }}><Plus size={15} /> Add expense</Button>}
        </div>}
      />

      {isLoading ? (
        <div className="groups-layout" aria-busy="true" aria-label="Loading groups">
          <section className="panel group-list-panel">
            <div className="panel-head"><div><h2>Your groups</h2><p>Shared tabs with friends</p></div><UsersRound size={18} /></div>
            <div className="group-selector">
              {Array.from({ length: 3 }, (_, index) => (
                <div className="group-select" key={index}>
                  <span className="group-avatar skeleton" aria-hidden="true" />
                  <span><Skeleton className="block h-3 w-24" /><Skeleton className="mt-1.5 block h-2.5 w-16" /></span>
                </div>
              ))}
            </div>
          </section>
          <section className="panel group-overview">
            <div className="group-title">
              <div><span className="eyebrow">GROUP OVERVIEW</span><h2><Skeleton className="h-6 w-36" /></h2><p><Skeleton className="mt-1 h-3 w-44" /></p></div>
            </div>
            <div className="group-metrics">
              <div><small>Total shared expenses</small><b><Skeleton className="h-4 w-20" /></b></div>
              <div><small>Recorded expenses</small><b><Skeleton className="h-4 w-8" /></b></div>
              <div><small>Members</small><b><Skeleton className="h-4 w-8" /></b></div>
            </div>
            <div className="settlement-head"><div><h3>Who pays whom</h3><p>Suggested settlements after balancing everyone’s shares</p></div></div>
            <div className="settlement-list">
              <div className="settlement-row"><Skeleton className="h-3.5 w-full" /></div>
              <div className="settlement-row"><Skeleton className="h-3.5 w-4/5" /></div>
            </div>
          </section>
        </div>
      ) : !group ? (
        <section className="panel empty-state flex items-center justify-between gap-3">
          <p>Create a group to start sharing expenses.</p>
          <button type="button" className="primary" onClick={() => { setEditingGroup(null); setDialog('group'); }}><Plus size={16} /> Create group</button>
        </section>
      ) : <>
        <div className="groups-layout">
          <section className="panel group-list-panel">
            <div className="panel-head"><div><h2>Your groups</h2><p>Shared tabs with friends</p></div><UsersRound size={18} /></div>
            <div className="group-selector">
              {groups.map((item) => <button type="button" key={item.id} className={`group-select ${group.id === item.id ? 'active' : ''}`} onClick={() => setSelected(item.id)}>
                <span className="group-avatar">{item.name.slice(0, 1).toUpperCase()}</span>
                <span><b>{item.name}</b><small>{item.members.length} members</small></span><ArrowRight size={15} />
              </button>)}
            </div>
          </section>
          <section className="panel group-overview">
            <div className="group-title">
              <div><span className="eyebrow">GROUP OVERVIEW</span><h2>{group.name}</h2><p>{group.members.join(' · ')}</p></div>
              <div className="heading-actions flex-wrap">
                <button type="button" className="text-link" onClick={() => { setEditingGroup(group); setDialog('group'); }}><Pencil size={14} /> Edit trip</button>
                <button type="button" className="text-link" onClick={() => downloadGroupReport(group, groupExpenses, balances, settlements)}><Download size={14} /> PDF report</button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c95540] hover:underline"
                  onClick={() => onDeleteGroup(group)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
            <div className="group-metrics">
              <div><small>Total shared expenses</small><b>{formatCurrency(total)}</b></div>
              <div><small>Recorded entries</small><b>{groupExpenses.length}</b></div>
              <div><small>Members</small><b>{group.members.length}</b></div>
            </div>
            <div className="settlement-head"><div><h3>Who pays whom</h3><p>Suggested settlements after balancing everyone’s shares</p></div></div>
            {settlements.length ? <div className="settlement-list">{settlements.map((settlement, index) => (
              <div className="settlement-row flex-wrap" key={`${settlement.from}-${settlement.to}-${index}`}>
                <span className="settle-person">{settlement.from}</span>
                <span className="settle-arrow">pays <ArrowRight size={14} /></span>
                <span className="settle-person">{settlement.to}</span>
                <b>{formatCurrency(settlement.amount)}</b>
                <button
                  type="button"
                  onClick={() => onSettleUp(group.id, settlement.from, settlement.to, settlement.amount)}
                  className="ml-2 inline-flex items-center gap-1 rounded-md border border-[#cde6da] bg-[#edf7f2] px-2 py-1 text-[9px] font-semibold text-[#258562] hover:bg-[#dff1e8] dark:border-[#2c4f41] dark:bg-[#203c35] dark:text-[#73d2a9]"
                >
                  <Check size={11} /> Mark settled
                </button>
              </div>
            ))}</div> : <div className="settlement-empty"><Check size={16} /> Everyone is settled up for this group.</div>}
          </section>
        </div>

        <section className="panel group-panel">
          <div className="panel-head"><div><h2>Balances by member</h2><p>Positive means they should receive; negative means they owe</p></div></div>
          <div className="member-balances">{balances.map((balance) => <div className="member-balance" key={balance.name}>
            <span className="person-avatar lent">{balance.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span>
            <span><b>{balance.name}</b><small>{balance.amount > 0 ? 'gets back' : balance.amount < 0 ? 'owes' : 'settled'}</small></span>
            <strong className={balance.amount >= 0 ? 'green-text' : 'debt-text'}>{formatCurrency(Math.abs(balance.amount))}</strong>
          </div>)}</div>
        </section>

        <section className="panel group-panel">
          <div className="panel-head"><div><h2>Shared expenses</h2><p>Expenses and each person’s share</p></div><button type="button" className="text-link" onClick={() => { setError(''); setEditingExpense(null); setUnequalSplit(false); setDialog('expense'); }}><Plus size={14} /> Add expense</button></div>
          {groupExpenses.length ? groupExpenses.map((expense) => <article className="shared-expense" key={expense.id}>
            <span className="shared-icon"><ReceiptText size={17} /></span>
            <span className="shared-title">
              <span className="flex items-center gap-1.5">
                <b>{expense.title}</b>
                {expense.isSettlement && <Badge tone="success">Settlement</Badge>}
              </span>
              <small>Paid by {expense.paidBy} · {formatDate(expense.date)}</small>
              <small>Shares: {Object.entries(expense.shares).map(([name, share]) => `${name} ${formatCurrency(share)}`).join(' · ')}</small>
            </span>
            <strong>{formatCurrency(expense.amount)}</strong>
            {!expense.isSettlement && (
              <button type="button" className="delete-khata" onClick={() => { setEditingExpense(expense); setUnequalSplit(true); setError(''); setDialog('expense'); }} title="Edit expense" aria-label={`Edit ${expense.title}`}><Pencil size={15} /></button>
            )}
            <button type="button" className="delete-khata" onClick={() => onDeleteExpense(expense)} title="Delete expense" aria-label={`Delete ${expense.title}`}><X size={15} /></button>
          </article>) : <div className="empty-state">No shared expenses yet.</div>}
        </section>
      </>}

      {dialog === 'group' && (
        <Modal size="md" onClose={() => { setDialog(''); setEditingGroup(null); }} ariaLabel={editingGroup ? 'Edit trip' : 'Create a group'}>
          <ModalHeader title={editingGroup ? 'Edit trip' : 'Create a group'} onClose={() => { setDialog(''); setEditingGroup(null); }} />
          <form className="space-y-3.5 overflow-y-auto px-5 py-4" onSubmit={createGroup}>
            <Field label="Group name">
              <Input required name="name" defaultValue={editingGroup?.name} placeholder="e.g. Goa trip" />
            </Field>
            <Field label="Friends · comma separated (You are included automatically)">
              <Textarea required name="members" defaultValue={editingGroup?.members.filter((member) => member !== 'You').join(', ')} rows={3} placeholder="Rahul, Neha, Amit" />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setDialog(''); setEditingGroup(null); }}>Cancel</Button>
              <Button type="submit" variant="primary">{editingGroup ? 'Save trip changes' : 'Create group'}</Button>
            </div>
          </form>
        </Modal>
      )}
      {dialog === 'expense' && group && (
        <Modal size="md" onClose={() => { setDialog(''); setEditingExpense(null); }} ariaLabel={editingExpense ? 'Edit shared expense' : 'Add shared expense'}>
          <ModalHeader title={editingExpense ? 'Edit shared expense' : 'Add shared expense'} onClose={() => { setDialog(''); setEditingExpense(null); }} />
          <form className="space-y-3.5 overflow-y-auto px-5 py-4" onSubmit={addExpense}>
            <Field label="What was the expense for?">
              <Input name="title" required defaultValue={editingExpense?.title} placeholder="Expense description" />
            </Field>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Total amount">
                <Input name="amount" required min="0.01" type="number" step="0.01" prefixText="₹" defaultValue={editingExpense?.amount} placeholder="0.00" />
              </Field>
              <Field label="Paid by">
                <Select name="paidBy" defaultValue={editingExpense?.paidBy}>
                  {group.members.map((member) => <option key={member}>{member}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Date">
              <Input type="date" name="date" defaultValue={editingExpense?.date || today} />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-[#526066] dark:text-[#b4c2be]">
              <input type="checkbox" className="accent-[#2fa77d]" checked={unequalSplit} onChange={(event) => setUnequalSplit(event.target.checked)} />
              Use unequal split
            </label>
            {unequalSplit ? (
              <div className="space-y-2 rounded-xl border border-[#edf0f2] bg-[#fafcfb] p-3 dark:border-[#2a383a] dark:bg-[#162123]">
                <p className="text-[10.5px] font-medium text-[#657276] dark:text-[#a8b6b2]">Each person’s share</p>
                {group.members.map((member) => (
                  <label className="flex items-center justify-between gap-3 text-[11px] text-[#526066] dark:text-[#cbd6d3]" key={member}>
                    <span>{member}</span>
                    <div className="w-28">
                      <Input compact name={`share-${member}`} type="number" min="0" step="0.01" required prefixText="₹" defaultValue={editingExpense?.shares[member]} placeholder="0" />
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-[#dcebe5] bg-[#f0f8f4] p-3 text-[10.5px] leading-5 text-[#527063] dark:border-[#2c4a40] dark:bg-[#1f342d] dark:text-[#cde5dc]">
                Split equally among all {group.members.length} members. Switch on unequal split to adjust individual shares.
              </p>
            )}
            {error && <p className="text-[11px] text-[#c95540]" role="alert">{error}</p>}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setDialog(''); setEditingExpense(null); }}>Cancel</Button>
              <Button type="submit" variant="primary">{editingExpense ? 'Save changes' : 'Save expense & split'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

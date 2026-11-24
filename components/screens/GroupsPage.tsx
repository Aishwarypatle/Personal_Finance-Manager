'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, Download, Pencil, Plus, ReceiptText, UsersRound, X } from 'lucide-react';
import { today, formatCurrency, formatDate } from '@/lib/format';
import { calculateSettlements } from '@/lib/settlements';
import type { ExpenseGroup, GroupExpense } from '@/lib/types';
import { ModalTitle } from '@/components/shared/ModalTitle';
import { PageHeading } from '@/components/shared/PageHeading';
import { downloadGroupReport } from '@/lib/groupReport';

type Props = {
  groups: ExpenseGroup[];
  expenses: GroupExpense[];
  selected: number;
  setSelected: (id: number) => void;
  onCreateGroup: (group: ExpenseGroup) => void;
  onUpdateGroup: (group: ExpenseGroup) => void;
  onAddExpense: (expense: GroupExpense) => void;
  onUpdateExpense: (expense: GroupExpense) => void;
  onDeleteExpense: (id: number) => void;
  onToast: (message: string, type?: 'success' | 'error') => void;
};

export function GroupsPage({ groups, expenses, selected, setSelected, onCreateGroup, onUpdateGroup, onAddExpense, onUpdateExpense, onDeleteExpense, onToast }: Props) {
  const [dialog, setDialog] = useState<'group' | 'expense' | ''>('');
  const [error, setError] = useState('');
  const [editingGroup, setEditingGroup] = useState<ExpenseGroup | null>(null);
  const [editingExpense, setEditingExpense] = useState<GroupExpense | null>(null);
  const [unequalSplit, setUnequalSplit] = useState(false);
  const group = groups.find((item) => item.id === selected) || groups[0];
  const groupExpenses = group ? expenses.filter((expense) => expense.groupId === group.id) : [];
  const total = groupExpenses.reduce((sum, expense) => sum + expense.amount, 0);
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
          <button type="button" className="outline-button" onClick={() => { setEditingGroup(null); setDialog('group'); }}><Plus size={15} /> New group</button>
          {group && <button type="button" className="primary" onClick={() => { setError(''); setEditingExpense(null); setUnequalSplit(false); setDialog('expense'); }}><Plus size={16} /> Add expense</button>}
        </div>}
      />

      {!group ? (
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
            <div className="group-title"><div><span className="eyebrow">GROUP OVERVIEW</span><h2>{group.name}</h2><p>{group.members.join(' · ')}</p></div><div className="heading-actions"><button type="button" className="text-link" onClick={() => { setEditingGroup(group); setDialog('group'); }}><Pencil size={14} /> Edit trip</button><button type="button" className="text-link" onClick={() => downloadGroupReport(group, groupExpenses, balances, settlements)}><Download size={14} /> PDF report</button></div></div>
            <div className="group-metrics">
              <div><small>Total shared expenses</small><b>{formatCurrency(total)}</b></div>
              <div><small>Recorded expenses</small><b>{groupExpenses.length}</b></div>
              <div><small>Members</small><b>{group.members.length}</b></div>
            </div>
            <div className="settlement-head"><div><h3>Who pays whom</h3><p>Suggested settlements after balancing everyone’s shares</p></div></div>
            {settlements.length ? <div className="settlement-list">{settlements.map((settlement, index) => <div className="settlement-row" key={`${settlement.from}-${settlement.to}-${index}`}>
              <span className="settle-person">{settlement.from}</span><span className="settle-arrow">pays <ArrowRight size={14} /></span><span className="settle-person">{settlement.to}</span><b>{formatCurrency(settlement.amount)}</b>
            </div>)}</div> : <div className="settlement-empty"><Check size={16} /> Everyone is settled up for this group.</div>}
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
            <span className="shared-title"><b>{expense.title}</b><small>Paid by {expense.paidBy} · {formatDate(expense.date)}</small><small>Shares: {Object.entries(expense.shares).map(([name, share]) => `${name} ${formatCurrency(share)}`).join(' · ')}</small></span>
            <strong>{formatCurrency(expense.amount)}</strong>
            <button type="button" className="delete-khata" onClick={() => { setEditingExpense(expense); setUnequalSplit(true); setError(''); setDialog('expense'); }} title="Edit expense" aria-label={`Edit ${expense.title}`}><Pencil size={15} /></button>
            <button type="button" className="delete-khata" onClick={() => onDeleteExpense(expense.id)} title="Delete expense" aria-label={`Delete ${expense.title}`}><X size={15} /></button>
          </article>) : <div className="empty-state">No shared expenses yet.</div>}
        </section>
      </>}

      {dialog === 'group' && <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setDialog('')}>
        <form className="modal" onSubmit={createGroup}>
          <ModalTitle title={editingGroup ? 'Edit trip' : 'Create a group'} onClose={() => { setDialog(''); setEditingGroup(null); }} />
          <label className="field">Group name<input required name="name" defaultValue={editingGroup?.name} placeholder="e.g. Goa trip" /></label>
          <label className="field">Friends <small>Comma separated; You are included automatically</small><textarea required name="members" defaultValue={editingGroup?.members.filter((member) => member !== 'You').join(', ')} rows={3} placeholder="Rahul, Neha, Amit" /></label>
          <button type="submit" className="primary submit-button">{editingGroup ? 'Save trip changes' : 'Create group'}</button>
        </form>
      </div>}
      {dialog === 'expense' && group && <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && setDialog('')}>
        <form className="modal" onSubmit={addExpense}>
          <ModalTitle title={editingExpense ? 'Edit shared expense' : 'Add shared expense'} onClose={() => { setDialog(''); setEditingExpense(null); }} />
          <label className="field">What was the expense for?<input name="title" required defaultValue={editingExpense?.title} placeholder="Expense description" /></label>
          <div className="form-row">
            <label className="field">Total amount<input name="amount" required min="0.01" type="number" step="0.01" defaultValue={editingExpense?.amount} placeholder="0" /></label>
            <label className="field">Paid by<select name="paidBy" defaultValue={editingExpense?.paidBy}>{group.members.map((member) => <option key={member}>{member}</option>)}</select></label>
          </div>
          <label className="field">Date<input type="date" name="date" defaultValue={editingExpense?.date || today} /></label>
          <label className="flex items-center gap-2 text-[11px] font-semibold text-[#526066]"><input type="checkbox" checked={unequalSplit} onChange={(event) => setUnequalSplit(event.target.checked)} /> Use unequal split</label>
          {unequalSplit ? <div className="share-fields"><p>Each person’s share</p>{group.members.map((member) => <label className="share-input" key={member}><span>{member}</span><input name={`share-${member}`} type="number" min="0" step="0.01" required defaultValue={editingExpense?.shares[member]} placeholder="0" /></label>)}</div> : <p className="rounded-lg border border-[#dcebe5] bg-[#f0f8f4] p-3 text-[10px] leading-5 text-[#527063]">Split equally among all {group.members.length} members. Switch on unequal split to adjust individual shares.</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary submit-button">{editingExpense ? 'Save changes' : 'Save expense & split'}</button>
        </form>
      </div>}
    </>
  );
}

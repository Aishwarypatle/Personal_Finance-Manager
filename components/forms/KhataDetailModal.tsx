'use client';

import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Check,
  Download,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { formatCurrency, formatDate, today } from '@/lib/format';
import { getKhataDueStatus, getKhataTotals } from '@/lib/financeHelpers';
import { downloadKhataReport } from '@/lib/khataReport';
import type { KhataEntry, KhataTransaction } from '@/lib/types';

type Props = {
  entry: KhataEntry;
  onAddTransaction: (personId: number, transaction: KhataTransaction) => void;
  onDeleteTransaction: (person: KhataEntry, transaction: KhataTransaction) => void;
  onSettle: (person: KhataEntry) => void;
  onEditPerson: (person: KhataEntry) => void;
  onDeletePerson: (person: KhataEntry) => void;
  onRemind: (person: KhataEntry) => void;
  onClose: () => void;
};

export function KhataDetailModal({
  entry,
  onAddTransaction,
  onDeleteTransaction,
  onSettle,
  onEditPerson,
  onDeletePerson,
  onRemind,
  onClose,
}: Props) {
  const [txType, setTxType] = useState<'gave' | 'got'>('gave');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const { gave, got, net } = getKhataTotals(entry);
  const dueStatus = getKhataDueStatus(entry);
  const digits = entry.phone.replace(/\D/g, '');
  const waPhone = digits.length === 10 ? `91${digits}` : digits;
  const initials = entry.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const historyWithBalance = useMemo(() => {
    const chronological = [...(entry.ledger || [])].sort((left, right) => {
      const dateCmp = left.date.localeCompare(right.date);
      return dateCmp !== 0 ? dateCmp : left.id - right.id;
    });
    let running = 0;
    const withBalance = chronological.map((item) => {
      running = Math.round((running + (item.type === 'gave' ? item.amount : -item.amount)) * 100) / 100;
      return { ...item, runningBalance: running };
    });
    return withBalance.reverse();
  }, [entry.ledger]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    onAddTransaction(entry.id, {
      id: Date.now(),
      type: txType,
      amount: Math.round(numeric * 100) / 100,
      date: date || today,
      note: note.trim(),
    });
    setAmount('');
    setNote('');
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#121e21]/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[86vh] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl border border-[#e6ecea] bg-white shadow-[0_24px_60px_rgba(16,32,36,0.18)] dark:border-[#2a383a] dark:bg-[#192527]"
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.name} khata`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#eff3f2] px-5 py-4 dark:border-[#273537]">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-medium ${
                net > 0
                  ? 'bg-[#ebf6f0] text-[#2d8e69] dark:bg-[#1e3830] dark:text-[#73d2a9]'
                  : net < 0
                    ? 'bg-[#fff1ec] text-[#c7644f] dark:bg-[#382724] dark:text-[#f0a092]'
                    : 'bg-[#f2f4f5] text-[#6d7a7f] dark:bg-[#243235] dark:text-[#a8b6b3]'
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-display text-[15px] font-semibold tracking-tight text-[#233036] dark:text-[#e6eeec]">
                  {entry.name}
                </h2>
                {dueStatus === 'overdue' && (
                  <span className="rounded-full bg-[#fff1ec] px-2 py-0.5 text-[9px] font-medium text-[#c55a45] dark:bg-[#382724] dark:text-[#f0a092]">
                    Overdue
                  </span>
                )}
                {dueStatus === 'due-today' && (
                  <span className="rounded-full bg-[#fff8e8] px-2 py-0.5 text-[9px] font-medium text-[#a97214] dark:bg-[#3a301d] dark:text-[#f2c464]">
                    Due today
                  </span>
                )}
              </div>
              <p className="mt-0.5 truncate text-[11px] font-normal text-[#879397]">
                {entry.phone || 'Personal ledger'}
                {entry.due ? ` · Due ${formatDate(entry.due)}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => downloadKhataReport(entry)}
              title="Download PDF statement"
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#e6ecea] bg-white px-2.5 text-[11px] font-medium text-[#4e615c] transition-colors hover:border-[#32a881] hover:text-[#278c6a] dark:border-[#304042] dark:bg-[#1d2b2d] dark:text-[#c4d2ce]"
            >
              <Download size={13} /> PDF
            </button>
            <button
              type="button"
              onClick={() => onEditPerson(entry)}
              title="Edit person"
              aria-label="Edit person"
              className="grid h-8 w-8 place-items-center rounded-lg text-[#849195] transition-colors hover:bg-[#f4f7f6] hover:text-[#233036] dark:hover:bg-[#243235] dark:hover:text-[#e6eeec]"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDeletePerson(entry)}
              title="Delete person"
              aria-label="Delete person"
              className="grid h-8 w-8 place-items-center rounded-lg text-[#849195] transition-colors hover:bg-[#fff2ef] hover:text-[#c95540] dark:hover:bg-[#3b2927] dark:hover:text-[#f29b8b]"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="ml-0.5 grid h-8 w-8 place-items-center rounded-lg text-[#849195] transition-colors hover:bg-[#f4f7f6] hover:text-[#233036] dark:hover:bg-[#243235] dark:hover:text-[#e6eeec]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e9efed] bg-[#f7faf9] px-4 py-3.5 dark:border-[#2a383a] dark:bg-[#1e2c2e]">
            <div>
              <span className="block text-[11px] font-normal text-[#79878b] dark:text-[#98a8a4]">
                {net > 0 ? 'You will get' : net < 0 ? 'You will give' : 'All settled'}
              </span>
              <div
                className={`mt-0.5 font-display text-[22px] font-semibold tabular-nums tracking-tight ${
                  net > 0
                    ? 'text-[#258562] dark:text-[#6ed0a5]'
                    : net < 0
                      ? 'text-[#c95540] dark:text-[#f29b8b]'
                      : 'text-[#5b696d] dark:text-[#b4c2be]'
                }`}
              >
                {net === 0 ? '₹0' : formatCurrency(Math.abs(net))}
              </div>
              <span className="mt-0.5 block text-[11px] font-normal text-[#899599]">
                Gave {formatCurrency(gave)} · Got {formatCurrency(got)}
              </span>
            </div>

            {net !== 0 && (
              <div className="flex items-center gap-1.5">
                {net > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemind(entry)}
                    title="Copy reminder"
                    aria-label="Copy reminder"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-[#e3e9e7] bg-white text-[#5c6b67] transition-colors hover:border-[#32a881] hover:text-[#278c6a] dark:border-[#324244] dark:bg-[#192527] dark:text-[#bfd0cc]"
                  >
                    <Bell size={14} />
                  </button>
                )}
                {net > 0 && waPhone.length >= 10 && (
                  <a
                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${entry.name}, friendly reminder about the pending ${formatCurrency(net)}${entry.note ? ` for ${entry.note}` : ''}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp reminder"
                    aria-label="Send WhatsApp reminder"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-[#e3e9e7] bg-white text-[#278c6a] transition-colors hover:border-[#32a881] dark:border-[#324244] dark:bg-[#192527] dark:text-[#6ed0a5]"
                  >
                    <MessageCircle size={14} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => onSettle(entry)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#2fa77d] px-3 text-[11px] font-medium text-white transition-colors hover:bg-[#27916c]"
                >
                  <Check size={14} /> Settle up
                </button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 rounded-xl border border-[#edf1f0] bg-white p-3.5 dark:border-[#2a383a] dark:bg-[#162123]">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#f2f5f4] p-1 dark:bg-[#223032]">
              <button
                type="button"
                onClick={() => setTxType('gave')}
                className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-all ${
                  txType === 'gave'
                    ? 'bg-white text-[#c75a45] shadow-xs dark:bg-[#192527] dark:text-[#f0a092]'
                    : 'text-[#778589] hover:text-[#425054] dark:text-[#9baaa7]'
                }`}
              >
                <ArrowUpRight size={13} /> You Gave
              </button>
              <button
                type="button"
                onClick={() => setTxType('got')}
                className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-all ${
                  txType === 'got'
                    ? 'bg-white text-[#278c6a] shadow-xs dark:bg-[#192527] dark:text-[#6ed0a5]'
                    : 'text-[#778589] hover:text-[#425054] dark:text-[#9baaa7]'
                }`}
              >
                <ArrowDownLeft size={13} /> You Got
              </button>
            </div>

            <div className="grid grid-cols-[1fr_132px] gap-2 max-[460px]:grid-cols-1">
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[12px] text-[#8d999d]">₹</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => {
                    setAmount(event.target.value);
                    setError('');
                  }}
                  className="h-9 w-full rounded-lg border border-[#e5ebe9] bg-[#fafcfb] pr-3 pl-7 text-[12px] font-medium text-[#233036] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#e6eeec]"
                />
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                aria-label="Entry date"
                className="h-9 w-full rounded-lg border border-[#e5ebe9] bg-[#fafcfb] px-2.5 text-[11px] font-normal text-[#56656a] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#cbd6d3]"
              />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                type="text"
                placeholder="Note (optional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="h-9 min-w-0 rounded-lg border border-[#e5ebe9] bg-[#fafcfb] px-3 text-[12px] font-normal text-[#233036] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#e6eeec]"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#2fa77d] px-4 text-[11px] font-medium text-white transition-colors hover:bg-[#27916c]"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            {error && <p className="text-[11px] text-[#c95540]" role="alert">{error}</p>}
          </form>

          <div>
            <div className="mb-2 flex items-center justify-between px-0.5">
              <span className="text-[11px] font-medium text-[#5c6a6e] dark:text-[#a8b6b2]">
                History ({historyWithBalance.length})
              </span>
              <span className="text-[10px] font-normal text-[#96a2a6]">Newest first</span>
            </div>

            {historyWithBalance.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e5ebe8] py-7 text-center text-[11px] font-normal text-[#98a3a6] dark:border-[#2a383a]">
                No entries yet. Add a You Gave or You Got entry above.
              </div>
            ) : (
              <div className="divide-y divide-[#f1f4f3] dark:divide-[#273537]">
                {historyWithBalance.map((item) => (
                  <div key={item.id} className="group flex items-center gap-3 py-2.5">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        item.type === 'gave'
                          ? 'bg-[#fff3ef] text-[#c7644f] dark:bg-[#382724] dark:text-[#f0a092]'
                          : 'bg-[#eef8f3] text-[#2a926e] dark:bg-[#1e3830] dark:text-[#6ed0a5]'
                      }`}
                    >
                      {item.type === 'gave' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[12px] font-medium text-[#2d3a40] dark:text-[#e0e9e6]">
                          {item.note || (item.type === 'gave' ? 'You gave' : 'You got')}
                        </span>
                        {item.isSettlement && (
                          <span className="rounded bg-[#eef7f2] px-1.5 py-0.5 text-[9px] font-medium text-[#2a926e] dark:bg-[#203c35] dark:text-[#73d2a9]">
                            Settled
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] font-normal text-[#95a0a4]">{formatDate(item.date)}</span>
                    </div>

                    <div className="text-right tabular-nums">
                      <span
                        className={`block text-[12px] font-medium ${
                          item.type === 'gave' ? 'text-[#c75a45]' : 'text-[#278c6a]'
                        }`}
                      >
                        {item.type === 'gave' ? '−' : '+'}
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="block text-[10px] font-normal text-[#95a0a4]">
                        {item.runningBalance === 0
                          ? 'Settled'
                          : item.runningBalance > 0
                            ? `Get ${formatCurrency(item.runningBalance)}`
                            : `Give ${formatCurrency(Math.abs(item.runningBalance))}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(entry, item)}
                      title="Delete entry"
                      aria-label="Delete khata transaction"
                      className="rounded p-1 text-[#c2c9ca] opacity-0 transition-opacity hover:text-[#c95540] group-hover:opacity-100 max-[560px]:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

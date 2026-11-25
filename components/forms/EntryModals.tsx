import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { categories } from '@/lib/categories';
import { today } from '@/lib/format';
import type { KhataEntry, TransactionFormState } from '@/lib/types';
import { ModalTitle } from '@/components/shared/ModalTitle';

type TransactionModalProps = {
  form: TransactionFormState;
  mode?: 'create' | 'edit';
  onChange: (form: TransactionFormState) => void;
  onSave: (event: FormEvent) => void;
  onClose: () => void;
};

export function TransactionModal({ form, mode = 'create', onChange, onSave, onClose }: TransactionModalProps) {
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={onSave}>
        <ModalTitle title={mode === 'edit' ? 'Edit transaction' : 'Add transaction'} onClose={onClose} />
        <div className="type-toggle">
          <label><input type="radio" checked={form.type === 'expense'} onChange={() => onChange({ ...form, type: 'expense' })}/> Expense</label>
          <label><input type="radio" checked={form.type === 'income'} onChange={() => onChange({ ...form, type: 'income' })}/> Income</label>
        </div>
        <label className="field">Amount<input required type="number" min="1" value={form.amount} onChange={(event) => onChange({ ...form, amount: event.target.value })}/></label>
        <label className="field">Description<input required value={form.title} onChange={(event) => onChange({ ...form, title: event.target.value })}/></label>
        <div className="form-row">
          <label className="field">Category<select value={form.category} onChange={(event) => onChange({ ...form, category: event.target.value })}>{categories.map(([name]) => <option key={name}>{name}</option>)}</select></label>
          <label className="field">Date<input type="date" value={form.date} onChange={(event) => onChange({ ...form, date: event.target.value })}/></label>
        </div>
        <label className="field">
          Repeat
          <select
            value={form.recurring}
            onChange={(event) => onChange({ ...form, recurring: event.target.value as TransactionFormState['recurring'] })}
          >
            <option value="none">Does not repeat</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <button type="submit" className="primary submit-button"><Plus size={16}/>{mode === 'edit' ? 'Save changes' : 'Save transaction'}</button>
      </form>
    </div>
  );
}

type KhataModalProps = { entry?: KhataEntry; onSave: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void };

export function KhataModal({ entry, onSave, onClose }: KhataModalProps) {
  const [direction, setDirection] = useState<'gave' | 'got'>('gave');

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#121e21]/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        className="w-full max-w-[430px] rounded-2xl border border-[#e6ecea] bg-white p-5 shadow-[0_24px_60px_rgba(16,32,36,0.18)] dark:border-[#2a383a] dark:bg-[#192527]"
        onSubmit={onSave}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-semibold tracking-tight text-[#233036] dark:text-[#e6eeec]">
            {entry ? 'Edit person' : 'Add person'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#849195] transition-colors hover:bg-[#f4f7f6] hover:text-[#233036] dark:hover:bg-[#243235] dark:hover:text-[#e6eeec]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-[11px] font-medium text-[#6e7c80] dark:text-[#9aa8a4]">
            Person’s name
            <input
              required
              name="name"
              defaultValue={entry?.name}
              placeholder="Full name"
              className="mt-1.5 h-9 w-full rounded-lg border border-[#e5ebe9] bg-[#fafcfb] px-3 text-[12px] font-normal text-[#233036] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#e6eeec]"
            />
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="block text-[11px] font-medium text-[#6e7c80] dark:text-[#9aa8a4]">
              Phone <span className="font-normal text-[#9aa4a8]">(optional)</span>
              <input
                name="phone"
                type="tel"
                defaultValue={entry?.phone}
                placeholder="Contact number"
                className="mt-1.5 h-9 w-full rounded-lg border border-[#e5ebe9] bg-[#fafcfb] px-3 text-[12px] font-normal text-[#233036] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#e6eeec]"
              />
            </label>
            <label className="block text-[11px] font-medium text-[#6e7c80] dark:text-[#9aa8a4]">
              Due date <span className="font-normal text-[#9aa4a8]">(optional)</span>
              <input
                name="due"
                type="date"
                defaultValue={entry?.due}
                className="mt-1.5 h-9 w-full rounded-lg border border-[#e5ebe9] bg-[#fafcfb] px-2.5 text-[11px] font-normal text-[#56656a] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#cbd6d3]"
              />
            </label>
          </div>

          {!entry && (
            <div className="space-y-2.5 rounded-xl border border-[#edf1f0] bg-[#f8faf9] p-3 dark:border-[#2a383a] dark:bg-[#162123]">
              <input type="hidden" name="directionChoice" value={direction} />
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#eef2f1] p-1 dark:bg-[#223032]">
                <button
                  type="button"
                  onClick={() => setDirection('gave')}
                  className={`h-7 rounded-md text-[11px] font-medium transition-all ${
                    direction === 'gave'
                      ? 'bg-white text-[#c75a45] shadow-xs dark:bg-[#192527] dark:text-[#f0a092]'
                      : 'text-[#778589] dark:text-[#9baaa7]'
                  }`}
                >
                  You gave ₹
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('got')}
                  className={`h-7 rounded-md text-[11px] font-medium transition-all ${
                    direction === 'got'
                      ? 'bg-white text-[#278c6a] shadow-xs dark:bg-[#192527] dark:text-[#6ed0a5]'
                      : 'text-[#778589] dark:text-[#9baaa7]'
                  }`}
                >
                  You got ₹
                </button>
              </div>
              <div className="grid grid-cols-[1fr_132px] gap-2">
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[12px] text-[#8d999d]">₹</span>
                  <input
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Opening amount"
                    className="h-9 w-full rounded-lg border border-[#e5ebe9] bg-white pr-3 pl-7 text-[12px] font-normal text-[#233036] outline-none transition-colors focus:border-[#32a881] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#e6eeec]"
                  />
                </div>
                <input
                  name="date"
                  type="date"
                  defaultValue={today}
                  aria-label="Opening entry date"
                  className="h-9 w-full rounded-lg border border-[#e5ebe9] bg-white px-2.5 text-[11px] font-normal text-[#56656a] outline-none transition-colors focus:border-[#32a881] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#cbd6d3]"
                />
              </div>
            </div>
          )}

          <label className="block text-[11px] font-medium text-[#6e7c80] dark:text-[#9aa8a4]">
            Note <span className="font-normal text-[#9aa4a8]">(optional)</span>
            <textarea
              name="note"
              rows={2}
              defaultValue={entry?.note}
              placeholder="Reason or agreement"
              className="mt-1.5 w-full resize-y rounded-lg border border-[#e5ebe9] bg-[#fafcfb] px-3 py-2 text-[12px] font-normal text-[#233036] outline-none transition-colors focus:border-[#32a881] focus:bg-white dark:focus:bg-[#202e30] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#e6eeec]"
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-[#e5ebe9] bg-white px-3.5 text-[11px] font-medium text-[#5c6b6f] transition-colors hover:bg-[#f5f8f6] dark:border-[#324244] dark:bg-[#1b2729] dark:text-[#c4d2ce]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-9 rounded-lg bg-[#2fa77d] px-4 text-[11px] font-medium text-white transition-colors hover:bg-[#27916c]"
          >
            {entry ? 'Save changes' : 'Add person'}
          </button>
        </div>
      </form>
    </div>
  );
}

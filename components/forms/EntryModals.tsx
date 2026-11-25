import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { categories } from '@/lib/categories';
import { today } from '@/lib/format';
import type { KhataEntry, TransactionFormState } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { Modal, ModalHeader } from '@/components/ui/Modal';

type TransactionModalProps = {
  form: TransactionFormState;
  mode?: 'create' | 'edit';
  onChange: (form: TransactionFormState) => void;
  onSave: (event: FormEvent) => void;
  onClose: () => void;
};

export function TransactionModal({ form, mode = 'create', onChange, onSave, onClose }: TransactionModalProps) {
  return (
    <Modal size="md" onClose={onClose} ariaLabel={mode === 'edit' ? 'Edit transaction' : 'Add transaction'}>
      <ModalHeader title={mode === 'edit' ? 'Edit transaction' : 'Add transaction'} onClose={onClose} />
      <form className="space-y-3.5 overflow-y-auto px-5 py-4" onSubmit={onSave}>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#f1f4f3] p-1 dark:bg-[#223032]">
          <button
            type="button"
            onClick={() => onChange({ ...form, type: 'expense' })}
            className={`h-8 rounded-md text-[11px] font-medium transition-all ${
              form.type === 'expense'
                ? 'bg-white text-[#c75a45] shadow-xs dark:bg-[#192527] dark:text-[#f0a092]'
                : 'text-[#778589] hover:text-[#425054] dark:text-[#9baaa7]'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...form, type: 'income' })}
            className={`h-8 rounded-md text-[11px] font-medium transition-all ${
              form.type === 'income'
                ? 'bg-white text-[#278c6a] shadow-xs dark:bg-[#192527] dark:text-[#6ed0a5]'
                : 'text-[#778589] hover:text-[#425054] dark:text-[#9baaa7]'
            }`}
          >
            Income
          </button>
        </div>

        <Field label="Amount">
          <Input
            required
            type="number"
            min="1"
            step="0.01"
            prefixText="₹"
            placeholder="0.00"
            value={form.amount}
            onChange={(event) => onChange({ ...form, amount: event.target.value })}
          />
        </Field>

        <Field label="Description">
          <Input
            required
            placeholder="What was this for?"
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(event) => onChange({ ...form, category: event.target.value })}
            >
              {categories.map(([name]) => <option key={name}>{name}</option>)}
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={form.date}
              onChange={(event) => onChange({ ...form, date: event.target.value })}
            />
          </Field>
        </div>

        <Field label="Repeat">
          <Select
            value={form.recurring}
            onChange={(event) => onChange({ ...form, recurring: event.target.value as TransactionFormState['recurring'] })}
          >
            <option value="none">Does not repeat</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            <Plus size={15} /> {mode === 'edit' ? 'Save changes' : 'Save transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

type KhataModalProps = { entry?: KhataEntry; onSave: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void };

export function KhataModal({ entry, onSave, onClose }: KhataModalProps) {
  const [direction, setDirection] = useState<'gave' | 'got'>('gave');

  return (
    <Modal size="md" onClose={onClose} ariaLabel={entry ? 'Edit person' : 'Add person'}>
      <ModalHeader title={entry ? 'Edit person' : 'Add person'} onClose={onClose} />
      <form className="space-y-3.5 overflow-y-auto px-5 py-4" onSubmit={onSave}>
        <Field label="Person’s name">
          <Input required name="name" defaultValue={entry?.name} placeholder="Full name" />
        </Field>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Phone" optional>
            <Input name="phone" type="tel" defaultValue={entry?.phone} placeholder="Contact number" />
          </Field>
          <Field label="Due date" optional>
            <Input name="due" type="date" defaultValue={entry?.due} />
          </Field>
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
              <Input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                prefixText="₹"
                placeholder="Opening amount"
              />
              <Input name="date" type="date" defaultValue={today} aria-label="Opening entry date" />
            </div>
          </div>
        )}

        <Field label="Note" optional>
          <Textarea name="note" rows={2} defaultValue={entry?.note} placeholder="Reason or agreement" />
        </Field>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">
            {entry ? 'Save changes' : 'Add person'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

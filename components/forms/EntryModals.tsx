import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
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
        <button type="submit" className="primary submit-button"><Plus size={16}/>{mode === 'edit' ? 'Save changes' : 'Save transaction'}</button>
      </form>
    </div>
  );
}

type KhataModalProps = { entry?: KhataEntry; onSave: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void };

export function KhataModal({ entry, onSave, onClose }: KhataModalProps) {
  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={onSave}>
        <ModalTitle title={entry ? 'Edit money record' : 'Add money record'} onClose={onClose} />
        <div className="type-toggle">
          <label><input type="radio" name="directionChoice" value="lent" defaultChecked={!entry || entry.direction === 'lent'}/> I gave money</label>
          <label><input type="radio" name="directionChoice" value="borrowed" defaultChecked={entry?.direction === 'borrowed'}/> I took money</label>
        </div>
        <label className="field">Person’s name<input required name="name" defaultValue={entry?.name} placeholder="Full name"/></label>
        <label className="field">Phone number <small>optional</small><input name="phone" type="tel" defaultValue={entry?.phone} placeholder="Contact number"/></label>
        <div className="form-row">
          <label className="field">Total amount<input required name="amount" type="number" min="1" step="0.01" defaultValue={entry?.amount} placeholder="0"/></label>
          <label className="field">Already settled<input name="paid" type="number" min="0" step="0.01" defaultValue={entry?.paid} placeholder="0"/></label>
        </div>
        <div className="form-row">
          <label className="field">Entry date<input required name="date" type="date" defaultValue={entry?.date || today}/></label>
          <label className="field">Due date<input name="due" type="date" defaultValue={entry?.due}/></label>
        </div>
        <label className="field">Details / note<textarea name="note" rows={2} defaultValue={entry?.note} placeholder="Reason or payment agreement"/></label>
        <button type="submit" className="primary submit-button">{entry ? 'Save changes' : 'Save khata entry'}</button>
      </form>
    </div>
  );
}

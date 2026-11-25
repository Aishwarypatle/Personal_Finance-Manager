import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatCurrency } from '@/lib/format';
import type { KhataEntry } from '@/lib/types';
import { ModalTitle } from '@/components/shared/ModalTitle';

type Props = {
  entry: KhataEntry;
  onSave: (amount: number) => void;
  onClose: () => void;
};

export function PaymentModal({ entry, onSave, onClose }: Props) {
  const remaining = Math.max(0, Math.round((entry.amount - entry.paid) * 100) / 100);
  const [amount, setAmount] = useState(String(remaining));
  const [confirmingFull, setConfirmingFull] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    if (numeric > remaining) {
      setError(`Amount cannot exceed remaining ${formatCurrency(remaining)}.`);
      return;
    }
    if (Math.round(numeric * 100) >= Math.round(remaining * 100) && !confirmingFull) {
      setConfirmingFull(true);
      return;
    }
    onSave(numeric);
  };

  const quickPresets = [
    { label: '25%', value: Math.max(1, Math.round(remaining * 0.25)) },
    { label: '50%', value: Math.max(1, Math.round(remaining * 0.5)) },
    { label: 'Full', value: remaining },
  ];

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal" onSubmit={handleSubmit}>
        <ModalTitle title={entry.direction === 'lent' ? 'Record payment received' : 'Record payment made'} onClose={onClose} />
        <div className="rounded-lg border border-[#edf0f2] bg-[#f8faf9] p-3 text-[11px] dark:border-[#2d3b3d] dark:bg-[#202e30]">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#253138] dark:text-[#e3ebea]">{entry.name}</span>
            <span className="font-bold text-[#2fa77d]">{formatCurrency(remaining)} left</span>
          </div>
          <p className="mt-1 text-[10px] text-[#8a969a]">
            Total {formatCurrency(entry.amount)} · Settled {formatCurrency(entry.paid)}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          {quickPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setAmount(String(preset.value));
                setConfirmingFull(false);
                setError('');
              }}
              className="flex-1 rounded-md border border-[#e6ebea] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#526569] hover:border-[#32a881] hover:text-[#278c6a] dark:border-[#344446] dark:bg-[#172224] dark:text-[#c7d3d0]"
            >
              {preset.label} ({formatCurrency(preset.value)})
            </button>
          ))}
        </div>

        <label className="field">
          Payment amount
          <input
            type="number"
            min="0.01"
            max={remaining}
            step="0.01"
            required
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setConfirmingFull(false);
              setError('');
            }}
          />
        </label>

        {confirmingFull && (
          <div className="mt-3 rounded-lg border border-[#cfe5da] bg-[#eff8f3] p-3 text-[11px] text-[#285a47] dark:border-[#2c4a40] dark:bg-[#1b302a] dark:text-[#b9dfd0]">
            This will mark <b>{entry.name}</b> as fully settled ({formatCurrency(remaining)}). Click confirm below to complete.
          </div>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="mt-3 flex gap-2">
          {confirmingFull && (
            <button
              type="button"
              onClick={() => setConfirmingFull(false)}
              className="rounded-lg border border-[#e5ebe8] bg-white px-3.5 py-2.5 text-[11px] font-semibold text-[#5b696d] dark:border-[#344446] dark:bg-[#172224] dark:text-[#c7d3d0]"
            >
              Back
            </button>
          )}
          <button type="submit" className="primary submit-button !mt-0 flex-1">
            {confirmingFull ? 'Confirm full settlement' : 'Save payment'}
          </button>
        </div>
      </form>
    </div>
  );
}

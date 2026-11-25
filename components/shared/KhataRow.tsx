import { Bell, Check, MessageCircle, Pencil, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { getKhataDueStatus } from '@/lib/financeHelpers';
import type { KhataEntry } from '@/lib/types';

type Props = {
  entry: KhataEntry;
  onPayment: () => void;
  onSettle: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onRemind?: () => void;
};

export function KhataRow({ entry, onPayment, onSettle, onDelete, onEdit, onRemind }: Props) {
  const remaining = entry.amount - entry.paid;
  const settled = remaining <= 0;
  const dueStatus = getKhataDueStatus(entry);
  const digits = entry.phone.replace(/\D/g, '');
  const waPhone = digits.length === 10 ? `91${digits}` : digits;

  return (
    <article className="khata-row">
      <div className={`person-avatar ${entry.direction}`}>
        {entry.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
      </div>
      <div className="khata-person">
        <div className="flex flex-wrap items-center gap-1.5">
          <b>{entry.name}</b>
          {dueStatus === 'overdue' && (
            <span className="rounded-full bg-[#fff0eb] px-1.5 py-0.5 text-[8px] font-bold text-[#c95540] dark:bg-[#3c2724] dark:text-[#f29b8b]">
              Overdue
            </span>
          )}
          {dueStatus === 'due-today' && (
            <span className="rounded-full bg-[#fff7e6] px-1.5 py-0.5 text-[8px] font-bold text-[#b87b14] dark:bg-[#3a301d] dark:text-[#f2c464]">
              Due today
            </span>
          )}
        </div>
        <small>{entry.phone || 'No phone added'}</small>
        <p>{entry.note || 'No details added'}</p>
      </div>
      <div className="khata-direction">
        <span className={entry.direction}>
          {entry.direction === 'lent' ? 'They owe you' : 'You owe them'}
        </span>
        <small>
          {formatDate(entry.date)}
          {entry.due ? ` · Due ${formatDate(entry.due)}` : ''}
        </small>
      </div>
      <div className="khata-amount">
        <b>{formatCurrency(remaining)}</b>
        <small>
          of {formatCurrency(entry.amount)} · settled {formatCurrency(entry.paid)}
        </small>
      </div>
      <div className="khata-actions">
        {settled ? (
          <span className="settled-pill">
            <Check size={13} /> Settled
          </span>
        ) : (
          <>
            <button type="button" className="outline-button" onClick={onPayment}>
              {entry.direction === 'lent' ? 'Record received' : 'Record paid'}
            </button>
            <button
              type="button"
              onClick={onSettle}
              className="rounded-md border border-[#cde6da] bg-[#edf7f2] px-2.5 py-1.5 text-[9px] font-semibold text-[#258562] hover:bg-[#dff1e8] dark:border-[#2c4f41] dark:bg-[#203c35] dark:text-[#73d2a9]"
            >
              Settle
            </button>
            {entry.direction === 'lent' && onRemind && (
              <button
                type="button"
                className="delete-khata"
                onClick={onRemind}
                aria-label={`Copy payment reminder for ${entry.name}`}
                title="Copy reminder message"
              >
                <Bell size={14} />
              </button>
            )}
            {entry.direction === 'lent' && waPhone.length >= 10 && (
              <a
                className="delete-khata inline-flex items-center"
                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hi ${entry.name}, friendly reminder about the pending ${formatCurrency(remaining)}${entry.note ? ` for ${entry.note}` : ''}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Send WhatsApp reminder to ${entry.name}`}
                title="Send WhatsApp reminder"
              >
                <MessageCircle size={14} />
              </a>
            )}
          </>
        )}
        <button type="button" className="delete-khata" onClick={onEdit} aria-label={`Edit ${entry.name}`} title="Edit entry">
          <Pencil size={14} />
        </button>
        <button type="button" className="delete-khata" onClick={onDelete} aria-label="Delete entry" title="Delete entry">
          <X size={15} />
        </button>
      </div>
    </article>
  );
}

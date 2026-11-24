import { Check, Pencil, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import type { KhataEntry } from '@/lib/types';

type Props = {
  entry: KhataEntry;
  onPayment: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function KhataRow({ entry, onPayment, onDelete, onEdit }: Props) {
  const remaining = entry.amount - entry.paid;
  const settled = remaining <= 0;

  return (
    <article className="khata-row">
      <div className={`person-avatar ${entry.direction}`}>
        {entry.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
      </div>
      <div className="khata-person">
        <b>{entry.name}</b>
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
          <button type="button" className="outline-button" onClick={onPayment}>
            {entry.direction === 'lent' ? 'Record received' : 'Record paid'}
          </button>
        )}
        <button type="button" className="delete-khata" onClick={onEdit} aria-label={`Edit ${entry.name}`} title="Edit entry">
          <Pencil size={14} />
        </button>
        <button type="button" className="delete-khata" onClick={onDelete} aria-label="Delete entry">
          <X size={15} />
        </button>
      </div>
    </article>
  );
}

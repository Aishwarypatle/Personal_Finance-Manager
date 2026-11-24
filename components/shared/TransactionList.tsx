import { Ellipsis, Pencil, X } from 'lucide-react';
import { categories } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/types';

type Props = {
  transactions: Transaction[];
  onRemove: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
};

export function TransactionList({ transactions, onRemove, onEdit }: Props) {
  if (!transactions.length) {
    return <div className="empty-state">No transactions found.</div>;
  }

  return (
    <div className="tx-list">
      {transactions.map((transaction) => {
        const Icon =
          categories.find(([name]) => name === transaction.category)?.[2] || Ellipsis;
        return (
          <div className="tx-row" key={transaction.id}>
            <span className="tx-icon">
              <Icon size={17} />
            </span>
            <span className="tx-description">
              <b>{transaction.title}</b>
              <small>{transaction.category}</small>
            </span>
            <span className="tx-time">{formatDate(transaction.date)}</span>
            <b className="tx-amount">
              {transaction.type === 'income' ? '+' : '−'}
              {formatCurrency(transaction.amount)}
            </b>
            <button type="button" className="delete-tx" onClick={() => onEdit(transaction)} title="Edit transaction" aria-label={`Edit ${transaction.title}`}>
              <Pencil size={14} />
            </button>
            <button type="button"
              className="delete-tx"
              onClick={() => onRemove(transaction)}
              title="Delete transaction"
              aria-label={`Delete ${transaction.title}`}
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

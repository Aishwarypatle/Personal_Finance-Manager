import { Ellipsis, Pencil, X } from 'lucide-react';
import { categories } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '@/components/shared/Skeleton';

type Props = {
  transactions: Transaction[];
  isLoading?: boolean;
  onRemove: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
};

export function TransactionList({ transactions, isLoading = false, onRemove, onEdit }: Props) {
  if (isLoading) {
    return (
      <div className="tx-list" aria-busy="true" aria-label="Loading transactions">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="tx-row" key={index}>
            <span className="tx-icon skeleton" aria-hidden="true" />
            <span className="tx-description">
              <Skeleton className="block h-3 w-36 max-[560px]:w-24" />
              <Skeleton className="mt-1.5 block h-2.5 w-20" />
            </span>
            <span className="tx-time"><Skeleton className="h-2.5 w-14" /></span>
            <span className="tx-amount"><Skeleton className="h-3.5 w-16" /></span>
          </div>
        ))}
      </div>
    );
  }

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

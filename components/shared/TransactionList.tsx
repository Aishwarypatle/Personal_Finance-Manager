import { Ellipsis, Pencil, Repeat, X } from 'lucide-react';
import { categories } from '@/lib/categories';
import { formatCurrency, formatDate, formatDateHeading } from '@/lib/format';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '@/components/shared/Skeleton';

type Props = {
  transactions: Transaction[];
  isLoading?: boolean;
  groupByDate?: boolean;
  onRemove: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
};

export function TransactionList({ transactions, isLoading = false, groupByDate = false, onRemove, onEdit }: Props) {
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

  const renderRow = (transaction: Transaction) => {
    const match = categories.find(([name]) => name === transaction.category);
    const color = match?.[1] || '#98a2ad';
    const Icon = match?.[2] || Ellipsis;
    const isRecurring = transaction.recurring && transaction.recurring !== 'none';

    return (
      <div className="tx-row" key={transaction.id}>
        <span
          className="tx-icon"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Icon size={17} />
        </span>
        <span className="tx-description">
          <span className="flex items-center gap-1.5">
            <b>{transaction.title}</b>
            {isRecurring && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#edf6f2] px-1.5 py-0.5 text-[8px] font-semibold text-[#278c6a] dark:bg-[#203c35] dark:text-[#6ed0a5]">
                <Repeat size={9} />
                {transaction.recurring}
              </span>
            )}
          </span>
          <small>{transaction.category}</small>
        </span>
        <span className="tx-time">{formatDate(transaction.date)}</span>
        <b className={`tx-amount ${transaction.type === 'income' ? 'income' : ''}`}>
          {transaction.type === 'income' ? '+' : '−'}
          {formatCurrency(transaction.amount)}
        </b>
        <button type="button" className="delete-tx" onClick={() => onEdit(transaction)} title="Edit transaction" aria-label={`Edit ${transaction.title}`}>
          <Pencil size={14} />
        </button>
        <button
          type="button"
          className="delete-tx"
          onClick={() => onRemove(transaction)}
          title="Delete transaction"
          aria-label={`Delete ${transaction.title}`}
        >
          <X size={15} />
        </button>
      </div>
    );
  };

  if (!groupByDate) {
    return <div className="tx-list">{transactions.map(renderRow)}</div>;
  }

  const groups: { date: string; items: Transaction[] }[] = [];
  for (const transaction of transactions) {
    const last = groups[groups.length - 1];
    if (last && last.date === transaction.date) {
      last.items.push(transaction);
    } else {
      groups.push({ date: transaction.date, items: [transaction] });
    }
  }

  return (
    <div className="tx-list">
      {groups.map((group) => (
        <div className="tx-group" key={group.date}>
          <div className="tx-date">{formatDateHeading(group.date)}</div>
          {group.items.map(renderRow)}
        </div>
      ))}
    </div>
  );
}

import { ArrowDownLeft, ArrowUpRight, Check, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { getKhataDueStatus, getKhataTotals } from '@/lib/financeHelpers';
import type { KhataEntry } from '@/lib/types';

type Props = {
  entry: KhataEntry;
  onOpen: () => void;
};

export function KhataRow({ entry, onOpen }: Props) {
  const { net } = getKhataTotals(entry);
  const dueStatus = getKhataDueStatus(entry);
  const count = entry.ledger?.length || 0;
  const lastDate = entry.ledger?.length
    ? [...entry.ledger].sort((left, right) => right.date.localeCompare(left.date))[0].date
    : entry.date || '';
  const initials = entry.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isReceive = net > 0;
  const isPay = net < 0;
  const isSettled = net === 0;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative flex w-full cursor-pointer flex-col justify-between gap-4 rounded-xl border p-[18px] text-left transition-all duration-150 ${
        isSettled
          ? 'border-dashed border-[#dde3e1] bg-[#f3f5f4]/80 opacity-60 hover:border-[#bcc7c4] hover:opacity-85 dark:border-[#2a3739] dark:bg-[#172123]/70 dark:opacity-55 dark:hover:border-[#3c4d50] dark:hover:opacity-85'
          : 'border-[#e9eeec] bg-[#fafcfb] hover:-translate-y-0.5 hover:border-[#32a881]/60 hover:bg-white hover:shadow-[0_8px_22px_rgba(24,44,48,0.06)] dark:border-[#2a383a] dark:bg-[#1e2b2d] dark:hover:border-[#32a881]/60 dark:hover:bg-[#233235] dark:hover:shadow-none'
      }`}
    >
      {/* Top Identity Row */}
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[12px] font-semibold ring-1 ring-inset ${
              isReceive
                ? 'bg-[#eaf6f0] text-[#278c6a] ring-[#cde8da] dark:bg-[#1e3930] dark:text-[#73d2a9] dark:ring-[#2b5244]'
                : isPay
                  ? 'bg-[#fff1ec] text-[#c75a45] ring-[#f5d5cc] dark:bg-[#3a2623] dark:text-[#f0a092] dark:ring-[#573630]'
                  : 'bg-[#eff3f2] text-[#647378] ring-[#e1e7e6] dark:bg-[#253437] dark:text-[#a8b6b3] dark:ring-[#324346]'
            }`}
          >
            {initials || '?'}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-[13.5px] font-semibold tracking-tight text-[#223036] dark:text-[#e6eeec]">
              {entry.name}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] font-normal text-[#899599]">
              <span className="truncate">{entry.phone || `${count} ${count === 1 ? 'entry' : 'entries'}`}</span>
              {entry.phone && <span>· {count} {count === 1 ? 'entry' : 'entries'}</span>}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {dueStatus === 'overdue' ? (
            <span className="rounded-full bg-[#fff0eb] px-2 py-0.5 text-[9px] font-medium text-[#c55a45] dark:bg-[#3c2724] dark:text-[#f29b8b]">
              Overdue
            </span>
          ) : dueStatus === 'due-today' ? (
            <span className="rounded-full bg-[#fff8e6] px-2 py-0.5 text-[9px] font-medium text-[#a97214] dark:bg-[#3a301d] dark:text-[#f2c464]">
              Due today
            </span>
          ) : dueStatus === 'upcoming' && entry.due ? (
            <span className="rounded-full bg-[#f1f5f4] px-2 py-0.5 text-[9px] font-medium text-[#5d6c70] dark:bg-[#253437] dark:text-[#a8b6b3]">
              Due {formatDate(entry.due)}
            </span>
          ) : net === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e9edec] px-2 py-0.5 text-[9px] font-medium text-[#6f7d81] dark:bg-[#243235] dark:text-[#98a6a3]">
              <Check size={10} /> Settled
            </span>
          ) : (
            <span
              className={`grid h-6 w-6 place-items-center rounded-full ${
                isReceive
                  ? 'bg-[#eaf6f0] text-[#278c6a] dark:bg-[#1e3930] dark:text-[#73d2a9]'
                  : 'bg-[#fff1ec] text-[#c75a45] dark:bg-[#3a2623] dark:text-[#f0a092]'
              }`}
            >
              {isReceive ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Final Settlement Row */}
      <div className="flex w-full items-end justify-between border-t border-[#ebf0ee] pt-3 dark:border-[#2a383a]">
        <div>
          <span
            className={`block text-[10px] font-medium ${
              isReceive
                ? 'text-[#2b936f] dark:text-[#6ed0a5]'
                : isPay
                  ? 'text-[#c75a45] dark:text-[#f0a092]'
                  : 'text-[#899599]'
            }`}
          >
            {isReceive ? 'You will get' : isPay ? 'You will give' : 'Final balance'}
          </span>
          <span className="mt-0.5 block text-[10px] font-normal text-[#96a2a6]">
            {lastDate ? `Updated ${formatDate(lastDate)}` : 'No activity yet'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <strong
            className={`font-display text-[19px] font-semibold tabular-nums tracking-tight ${
              isReceive
                ? 'text-[#238260] dark:text-[#6ed0a5]'
                : isPay
                  ? 'text-[#c75a45] dark:text-[#f0a092]'
                  : 'text-[#6c7a7e] dark:text-[#9baaa7]'
            }`}
          >
            {net === 0 ? '₹0' : formatCurrency(Math.abs(net))}
          </strong>
          <ChevronRight
            size={14}
            className="text-[#b8c3c6] transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#32a881]"
          />
        </div>
      </div>
    </button>
  );
}

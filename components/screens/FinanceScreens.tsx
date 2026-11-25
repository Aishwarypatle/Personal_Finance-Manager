import type { ChangeEvent } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookUser,
  Download,
  HandCoins,
  Plus,
  Repeat,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { categories } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';
import { computeBudgetProgress, getKhataDueStatus, getKhataTotals, sortKhataEntries } from '@/lib/financeHelpers';
import type {
  BudgetRule,
  DatabaseStatus,
  DateFilter,
  KhataEntry,
  LedgerBackup,
  ToastType,
  Transaction,
} from '@/lib/types';
import { KhataRow } from '@/components/shared/KhataRow';
import { PageHeading } from '@/components/shared/PageHeading';
import { Skeleton } from '@/components/shared/Skeleton';
import { SpendingCharts } from '@/components/shared/SpendingCharts';
import { TransactionList } from '@/components/shared/TransactionList';
import { DateRangeFilter } from '@/components/shared/DateRangeFilter';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/Input';

type SearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

type BudgetProgressProps = {
  allTransactions: Transaction[];
  budgets: BudgetRule[];
  onManageBudgets: () => void;
};

function BudgetStatusSection({ allTransactions, budgets, onManageBudgets }: BudgetProgressProps) {
  const progress = computeBudgetProgress(allTransactions, budgets);

  return (
    <section className="mt-4 rounded-[10px] border border-[#edf0f2] bg-white p-[18px] shadow-[0_2px_9px_#1b303b05] dark:border-[#2b3a3c] dark:bg-[#1a2628] dark:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-[13px] font-bold text-[#253138] dark:text-[#e4ecea]">Monthly budgets</h2>
          <p className="mt-1 text-[10px] text-[#9aa3a7]">Track spending against your monthly limits</p>
        </div>
        <Button variant="outline" size="sm" onClick={onManageBudgets}>
          <SlidersHorizontal size={12} /> {progress.length ? 'Edit budgets' : 'Set budgets'}
        </Button>
      </div>

      {progress.length === 0 ? (
        <p className="mt-3 text-[11px] text-[#9aa3a7]">
          No monthly budgets set yet. Set an overall or category limit to watch your pace.
        </p>
      ) : (
        <div className="mt-3.5 grid max-[720px]:grid-cols-1">
          {progress.map((item) => {
            const barColor =
              item.status === 'over' ? '#d45a46' : item.status === 'warning' ? '#dfa23a' : '#32a881';
            return (
              <div key={item.id} className="rounded-lg border border-[#f0f2f2] bg-[#fafcfb] p-3 dark:border-[#2b393b] dark:bg-[#202e30]">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-[#2d3b41] dark:text-[#e0e9e6]">{item.category}</span>
                  <span className={item.status === 'over' ? 'font-bold text-[#c95540]' : 'text-[#7f8c90] dark:text-[#a8b6b2]'}>
                    {formatCurrency(item.spent)} / {formatCurrency(item.limit)} ({item.percent}%)
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e9eeec] dark:bg-[#2b393b]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, item.percent)}%`, backgroundColor: barColor }}
                  />
                </div>
                <div className="mt-1.5 text-[9px] text-[#8d989c]">
                  {item.status === 'over'
                    ? `Exceeded by ${formatCurrency(item.spent - item.limit)}`
                    : `${formatCurrency(item.remaining)} remaining`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

type OverviewProps = SearchProps & {
  spent: number;
  income: number;
  peopleOwe: number;
  youOwe: number;
  allTransactions: Transaction[];
  transactions: Transaction[];
  budgets: BudgetRule[];
  dueRecurring: Transaction[];
  isLoading?: boolean;
  onAddTransaction: () => void;
  onNavigate: (page: 'KhataBook' | 'Transactions') => void;
  onSelectCategory: (category: string) => void;
  onManageBudgets: () => void;
  onLogRecurring: (items: Transaction[]) => void;
  onRemoveTransaction: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
};

export function OverviewPage({
  spent,
  income,
  peopleOwe,
  youOwe,
  allTransactions,
  transactions,
  budgets,
  dueRecurring,
  query,
  onQueryChange,
  isLoading = false,
  onAddTransaction,
  onNavigate,
  onSelectCategory,
  onManageBudgets,
  onLogRecurring,
  onRemoveTransaction,
  onEditTransaction,
}: OverviewProps) {
  const net = income - spent;

  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL FINANCE"
        title={<>Your money, in <em>good shape.</em></>}
        subtitle="Here’s what’s happening with your finances. Press N to quick-add."
        action={<Button variant="primary" onClick={onAddTransaction} disabled={isLoading}><Plus size={16} /> Add transaction</Button>}
      />

      {!isLoading && dueRecurring.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#d6ece2] bg-[#eff8f3] px-4 py-3 dark:border-[#2c4a40] dark:bg-[#1b302a]">
          <div className="flex items-center gap-2.5 text-[11px] text-[#285a47] dark:text-[#b9dfd0]">
            <Repeat size={16} className="shrink-0 text-[#2fa77d]" />
            <span>
              <b>{dueRecurring.length} recurring {dueRecurring.length === 1 ? 'item is' : 'items are'} due</b>
              <span className="ml-1.5 text-[#5b7e70] dark:text-[#96bdb0]">
                ({dueRecurring.slice(0, 2).map((item) => item.title).join(', ')}{dueRecurring.length > 2 ? ` +${dueRecurring.length - 2} more` : ''})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {dueRecurring.length === 1 ? (
              <button
                type="button"
                onClick={() => onLogRecurring(dueRecurring)}
                className="rounded-md bg-[#2fa77d] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#27916c]"
              >
                Log {formatCurrency(dueRecurring[0].amount)}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onLogRecurring(dueRecurring)}
                className="rounded-md bg-[#2fa77d] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-[#27916c]"
              >
                Log all ({dueRecurring.length})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3.5 max-[1100px]:grid-cols-2 max-[560px]:gap-2.5" aria-busy={isLoading}>
        <div className="summary-card balance-card">
          <div className="card-top">Spent this month <ArrowUpRight /></div>
          <div className="big-number">
            {isLoading ? <Skeleton inverse className="h-[34px] w-32 max-[560px]:h-[28px] max-[560px]:w-24" /> : formatCurrency(spent)}
          </div>
          <div className="balance-foot">Personal expenses this month</div>
        </div>
        <div className="summary-card">
          <div className="card-top">Income this month <ArrowDownRight /></div>
          <div className="big-number !text-[#278c6a]">
            {isLoading ? <Skeleton className="h-[30px] w-28 max-[560px]:h-[24px] max-[560px]:w-20" /> : formatCurrency(income)}
          </div>
          <div className="text-[10px] font-semibold text-[#7d8a8f]">
            {isLoading ? (
              <Skeleton className="h-2.5 w-24" />
            ) : (
              <span className={net >= 0 ? 'text-[#2fa77d]' : 'text-[#c95540]'}>
                {net >= 0 ? `Saved ${formatCurrency(net)}` : `Deficit ${formatCurrency(Math.abs(net))}`}
              </span>
            )}
          </div>
        </div>
        <div className="summary-card">
          <div className="card-top">People owe you <ArrowUpRight /></div>
          <div className="big-number !text-green-700">
            {isLoading ? <Skeleton className="h-[30px] w-28 max-[560px]:h-[24px] max-[560px]:w-20" /> : formatCurrency(peopleOwe)}
          </div>
          <button type="button" className="text-link" onClick={() => onNavigate('KhataBook')}>View receivables <ArrowRight size={14} /></button>
        </div>
        <div className="summary-card">
          <div className="card-top">You owe people <ArrowDownRight /></div>
          <div className="big-number !text-red-900">
            {isLoading ? <Skeleton className="h-[30px] w-28 max-[560px]:h-[24px] max-[560px]:w-20" /> : formatCurrency(youOwe)}
          </div>
          <button type="button" className="text-link" onClick={() => onNavigate('KhataBook')}>View payables <ArrowRight size={14} /></button>
        </div>
      </div>

      <SpendingCharts
        allTransactions={allTransactions}
        periodTransactions={transactions}
        isLoading={isLoading}
        onSelectCategory={onSelectCategory}
      />

      {!isLoading && (
        <BudgetStatusSection
          allTransactions={allTransactions}
          budgets={budgets}
          onManageBudgets={onManageBudgets}
        />
      )}

      <section className="panel transactions-panel">
        <div className="panel-head transaction-head">
          <div><h2>Recent transactions</h2><p>Your latest money moves</p></div>
          <div className="tx-tools">
            <SearchInput data-search-input="true" placeholder="Search transactions (/)" value={query} onChange={(event) => onQueryChange(event.target.value)} />
            <Button variant="ghost" size="sm" onClick={() => onNavigate('Transactions')} className="!text-[#2e9b74] dark:!text-[#6ed0a5]">View all <ArrowRight size={14} /></Button>
          </div>
        </div>
        <TransactionList transactions={transactions} isLoading={isLoading} onRemove={onRemoveTransaction} onEdit={onEditTransaction} />
      </section>
    </>
  );
}

type KhataBookProps = SearchProps & {
  entries: KhataEntry[];
  lentTotal: number;
  borrowedTotal: number;
  filter: string;
  onFilterChange: (value: string) => void;
  sortBy: 'newest' | 'due' | 'amount';
  onSortChange: (value: 'newest' | 'due' | 'amount') => void;
  isLoading?: boolean;
  onAddEntry: () => void;
  onOpenPerson: (entry: KhataEntry) => void;
};

export function KhataBookPage({
  entries,
  lentTotal,
  borrowedTotal,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  isLoading = false,
  onAddEntry,
  onOpenPerson,
}: KhataBookProps) {
  const overdueEntries = entries.filter((entry) => {
    const status = getKhataDueStatus(entry);
    return status === 'overdue' || status === 'due-today';
  });

  const filteredEntries = sortKhataEntries(
    entries.filter((entry) => {
      const { net } = getKhataTotals(entry);
      const status = getKhataDueStatus(entry);
      const matchesFilter =
        filter === 'All'
          ? true
          : filter === 'lent'
            ? net > 0
            : filter === 'borrowed'
              ? net < 0
              : filter === 'settled'
                ? net === 0
                : status === 'overdue' || status === 'due-today';
      const matchesQuery = `${entry.name} ${entry.phone} ${entry.note}`.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    }),
    sortBy,
  );

  const openLentCount = entries.filter((entry) => getKhataTotals(entry).net > 0).length;
  const openBorrowedCount = entries.filter((entry) => getKhataTotals(entry).net < 0).length;

  return (
    <>
      <PageHeading
        eyebrow="PERSONAL LEDGER"
        title="KhataBook"
        subtitle="Click any person card to view their credit/debit history and add entries."
        action={<Button variant="primary" onClick={onAddEntry} disabled={isLoading}><Plus size={16} /> Add person</Button>}
      />

      {!isLoading && overdueEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#f5d5cc] bg-[#fff5f2] px-4 py-3 text-[11px] text-[#9b4433] dark:border-[#4b2d28] dark:bg-[#2a1d1b] dark:text-[#f1a89a]">
          <span className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span><b>{overdueEntries.length} {overdueEntries.length === 1 ? 'person has' : 'people have'} due or overdue balances</b> — click a card to follow up or settle.</span>
          </span>
          <button
            type="button"
            onClick={() => onFilterChange(filter === 'overdue' ? 'All' : 'overdue')}
            className="rounded-md border border-[#e7bcb1] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#9b4433] dark:border-[#5e3933] dark:bg-[#1a2628] dark:text-[#f1a89a]"
          >
            {filter === 'overdue' ? 'Show all people' : 'Show due / overdue'}
          </button>
        </div>
      )}

      <div className="khata-summary" aria-busy={isLoading}>
        <div className="khata-total receive"><ArrowUpRight /><div><small>You will get</small><strong className="!text-green-700">{isLoading ? <Skeleton className="h-[25px] w-28" /> : formatCurrency(lentTotal)}</strong><span>{isLoading ? <Skeleton className="h-2.5 w-20" /> : `${openLentCount} ${openLentCount === 1 ? 'person' : 'people'}`}</span></div></div>
        <div className="khata-total pay"><ArrowDownRight /><div><small>You will give</small><strong className="!text-red-900">{isLoading ? <Skeleton className="h-[25px] w-28" /> : formatCurrency(borrowedTotal)}</strong><span>{isLoading ? <Skeleton className="h-2.5 w-20" /> : `${openBorrowedCount} ${openBorrowedCount === 1 ? 'person' : 'people'}`}</span></div></div>
        <div className="khata-net"><small>Net balance</small><strong>{isLoading ? <Skeleton inverse className="h-[25px] w-28" /> : formatCurrency(lentTotal - borrowedTotal)}</strong><span>Receivable minus payable</span></div>
      </div>

      <section className="panel full-panel">
        <div className="panel-head">
          <div><h2>People</h2><p>Each card shows the final settlement balance to give or get</p></div>
          <div className="tx-tools flex-wrap">
            <SearchInput data-search-input="true" placeholder="Search people or notes" value={query} onChange={(event) => onQueryChange(event.target.value)} />
            <div className="w-auto min-w-[125px]">
              <Select compact value={filter} onChange={(event) => onFilterChange(event.target.value)} aria-label="Filter khata people">
                <option value="All">All people</option>
                <option value="lent">You will get</option>
                <option value="borrowed">You will give</option>
                <option value="settled">Settled</option>
                <option value="overdue">Due / Overdue</option>
              </Select>
            </div>
            <div className="w-auto min-w-[138px]">
              <Select compact value={sortBy} onChange={(event) => onSortChange(event.target.value as 'newest' | 'due' | 'amount')} aria-label="Sort khata people">
                <option value="newest">Recent activity</option>
                <option value="amount">Highest balance</option>
                <option value="due">Earliest due</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3.5 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1" aria-busy={isLoading}>
          {isLoading ? Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="rounded-xl border border-[#e9eeec] bg-[#fafcfb] p-[18px] dark:border-[#2a383a] dark:bg-[#1e2b2d]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div>
                  <Skeleton className="block h-3.5 w-24" />
                  <Skeleton className="mt-1.5 block h-2.5 w-16" />
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-[#ebf0ee] pt-3 dark:border-[#2a383a]">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          )) : filteredEntries.length ? filteredEntries.map((entry) => (
            <KhataRow
              key={entry.id}
              entry={entry}
              onOpen={() => onOpenPerson(entry)}
            />
          )) : <div className="empty-state col-span-full"><BookUser /> No matching people. Add someone to start their khata.</div>}
        </div>
      </section>
      <div className="khata-tip"><HandCoins size={18} /> Click any person card to add You Gave / You Got entries and view full history.</div>
    </>
  );
}

type TransactionsProps = SearchProps & {
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  typeFilter: 'all' | 'expense' | 'income';
  onTypeFilterChange: (value: 'all' | 'expense' | 'income') => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
  onSortChange: (value: 'newest' | 'oldest' | 'highest' | 'lowest') => void;
  transactions: Transaction[];
  dueRecurring: Transaction[];
  isLoading?: boolean;
  onAddTransaction: () => void;
  onImportCsv: () => void;
  onLogRecurring: (items: Transaction[]) => void;
  onRemoveTransaction: (transaction: Transaction) => void;
  onEditTransaction: (transaction: Transaction) => void;
};

export function TransactionsPage({
  query,
  onQueryChange,
  dateFilter,
  onDateFilterChange,
  typeFilter,
  onTypeFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortChange,
  transactions,
  dueRecurring,
  isLoading = false,
  onAddTransaction,
  onImportCsv,
  onLogRecurring,
  onRemoveTransaction,
  onEditTransaction,
}: TransactionsProps) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR MONEY, MOVING"
        title="Transactions"
        subtitle="Track everyday expenses and income."
        action={
          <div className="heading-actions">
            <Button variant="outline" size="sm" onClick={onImportCsv} disabled={isLoading}><Upload size={14} /> Import CSV</Button>
            <Button variant="primary" onClick={onAddTransaction} disabled={isLoading}><Plus size={16} /> Add transaction</Button>
          </div>
        }
      />

      {!isLoading && dueRecurring.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-[#d6ece2] bg-[#eff8f3] px-4 py-2.5 text-[11px] text-[#285a47] dark:border-[#2c4a40] dark:bg-[#1b302a] dark:text-[#b9dfd0]">
          <span className="flex items-center gap-2"><Repeat size={14} /> {dueRecurring.length} recurring {dueRecurring.length === 1 ? 'transaction is' : 'transactions are'} due this period.</span>
          <button type="button" onClick={() => onLogRecurring(dueRecurring)} className="rounded-md bg-[#2fa77d] px-2.5 py-1 text-[10px] font-semibold text-white">Log due items</button>
        </div>
      )}

      <section className="panel full-panel">
        <div className="panel-head flex-wrap gap-3">
          <div><h2>All transactions</h2><p>Search, group, and filter your activity</p></div>
          <div className="tx-tools flex-wrap">
            <div className="inline-flex h-8 items-center rounded-[9px] border border-[#e3e9e7] bg-[#f4f7f6] p-0.5 dark:border-[#324244] dark:bg-[#1a2628]">
              {(['all', 'expense', 'income'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onTypeFilterChange(option)}
                  className={`h-full rounded-[7px] px-2.5 text-[10.5px] font-medium capitalize transition-all ${
                    typeFilter === option
                      ? 'bg-white text-[#278c6a] shadow-xs dark:bg-[#243638] dark:text-[#73d2a9]'
                      : 'text-[#7f8c91] hover:text-[#354448] dark:text-[#9baaa7]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <SearchInput data-search-input="true" placeholder="Search (/)" value={query} onChange={(event) => onQueryChange(event.target.value)} />
            <div className="w-auto min-w-[132px]">
              <Select compact value={categoryFilter} onChange={(event) => onCategoryFilterChange(event.target.value)} aria-label="Filter by category">
                <option value="All">All categories</option>
                {categories.map(([name]) => <option key={name} value={name}>{name}</option>)}
              </Select>
            </div>
            <DateRangeFilter value={dateFilter} onChange={onDateFilterChange} />
            <div className="w-auto min-w-[128px]">
              <Select compact value={sortBy} onChange={(event) => onSortChange(event.target.value as 'newest' | 'oldest' | 'highest' | 'lowest')} aria-label="Sort transactions">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="highest">Highest amount</option>
                <option value="lowest">Lowest amount</option>
              </Select>
            </div>
          </div>
        </div>
        <TransactionList transactions={transactions} isLoading={isLoading} groupByDate onRemove={onRemoveTransaction} onEdit={onEditTransaction} />
      </section>
    </>
  );
}

type ReportsProps = {
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  allTransactions: Transaction[];
  transactions: Transaction[];
  budgets: BudgetRule[];
  peopleOwe: number;
  isLoading?: boolean;
  onExport: () => void;
  onManageBudgets: () => void;
  onSelectCategory: (category: string) => void;
};

export function ReportsPage({
  dateFilter,
  onDateFilterChange,
  allTransactions,
  transactions,
  budgets,
  peopleOwe,
  isLoading = false,
  onExport,
  onManageBudgets,
  onSelectCategory,
}: ReportsProps) {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  const income = transactions.filter((transaction) => transaction.type === 'income');
  const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = income.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <>
      <PageHeading
        eyebrow="YOUR FINANCIAL SNAPSHOT"
        title="Reports"
        subtitle="Review charts, budgets, and export a styled PDF report."
        action={<Button variant="primary" onClick={onExport} disabled={isLoading}><Download size={15} /> Export PDF</Button>}
      />
      <section className="panel report-panel" aria-busy={isLoading}>
        <div className="panel-head">
          <div><h2>Spending report</h2><p>Summary for the selected period</p></div>
          <DateRangeFilter value={dateFilter} onChange={onDateFilterChange} />
        </div>
        <div className="report-stats">
          <div><small>Total spent</small><strong>{isLoading ? <Skeleton className="h-[22px] w-24" /> : formatCurrency(totalSpent)}</strong></div>
          <div><small>Income</small><strong>{isLoading ? <Skeleton className="h-[22px] w-24" /> : formatCurrency(totalIncome)}</strong></div>
          <div><small>Transactions</small><strong>{isLoading ? <Skeleton className="h-[22px] w-12" /> : transactions.length}</strong></div>
          <div><small>People owe you</small><strong>{isLoading ? <Skeleton className="h-[22px] w-24" /> : formatCurrency(peopleOwe)}</strong></div>
        </div>
        <h3 className="report-subhead">Category breakdown</h3>
        {isLoading ? Array.from({ length: 4 }, (_, index) => (
          <div className="report-cat" key={index}>
            <Skeleton className="h-3 w-24" />
            <span className="cat-track skeleton" aria-hidden="true" />
            <Skeleton className="ml-auto h-3 w-14" />
          </div>
        )) : categories.map(([name, color]) => {
          const amount = expenses.filter((transaction) => transaction.category === name).reduce((sum, transaction) => sum + transaction.amount, 0);
          if (!amount) return null;
          return <div className="report-cat" key={name}>
            <span>{name}</span>
            <span className="cat-track"><i style={{ width: `${amount / Math.max(totalSpent, 1) * 100}%`, background: color }} /></span>
            <b>{formatCurrency(amount)}</b>
          </div>;
        })}
      </section>

      <SpendingCharts
        allTransactions={allTransactions}
        periodTransactions={transactions}
        isLoading={isLoading}
        onSelectCategory={onSelectCategory}
      />

      {!isLoading && (
        <BudgetStatusSection
          allTransactions={allTransactions}
          budgets={budgets}
          onManageBudgets={onManageBudgets}
        />
      )}
    </>
  );
}

type SettingsProps = {
  databaseStatus: DatabaseStatus;
  isLoading?: boolean;
  onManageBudgets: () => void;
  onImportCsv: () => void;
  onExportBackup: () => void;
  onRestoreBackup: (backup: LedgerBackup) => Promise<void>;
  onToast: (message: string, type?: ToastType) => void;
};

export function SettingsPage({
  databaseStatus,
  isLoading = false,
  onManageBudgets,
  onImportCsv,
  onExportBackup,
  onRestoreBackup,
  onToast,
}: SettingsProps) {
  const handleBackupFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<LedgerBackup>;
      if (
        !Array.isArray(parsed.transactions)
        || !Array.isArray(parsed.entries)
        || !Array.isArray(parsed.groups)
        || !Array.isArray(parsed.groupExpenses)
      ) {
        onToast('Invalid Ledger backup file.', 'error');
        return;
      }
      await onRestoreBackup({
        version: 1,
        exportedAt: parsed.exportedAt || new Date().toISOString(),
        transactions: parsed.transactions,
        entries: parsed.entries,
        groups: parsed.groups,
        groupExpenses: parsed.groupExpenses,
        budgets: Array.isArray(parsed.budgets) ? parsed.budgets : [],
      });
    } catch {
      onToast('Could not read the selected JSON backup.', 'error');
    }
  };

  return (
    <>
      <PageHeading eyebrow="MAKE IT YOURS" title="Settings" subtitle="Manage storage, budgets, CSV imports, and full JSON backups." />
      <section className="panel settings-panel">
        <h2>Your preferences</h2>
        <div className="db-setup-note">
          <b>Server storage</b>
          <p>App records are saved in MongoDB through the Node.js API. Add your MongoDB URI to <code>.env.local</code>, then restart the server.</p>
          <span className={`db-status ${databaseStatus}`}><i />{databaseStatus === 'connected' ? 'MongoDB connected' : databaseStatus === 'connecting' ? 'Checking connection…' : 'Waiting for MongoDB configuration'}</span>
        </div>
        <div className="setting-row"><div><b>Currency</b><small>Used for balances and reports</small></div><span>₹ Indian Rupee (INR)</span></div>
        <div className="setting-row">
          <div><b>Monthly budgets</b><small>Configure overall or category spending limits</small></div>
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onManageBudgets}><SlidersHorizontal size={13} /> Configure</Button>
        </div>
        <div className="setting-row">
          <div><b>CSV statement import</b><small>Import bank or UPI exports with automatic category detection</small></div>
          <Button variant="outline" size="sm" disabled={isLoading} onClick={onImportCsv}><Upload size={13} /> Import CSV</Button>
        </div>
        <div className="setting-row">
          <div><b>Full JSON backup</b><small>Export or restore all transactions, KhataBook, groups, and budgets</small></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={isLoading} onClick={onExportBackup}><Download size={13} /> Export JSON</Button>
            <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#e2e8e6] bg-white px-3 text-[11px] font-medium text-[#4b5c60] transition-colors hover:border-[#32a881]/70 hover:text-[#258562] dark:border-[#324244] dark:bg-[#192527] dark:text-[#c7d3d0]">
              <Upload size={13} /> Restore JSON
              <input type="file" accept="application/json,.json" className="hidden" disabled={isLoading} onChange={(event) => { void handleBackupFile(event); }} />
            </label>
          </div>
        </div>
      </section>
    </>
  );
}

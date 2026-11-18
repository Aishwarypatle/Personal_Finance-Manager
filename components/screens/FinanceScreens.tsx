import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookUser,
  Download,
  HandCoins,
  Plus,
  Search,
} from 'lucide-react';
import { categories } from '@/lib/categories';
import { formatCurrency } from '@/lib/format';
import type { DatabaseStatus, KhataEntry, ToastType, Transaction } from '@/lib/types';
import { KhataRow } from '@/components/shared/KhataRow';
import { PageHeading } from '@/components/shared/PageHeading';
import { TransactionList } from '@/components/shared/TransactionList';

type SearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

type OverviewProps = SearchProps & {
  spent: number;
  peopleOwe: number;
  youOwe: number;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onNavigate: (page: 'KhataBook' | 'Transactions') => void;
  onRemoveTransaction: (transaction: Transaction) => void;
};

export function OverviewPage({
  spent,
  peopleOwe,
  youOwe,
  transactions,
  query,
  onQueryChange,
  onAddTransaction,
  onNavigate,
  onRemoveTransaction,
}: OverviewProps) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR PERSONAL FINANCE"
        title={<>Your money, in <em>good shape.</em></>}
        subtitle="Here’s what’s happening with your finances."
        action={<button type="button" className="primary" onClick={onAddTransaction}><Plus size={17} /> Add transaction</button>}
      />
      <div className="summary-grid">
        <div className="summary-card balance-card">
          <div className="card-top">Spent this month <ArrowUpRight /></div>
          <div className="big-number">{formatCurrency(spent)}</div>
          <div className="balance-foot">Personal expenses this month</div>
        </div>
        <div className="summary-card">
          <div className="card-top">People owe you <ArrowUpRight /></div>
          <div className="big-number !text-green-700">{formatCurrency(peopleOwe)}</div>
          <button type="button" className="text-link" onClick={() => onNavigate('KhataBook')}>View receivables <ArrowRight size={14} /></button>
        </div>
        <div className="summary-card">
          <div className="card-top">You owe people <ArrowDownRight /></div>
          <div className="big-number !text-red-900">{formatCurrency(youOwe)}</div>
          <button type="button" className="text-link" onClick={() => onNavigate('KhataBook')}>View payables <ArrowRight size={14} /></button>
        </div>
      </div>
      <section className="panel transactions-panel">
        <div className="panel-head transaction-head">
          <div><h2>Recent transactions</h2><p>Your latest money moves</p></div>
          <div className="tx-tools">
            <label className="searchbox"><Search size={15} /><input placeholder="Search transactions" value={query} onChange={(event) => onQueryChange(event.target.value)} /></label>
            <button type="button" className="view-all" onClick={() => onNavigate('Transactions')}>View all <ArrowRight size={14} /></button>
          </div>
        </div>
        <TransactionList transactions={transactions} onRemove={onRemoveTransaction} />
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
  onAddEntry: () => void;
  onPayment: (entry: KhataEntry) => void;
  onDelete: (entry: KhataEntry) => void;
  onToast: (message: string, type?: ToastType) => void;
};

export function KhataBookPage({
  entries,
  lentTotal,
  borrowedTotal,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onAddEntry,
  onPayment,
  onDelete,
}: KhataBookProps) {
  const filteredEntries = entries.filter((entry) =>
    (filter === 'All' || entry.direction === filter)
    && `${entry.name} ${entry.phone} ${entry.note}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHeading
        eyebrow="PERSONAL LEDGER"
        title="KhataBook"
        subtitle="Track money you give and money you take."
        action={<button type="button" className="primary" onClick={onAddEntry}><Plus size={17} /> Add entry</button>}
      />
      <div className="khata-summary">
        <div className="khata-total receive"><ArrowUpRight /><div><small>People owe you</small><strong className="!text-green-700">{formatCurrency(lentTotal)}</strong><span>{entries.filter((entry) => entry.direction === 'lent' && entry.amount > entry.paid).length} open entries</span></div></div>
        <div className="khata-total pay"><ArrowDownRight /><div><small>You owe people</small><strong className="!text-red-900">{formatCurrency(borrowedTotal)}</strong><span>{entries.filter((entry) => entry.direction === 'borrowed' && entry.amount > entry.paid).length} open entries</span></div></div>
        <div className="khata-net"><small>Net receivable</small><strong>{formatCurrency(lentTotal - borrowedTotal)}</strong><span>Receivable minus payable</span></div>
      </div>
      <section className="panel full-panel">
        <div className="panel-head">
          <div><h2>People & entries</h2><p>Record details and keep repayments up to date</p></div>
          <div className="tx-tools">
            <label className="searchbox"><Search size={15} /><input placeholder="Search people or notes" value={query} onChange={(event) => onQueryChange(event.target.value)} /></label>
            <select className="select-button" value={filter} onChange={(event) => onFilterChange(event.target.value)}>
              <option>All</option><option value="lent">They owe me</option><option value="borrowed">I owe them</option>
            </select>
          </div>
        </div>
        <div className="khata-list">
          {filteredEntries.length ? filteredEntries.map((entry) => <KhataRow key={entry.id} entry={entry} onPayment={() => onPayment(entry)} onDelete={() => onDelete(entry)} />) : <div className="empty-state"><BookUser /> No matching entries.</div>}
        </div>
      </section>
      <div className="khata-tip"><HandCoins size={18} /> Add repayments as they happen to keep outstanding balances accurate.</div>
    </>
  );
}

type TransactionsProps = SearchProps & {
  period: string;
  onPeriodChange: (period: string) => void;
  transactions: Transaction[];
  onAddTransaction: () => void;
  onRemoveTransaction: (transaction: Transaction) => void;
};

export function TransactionsPage({ query, onQueryChange, period, onPeriodChange, transactions, onAddTransaction, onRemoveTransaction }: TransactionsProps) {
  return (
    <>
      <PageHeading
        eyebrow="YOUR MONEY, MOVING"
        title="Transactions"
        subtitle="Track everyday expenses and income."
        action={<button type="button" className="primary" onClick={onAddTransaction}><Plus size={17} /> Add transaction</button>}
      />
      <section className="panel full-panel">
        <div className="panel-head">
          <div><h2>All transactions</h2><p>Search and filter your activity</p></div>
          <div className="tx-tools">
            <label className="searchbox"><Search size={15} /><input placeholder="Search" value={query} onChange={(event) => onQueryChange(event.target.value)} /></label>
            <select className="select-button" value={period} onChange={(event) => onPeriodChange(event.target.value)}><option>This month</option><option>Today</option><option>This week</option></select>
          </div>
        </div>
        <TransactionList transactions={transactions} onRemove={onRemoveTransaction} />
      </section>
    </>
  );
}

type ReportsProps = {
  period: string;
  onPeriodChange: (period: string) => void;
  transactions: Transaction[];
  peopleOwe: number;
  onExport: () => void;
};

export function ReportsPage({ period, onPeriodChange, transactions, peopleOwe, onExport }: ReportsProps) {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  const income = transactions.filter((transaction) => transaction.type === 'income');
  const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = income.reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <>
      <PageHeading
        eyebrow="YOUR FINANCIAL SNAPSHOT"
        title="Reports"
        subtitle="Review and export your spending."
        action={<button type="button" className="primary" onClick={onExport}><Download size={16} /> Export CSV</button>}
      />
      <section className="panel report-panel">
        <div className="panel-head">
          <div><h2>Spending report</h2><p>Summary for {period.toLowerCase()}</p></div>
          <select className="select-button" value={period} onChange={(event) => onPeriodChange(event.target.value)}><option>This month</option><option>Today</option><option>This week</option></select>
        </div>
        <div className="report-stats">
          <div><small>Total spent</small><strong>{formatCurrency(totalSpent)}</strong></div>
          <div><small>Income</small><strong>{formatCurrency(totalIncome)}</strong></div>
          <div><small>Transactions</small><strong>{transactions.length}</strong></div>
          <div><small>People owe you</small><strong>{formatCurrency(peopleOwe)}</strong></div>
        </div>
        <h3 className="report-subhead">Category breakdown</h3>
        {categories.map(([name, color]) => {
          const amount = expenses.filter((transaction) => transaction.category === name).reduce((sum, transaction) => sum + transaction.amount, 0);
          if (!amount) return null;
          return <div className="report-cat" key={name}>
            <span>{name}</span>
            <span className="cat-track"><i style={{ width: `${amount / Math.max(totalSpent, 1) * 100}%`, background: color }} /></span>
            <b>{formatCurrency(amount)}</b>
          </div>;
        })}
      </section>
    </>
  );
}

export function SettingsPage({ databaseStatus }: { databaseStatus: DatabaseStatus }) {
  return (
    <>
      <PageHeading eyebrow="MAKE IT YOURS" title="Settings" subtitle="Your records are stored on your MongoDB server." />
      <section className="panel settings-panel">
        <h2>Your preferences</h2>
        <div className="db-setup-note">
          <b>Server storage</b>
          <p>App records are saved in MongoDB through the Node.js API. Add your MongoDB URI to <code>.env.local</code>, then restart the server.</p>
          <span className={`db-status ${databaseStatus}`}><i />{databaseStatus === 'connected' ? 'MongoDB connected' : databaseStatus === 'connecting' ? 'Checking connection…' : 'Waiting for MongoDB configuration'}</span>
        </div>
        <div className="setting-row"><div><b>Currency</b><small>Used for balances and reports</small></div><span>₹ Indian Rupee (INR)</span></div>
      </section>
    </>
  );
}

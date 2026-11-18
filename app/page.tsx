'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';
import { today, weekStart, formatCurrency } from '@/lib/format';
import type { PageName, ToastMessage, Transaction, TransactionFormState } from '@/lib/types';
import { useFinanceData } from '@/hooks/useFinanceData';
import { useDarkMode } from '@/hooks/useDarkMode';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { GroupsPage } from '@/components/screens/GroupsPage';
import { KhataBookPage, OverviewPage, ReportsPage, SettingsPage, TransactionsPage } from '@/components/screens/FinanceScreens';
import { KhataModal, TransactionModal } from '@/components/forms/EntryModals';

export default function Home() {
  const [page, setPage] = useState<PageName>('Overview');
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [period, setPeriod] = useState('This month');
  const [khataFilter, setKhataFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'khata' | 'transaction' | ''>('');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const { isDark: darkMode, toggleTheme } = useDarkMode();
  const [form, setForm] = useState<TransactionFormState>({
    title: '', amount: '', category: 'Food & dining', date: today, type: 'expense',
  });

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
    window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 3000);
  }, []);

  const {
    transactions, entries, groups, groupExpenses, databaseStatus, authReady, authRequired,
    isRefreshing, refreshData, saveTransactions, saveEntries, saveGroups, saveGroupExpenses,
  } = useFinanceData(notify);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.slice(0, 7) === today.slice(0, 7)),
    [transactions],
  );
  const spentThisMonth = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const receivable = entries
    .filter((entry) => entry.direction === 'lent')
    .reduce((sum, entry) => sum + entry.amount - entry.paid, 0);
  const payable = entries
    .filter((entry) => entry.direction === 'borrowed')
    .reduce((sum, entry) => sum + entry.amount - entry.paid, 0);

  const visibleTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => period === 'Today'
        ? transaction.date === today
        : period === 'This week'
          ? transaction.date >= weekStart
          : transaction.date.slice(0, 7) === today.slice(0, 7))
      .filter((transaction) => `${transaction.title} ${transaction.category}`.toLowerCase().includes(query.toLowerCase()))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [transactions, period, query]);

  const addTransaction = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      notify('Enter a description and a valid amount.', 'error');
      return;
    }
    saveTransactions([{ ...form, title: form.title.trim(), id: Date.now(), amount }, ...transactions]);
    setForm({ title: '', amount: '', category: 'Food & dining', date: today, type: 'expense' });
    setModal('');
    notify('Transaction added');
  };

  const addKhataEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amount = Number(data.get('amount'));
    const paid = Number(data.get('paid') || 0);
    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(paid) || paid < 0 || paid > amount) {
      notify('Enter valid amounts. Settled amount cannot exceed the total.', 'error');
      return;
    }
    saveEntries([{
      id: Date.now(),
      name: String(data.get('name')).trim(),
      phone: String(data.get('phone') || ''),
      direction: String(data.get('directionChoice')) as 'lent' | 'borrowed',
      amount,
      paid,
      date: String(data.get('date')),
      due: String(data.get('due') || ''),
      note: String(data.get('note') || ''),
    }, ...entries]);
    setModal('');
    notify('Khata entry saved');
  };

  const updatePayment = (entry: (typeof entries)[number]) => {
    const rawAmount = window.prompt(`Outstanding ${formatCurrency(entry.amount - entry.paid)}. Amount paid / received?`);
    if (rawAmount === null || rawAmount.trim() === '') return;
    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      notify('Enter a valid payment amount.', 'error');
      return;
    }
    saveEntries(entries.map((item) => item.id === entry.id
      ? { ...item, paid: Math.min(item.amount, item.paid + amount) }
      : item));
    notify('Payment updated');
  };

  const exportReport = () => {
    const rows = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...visibleTransactions.map((transaction) => [transaction.date, transaction.title, transaction.category, transaction.type, String(transaction.amount)]),
    ];
    const csv = rows.map((row) => row.map((field) => `"${String(field).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finance-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    notify('Report downloaded');
  };
  
  const handleCloseModal = () => {
    setModal('');
    setForm({ title: '', amount: '', category: 'Food & dining', date: today, type: 'expense' });
  }

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setAuthError(result.error || 'Could not sign in.');
        return;
      }
      window.location.reload();
    } catch {
      setAuthError('Could not reach the server.');
    }
  };

  const removeTransaction = (transaction: Transaction) => {
    saveTransactions(transactions.filter((item) => item.id !== transaction.id));
    notify('Transaction deleted');
  };

  if (!authReady || authRequired) {
    return (
      <main className="login-screen grid min-h-dvh place-items-center">
        <form className="login-card" onSubmit={submitLogin}>
          <span className="brand-icon"><BrandMark size={23} /></span>
          <h1>Ledger<span className="brand-dot">.</span></h1>
          <p>{authReady ? 'Sign in to your personal finance ledger.' : 'Connecting securely…'}</p>
          {authReady && <>
            <label className="field">App password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
            <button type="submit" className="primary submit-button">Unlock my ledger</button>
            {authError && <div className="form-error" role="alert">{authError}</div>}
          </>}
        </form>
      </main>
    );
  }

  return (
    <div className="app min-h-screen bg-[#f7f8fa] font-sans text-ink">
      <AppSidebar
        page={page}
        isOpen={menuOpen}
        khataCount={entries.length}
        groupCount={groups.length}
        receivable={receivable}
        payable={payable}
        isRefreshing={isRefreshing}
        onNavigate={setPage}
        onRefresh={() => {
          void refreshData();
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
      />
      <main className="main min-h-screen ml-[246px] max-[1100px]:ml-[220px] max-[820px]:ml-0">
        <AppTopBar
          page={page}
          databaseStatus={databaseStatus}
          darkMode={darkMode}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setPage('Settings')}
        />
        <div className="content mx-auto max-w-[1300px] px-[42px] py-[37px] pb-[25px] max-[1100px]:px-[25px] max-[1100px]:py-[30px] max-[560px]:px-[15px] max-[560px]:py-[25px]">
          {page === 'Groups' ? (
            <GroupsPage
              groups={groups}
              expenses={groupExpenses}
              selected={selectedGroup}
              setSelected={setSelectedGroup}
              onToast={notify}
              onCreateGroup={(group) => {
                saveGroups([group, ...groups]);
                setSelectedGroup(group.id);
                notify('Group created');
              }}
              onAddExpense={(expense) => {
                saveGroupExpenses([expense, ...groupExpenses]);
                notify('Shared expense added');
              }}
              onDeleteExpense={(id) => {
                saveGroupExpenses(groupExpenses.filter((expense) => expense.id !== id));
                notify('Expense removed');
              }}
            />
          ) : page === 'KhataBook' ? (
            <KhataBookPage
              entries={entries}
              lentTotal={receivable}
              borrowedTotal={payable}
              query={query}
              onQueryChange={setQuery}
              filter={khataFilter}
              onFilterChange={setKhataFilter}
              onAddEntry={() => setModal('khata')}
              onPayment={updatePayment}
              onDelete={(entry) => {
                if (window.confirm('Delete entry?')) {
                  saveEntries(entries.filter((item) => item.id !== entry.id));
                  notify('Khata entry deleted');
                }
              }}
              onToast={notify}
            />
          ) : page === 'Overview' ? (
            <OverviewPage
              spent={spentThisMonth}
              peopleOwe={receivable}
              youOwe={payable}
              transactions={visibleTransactions.slice(0, 7)}
              query={query}
              onQueryChange={setQuery}
              onAddTransaction={() => setModal('transaction')}
              onNavigate={setPage}
              onRemoveTransaction={removeTransaction}
            />
          ) : page === 'Transactions' ? (
            <TransactionsPage
              query={query}
              onQueryChange={setQuery}
              period={period}
              onPeriodChange={setPeriod}
              transactions={visibleTransactions}
              onAddTransaction={() => setModal('transaction')}
              onRemoveTransaction={removeTransaction}
            />
          ) : page === 'Reports' ? (
            <ReportsPage period={period} onPeriodChange={setPeriod} transactions={visibleTransactions} peopleOwe={receivable} onExport={exportReport} />
          ) : (
            <SettingsPage databaseStatus={databaseStatus} />
          )}
        </div>
        <footer>
          <span>Made for your everyday money <span className="heart">♥</span></span>
          <span>Private by nature · Stored on your MongoDB server</span>
        </footer>
      </main>

      {modal === 'khata' && <KhataModal onSave={addKhataEntry} onClose={() => setModal('')} />}
      {modal === 'transaction' && <TransactionModal form={form} onChange={setForm} onSave={addTransaction} onClose={handleCloseModal} />}
      {toast && (
        <div className={`toast ${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'}>
          {toast.type === 'error' ? <CircleAlert size={17} /> : <Check size={16} />}
          <span>{toast.message}</span>
          <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

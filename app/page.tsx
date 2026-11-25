'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { BrandMark } from '@/components/brand/BrandMark';
import { today, weekStart, formatCurrency } from '@/lib/format';
import { buildKhataReminderText, computeMonthlySummary, getDueRecurringTransactions } from '@/lib/financeHelpers';
import type {
  DateFilter,
  ExpenseGroup,
  GroupExpense,
  KhataEntry,
  LedgerBackup,
  PageName,
  Transaction,
  TransactionFormState,
} from '@/lib/types';
import { useFinanceData } from '@/hooks/useFinanceData';
import type { NotifyOptions } from '@/hooks/useFinanceData';
import { useDarkMode } from '@/hooks/useDarkMode';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { GroupsPage } from '@/components/screens/GroupsPage';
import { KhataBookPage, OverviewPage, ReportsPage, SettingsPage, TransactionsPage } from '@/components/screens/FinanceScreens';
import { KhataModal, TransactionModal } from '@/components/forms/EntryModals';
import { PaymentModal } from '@/components/forms/PaymentModal';
import { BudgetModal } from '@/components/forms/BudgetModal';
import { CsvImportModal } from '@/components/forms/CsvImportModal';
import { ConfirmModal } from '@/components/forms/ConfirmModal';
import type { ConfirmDialogState } from '@/components/forms/ConfirmModal';
import { LoadingScreen } from '@/components/shared/LoadingScreen';

export default function Home() {
  const [page, setPage] = useState<PageName>('Overview');
  const [selectedGroup, setSelectedGroup] = useState(0);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ preset: 'month', startDate: today, endDate: today });
  const [khataFilter, setKhataFilter] = useState('All');
  const [khataSort, setKhataSort] = useState<'newest' | 'due' | 'amount'>('newest');
  const [overviewQuery, setOverviewQuery] = useState('');
  const [txQuery, setTxQuery] = useState('');
  const [khataQuery, setKhataQuery] = useState('');
  const [txCategory, setTxCategory] = useState('All');
  const [txType, setTxType] = useState<'all' | 'expense' | 'income'>('all');
  const [txSort, setTxSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [modal, setModal] = useState<'khata' | 'transaction' | 'payment' | 'budgets' | 'importCsv' | ''>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingEntry, setEditingEntry] = useState<KhataEntry | null>(null);
  const [payingEntry, setPayingEntry] = useState<KhataEntry | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const { isDark: darkMode, toggleTheme } = useDarkMode();
  const [form, setForm] = useState<TransactionFormState>({
    title: '', amount: '', category: 'Food & dining', date: today, type: 'expense', recurring: 'none',
  });

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success', options?: NotifyOptions) => {
    const showToast = type === 'error' ? toast.error : toast.success;
    if (options?.actionLabel && options?.onAction) {
      const actionLabel = options.actionLabel;
      const onAction = options.onAction;
      showToast(
        ({ closeToast }) => (
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => {
                closeToast?.();
                onAction();
              }}
              className="shrink-0 rounded bg-[#2fa77d] px-2 py-0.5 text-[10px] font-bold text-white hover:bg-[#27916c]"
            >
              {actionLabel}
            </button>
          </div>
        ),
        { autoClose: 5000 },
      );
      return;
    }
    showToast(message);
  }, []);

  const {
    transactions, entries, groups, groupExpenses, budgets, databaseStatus, authReady, authEnabled, authRequired,
    isRefreshing, isInitialLoading, refreshData, saveTransactions, saveEntries, saveGroups, saveGroupExpenses, saveBudgets, restoreBackup,
  } = useFinanceData(notify);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const handleCloseModal = useCallback(() => {
    setModal('');
    setEditingTransaction(null);
    setEditingEntry(null);
    setPayingEntry(null);
    setForm({ title: '', amount: '', category: 'Food & dining', date: today, type: 'expense', recurring: 'none' });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmDialog) {
          setConfirmDialog(null);
          return;
        }
        if (modal) {
          handleCloseModal();
          return;
        }
      }
      const target = event.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (isTyping || modal || confirmDialog || authRequired || !authReady || isInitialLoading) return;

      if (event.key.toLowerCase() === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        if (page === 'KhataBook') setModal('khata');
        else setModal('transaction');
      } else if (event.key === '/') {
        const searchInput = document.querySelector<HTMLInputElement>('input[data-search-input="true"]');
        if (searchInput) {
          event.preventDefault();
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [authReady, authRequired, confirmDialog, handleCloseModal, isInitialLoading, modal, page]);

  const { spent: spentThisMonth, income: incomeThisMonth } = useMemo(
    () => computeMonthlySummary(transactions),
    [transactions],
  );
  const dueRecurring = useMemo(
    () => getDueRecurringTransactions(transactions),
    [transactions],
  );
  const receivable = entries
    .filter((entry) => entry.direction === 'lent')
    .reduce((sum, entry) => sum + entry.amount - entry.paid, 0);
  const payable = entries
    .filter((entry) => entry.direction === 'borrowed')
    .reduce((sum, entry) => sum + entry.amount - entry.paid, 0);

  const filterByDate = useCallback((list: Transaction[]) => {
    return list.filter((transaction) => {
      if (dateFilter.preset === 'today') return transaction.date === today;
      if (dateFilter.preset === 'week') return transaction.date >= weekStart && transaction.date <= today;
      if (dateFilter.preset === 'custom') {
        return (!dateFilter.startDate || transaction.date >= dateFilter.startDate)
          && (!dateFilter.endDate || transaction.date <= dateFilter.endDate);
      }
      return transaction.date.slice(0, 7) === today.slice(0, 7);
    });
  }, [dateFilter]);

  const overviewTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => transaction.date.slice(0, 7) === today.slice(0, 7))
      .filter((transaction) => `${transaction.title} ${transaction.category}`.toLowerCase().includes(overviewQuery.toLowerCase()))
      .sort((left, right) => right.date.localeCompare(left.date));
  }, [transactions, overviewQuery]);

  const reportTransactions = useMemo(() => {
    return filterByDate(transactions).sort((left, right) => right.date.localeCompare(left.date));
  }, [filterByDate, transactions]);

  const visibleTransactions = useMemo(() => {
    return filterByDate(transactions)
      .filter((transaction) => txType === 'all' || transaction.type === txType)
      .filter((transaction) => txCategory === 'All' || transaction.category === txCategory)
      .filter((transaction) => `${transaction.title} ${transaction.category}`.toLowerCase().includes(txQuery.toLowerCase()))
      .sort((left, right) => {
        if (txSort === 'oldest') return left.date.localeCompare(right.date);
        if (txSort === 'highest') return right.amount - left.amount;
        if (txSort === 'lowest') return left.amount - right.amount;
        return right.date.localeCompare(left.date);
      });
  }, [filterByDate, transactions, txCategory, txQuery, txSort, txType]);

  const addTransaction = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) {
      notify('Enter a description and a valid amount.', 'error');
      return;
    }
    const nextTransaction: Transaction = {
      ...form,
      title: form.title.trim(),
      id: editingTransaction?.id || Date.now(),
      amount,
    };
    void saveTransactions(editingTransaction
      ? transactions.map((transaction) => transaction.id === editingTransaction.id ? nextTransaction : transaction)
      : [nextTransaction, ...transactions]);
    handleCloseModal();
    notify(editingTransaction ? 'Transaction updated' : 'Transaction added');
  };

  const logRecurringItems = (items: Transaction[]) => {
    const base = Date.now();
    const generated: Transaction[] = items.map((item, index) => ({
      id: base + index,
      title: item.title,
      amount: item.amount,
      category: item.category,
      date: today,
      type: item.type,
      recurring: item.recurring,
    }));
    void saveTransactions([...generated, ...transactions]);
    notify(`Logged ${generated.length} recurring ${generated.length === 1 ? 'item' : 'items'}`);
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
    const entry = {
      id: editingEntry?.id || Date.now(),
      name: String(data.get('name')).trim(),
      phone: String(data.get('phone') || ''),
      direction: String(data.get('directionChoice')) as 'lent' | 'borrowed',
      amount,
      paid,
      date: String(data.get('date')),
      due: String(data.get('due') || ''),
      note: String(data.get('note') || ''),
    };
    void saveEntries(editingEntry
      ? entries.map((current) => current.id === editingEntry.id ? entry : current)
      : [entry, ...entries]);
    handleCloseModal();
    notify(editingEntry ? 'Khata entry updated' : 'Khata entry saved');
  };

  const savePaymentAmount = (amount: number) => {
    if (!payingEntry) return;
    const nextPaid = Math.min(payingEntry.amount, Math.round((payingEntry.paid + amount) * 100) / 100);
    void saveEntries(entries.map((item) => item.id === payingEntry.id ? { ...item, paid: nextPaid } : item));
    handleCloseModal();
    notify(nextPaid >= payingEntry.amount ? `${payingEntry.name} marked as settled` : 'Payment recorded');
  };

  const requestSettleKhata = (entry: KhataEntry) => {
    const remaining = Math.max(0, Math.round((entry.amount - entry.paid) * 100) / 100);
    setConfirmDialog({
      title: entry.direction === 'lent' ? 'Mark Khata settled?' : 'Mark payable settled?',
      description: entry.direction === 'lent'
        ? 'Confirm that you received the full remaining balance from this person.'
        : 'Confirm that you paid the full remaining balance to this person.',
      details: `${entry.name} · ${formatCurrency(remaining)} remaining`,
      confirmLabel: 'Confirm settle',
      tone: 'primary',
      onConfirm: () => {
        const previous = entries;
        void saveEntries(entries.map((item) => item.id === entry.id ? { ...item, paid: item.amount } : item));
        notify(`${entry.name} marked as settled`, 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveEntries(previous);
            notify('Settlement reverted');
          },
        });
      },
    });
  };

  const requestDeleteTransaction = (transaction: Transaction) => {
    setConfirmDialog({
      title: 'Delete transaction?',
      description: 'This will remove the transaction from your ledger.',
      details: `${transaction.title} · ${formatCurrency(transaction.amount)} (${transaction.date})`,
      confirmLabel: 'Delete transaction',
      tone: 'danger',
      onConfirm: () => {
        const previous = transactions;
        void saveTransactions(transactions.filter((item) => item.id !== transaction.id));
        notify(`Deleted "${transaction.title}"`, 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveTransactions(previous);
            notify('Transaction restored');
          },
        });
      },
    });
  };

  const requestDeleteKhataEntry = (entry: KhataEntry) => {
    const remaining = Math.max(0, entry.amount - entry.paid);
    setConfirmDialog({
      title: 'Delete Khata entry?',
      description: 'Are you sure you want to remove this person’s balance record?',
      details: `${entry.name} · ${formatCurrency(remaining)} remaining`,
      confirmLabel: 'Delete entry',
      tone: 'danger',
      onConfirm: () => {
        const previous = entries;
        void saveEntries(entries.filter((item) => item.id !== entry.id));
        notify(`Removed ${entry.name}'s entry`, 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveEntries(previous);
            notify('Khata entry restored');
          },
        });
      },
    });
  };

  const requestDeleteGroup = (group: ExpenseGroup) => {
    setConfirmDialog({
      title: 'Delete group?',
      description: 'This will permanently delete this trip/group and all its shared expenses.',
      details: `${group.name} · ${group.members.length} members`,
      confirmLabel: 'Delete group',
      tone: 'danger',
      onConfirm: () => {
        const nextGroups = groups.filter((item) => item.id !== group.id);
        void saveGroups(nextGroups);
        void saveGroupExpenses(groupExpenses.filter((expense) => expense.groupId !== group.id));
        setSelectedGroup(nextGroups[0]?.id || 0);
        notify(`Deleted group "${group.name}"`);
      },
    });
  };

  const requestDeleteGroupExpense = (expense: GroupExpense) => {
    setConfirmDialog({
      title: 'Delete shared expense?',
      description: 'Member balances and suggested settlements will be recalculated.',
      details: `${expense.title} · ${formatCurrency(expense.amount)}`,
      confirmLabel: 'Delete expense',
      tone: 'danger',
      onConfirm: () => {
        const previous = groupExpenses;
        void saveGroupExpenses(groupExpenses.filter((item) => item.id !== expense.id));
        notify('Expense removed', 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveGroupExpenses(previous);
            notify('Expense restored');
          },
        });
      },
    });
  };

  const requestSettleGroup = (groupId: number, from: string, to: string, amount: number) => {
    setConfirmDialog({
      title: 'Confirm group settlement?',
      description: 'This records a settlement payment and updates everyone’s net balance.',
      details: `${from} pays ${to} · ${formatCurrency(amount)}`,
      confirmLabel: 'Record settlement',
      tone: 'primary',
      onConfirm: () => {
        const previous = groupExpenses;
        void saveGroupExpenses([
          {
            id: Date.now(),
            groupId,
            title: `${from} settled up with ${to}`,
            paidBy: from,
            amount,
            date: today,
            shares: { [to]: amount },
            isSettlement: true,
          },
          ...groupExpenses,
        ]);
        notify(`Recorded ${formatCurrency(amount)} settlement from ${from} to ${to}`, 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveGroupExpenses(previous);
            notify('Settlement reverted');
          },
        });
      },
    });
  };

  const copyKhataReminder = async (entry: KhataEntry) => {
    const message = buildKhataReminderText(entry);
    try {
      await navigator.clipboard.writeText(message);
      notify(`Reminder copied for ${entry.name}`);
    } catch {
      notify(message);
    }
  };

  const exportReport = () => {
    const rows = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'],
      ...reportTransactions.map((transaction) => [transaction.date, transaction.title, transaction.category, transaction.type, String(transaction.amount)]),
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

  const exportBackup = () => {
    const backup: LedgerBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions,
      entries,
      groups,
      groupExpenses,
      budgets,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ledger-backup-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Full JSON backup downloaded');
  };

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

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout request failed');
      window.location.reload();
    } catch {
      setIsLoggingOut(false);
      notify('Could not log out. Please try again.', 'error');
    }
  };

  const openCategoryInTransactions = (category: string) => {
    setTxCategory(category);
    setTxType('expense');
    setPage('Transactions');
  };

  if (authRequired) {
    return (
      <main className="login-screen grid min-h-dvh place-items-center">
        <form className="login-card" onSubmit={submitLogin}>
          <span className="brand-icon"><BrandMark size={23} /></span>
          <h1>Ledger<span className="brand-dot">.</span></h1>
          <p>Sign in to your personal finance ledger.</p>
          <label className="field">App password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button type="submit" className="primary submit-button">Unlock my ledger</button>
          {authError && <div className="form-error" role="alert">{authError}</div>}
        </form>
      </main>
    );
  }

  if (!authReady) return <LoadingScreen />;

  return (
    <div className="app min-h-screen bg-[#f7f8fa] font-sans text-ink">
      <AppSidebar
        page={page}
        isOpen={menuOpen}
        khataCount={entries.length}
        groupCount={groups.length}
        receivable={receivable}
        payable={payable}
        isLoading={isInitialLoading}
        onNavigate={setPage}
        onClose={() => setMenuOpen(false)}
      />
      <main className="main min-h-screen ml-[246px] max-[1100px]:ml-[220px] max-[820px]:ml-0">
        <AppTopBar
          page={page}
          databaseStatus={databaseStatus}
          darkMode={darkMode}
          showLogout={authEnabled}
          isLoggingOut={isLoggingOut}
          isRefreshing={isRefreshing}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setPage('Settings')}
          onLogout={() => { void logout(); }}
          onRefresh={() => { void refreshData(); }}
        />
        <div className="content mx-auto max-w-[1300px] px-[42px] py-[37px] pb-[25px] max-[1100px]:px-[25px] max-[1100px]:py-[30px] max-[560px]:px-[15px] max-[560px]:py-[25px]">
          {page === 'Groups' ? (
            <GroupsPage
              groups={groups}
              expenses={groupExpenses}
              selected={selectedGroup}
              isLoading={isInitialLoading}
              setSelected={setSelectedGroup}
              onToast={notify}
              onCreateGroup={(group) => {
                void saveGroups([group, ...groups]);
                setSelectedGroup(group.id);
                notify('Group created');
              }}
              onUpdateGroup={(updatedGroup) => {
                void saveGroups(groups.map((group) => group.id === updatedGroup.id ? updatedGroup : group));
                notify('Trip updated');
              }}
              onDeleteGroup={requestDeleteGroup}
              onAddExpense={(expense) => {
                void saveGroupExpenses([expense, ...groupExpenses]);
                notify('Shared expense added');
              }}
              onUpdateExpense={(updatedExpense) => {
                void saveGroupExpenses(groupExpenses.map((expense) => expense.id === updatedExpense.id ? updatedExpense : expense));
                notify('Shared expense updated');
              }}
              onDeleteExpense={requestDeleteGroupExpense}
              onSettleUp={requestSettleGroup}
            />
          ) : page === 'KhataBook' ? (
            <KhataBookPage
              entries={entries}
              lentTotal={receivable}
              borrowedTotal={payable}
              query={khataQuery}
              onQueryChange={setKhataQuery}
              filter={khataFilter}
              onFilterChange={setKhataFilter}
              sortBy={khataSort}
              onSortChange={setKhataSort}
              isLoading={isInitialLoading}
              onAddEntry={() => setModal('khata')}
              onPayment={(entry) => {
                setPayingEntry(entry);
                setModal('payment');
              }}
              onSettle={requestSettleKhata}
              onDelete={requestDeleteKhataEntry}
              onEdit={(entry) => { setEditingEntry(entry); setModal('khata'); }}
              onRemind={(entry) => { void copyKhataReminder(entry); }}
            />
          ) : page === 'Overview' ? (
            <OverviewPage
              spent={spentThisMonth}
              income={incomeThisMonth}
              peopleOwe={receivable}
              youOwe={payable}
              allTransactions={transactions}
              transactions={overviewTransactions.slice(0, 7)}
              budgets={budgets}
              dueRecurring={dueRecurring}
              query={overviewQuery}
              onQueryChange={setOverviewQuery}
              isLoading={isInitialLoading}
              onAddTransaction={() => setModal('transaction')}
              onNavigate={setPage}
              onSelectCategory={openCategoryInTransactions}
              onManageBudgets={() => setModal('budgets')}
              onLogRecurring={logRecurringItems}
              onRemoveTransaction={requestDeleteTransaction}
              onEditTransaction={(transaction) => {
                setEditingTransaction(transaction);
                setForm({
                  title: transaction.title,
                  amount: String(transaction.amount),
                  category: transaction.category,
                  date: transaction.date,
                  type: transaction.type,
                  recurring: transaction.recurring || 'none',
                });
                setModal('transaction');
              }}
            />
          ) : page === 'Transactions' ? (
            <TransactionsPage
              query={txQuery}
              onQueryChange={setTxQuery}
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              typeFilter={txType}
              onTypeFilterChange={setTxType}
              categoryFilter={txCategory}
              onCategoryFilterChange={setTxCategory}
              sortBy={txSort}
              onSortChange={setTxSort}
              transactions={visibleTransactions}
              dueRecurring={dueRecurring}
              isLoading={isInitialLoading}
              onAddTransaction={() => setModal('transaction')}
              onImportCsv={() => setModal('importCsv')}
              onLogRecurring={logRecurringItems}
              onRemoveTransaction={requestDeleteTransaction}
              onEditTransaction={(transaction) => {
                setEditingTransaction(transaction);
                setForm({
                  title: transaction.title,
                  amount: String(transaction.amount),
                  category: transaction.category,
                  date: transaction.date,
                  type: transaction.type,
                  recurring: transaction.recurring || 'none',
                });
                setModal('transaction');
              }}
            />
          ) : page === 'Reports' ? (
            <ReportsPage
              dateFilter={dateFilter}
              onDateFilterChange={setDateFilter}
              allTransactions={transactions}
              transactions={reportTransactions}
              budgets={budgets}
              peopleOwe={receivable}
              isLoading={isInitialLoading}
              onExport={exportReport}
              onManageBudgets={() => setModal('budgets')}
              onSelectCategory={openCategoryInTransactions}
            />
          ) : (
            <SettingsPage
              databaseStatus={databaseStatus}
              isLoading={isInitialLoading}
              onManageBudgets={() => setModal('budgets')}
              onImportCsv={() => setModal('importCsv')}
              onExportBackup={exportBackup}
              onRestoreBackup={async (backup) => {
                const ok = await restoreBackup(backup);
                if (ok) notify('Backup restored successfully');
              }}
              onToast={notify}
            />
          )}
        </div>
        <footer>
          <span>Made for your everyday money <span className="heart">♥</span></span>
          <span>Private by nature · Stored on your MongoDB server</span>
        </footer>
      </main>

      {modal === 'khata' && <KhataModal entry={editingEntry || undefined} onSave={addKhataEntry} onClose={handleCloseModal} />}
      {modal === 'transaction' && <TransactionModal mode={editingTransaction ? 'edit' : 'create'} form={form} onChange={setForm} onSave={addTransaction} onClose={handleCloseModal} />}
      {modal === 'payment' && payingEntry && <PaymentModal entry={payingEntry} onSave={savePaymentAmount} onClose={handleCloseModal} />}
      {modal === 'budgets' && (
        <BudgetModal
          budgets={budgets}
          onSave={(nextBudgets) => {
            void saveBudgets(nextBudgets);
            handleCloseModal();
            notify('Monthly budgets saved');
          }}
          onClose={handleCloseModal}
        />
      )}
      {modal === 'importCsv' && (
        <CsvImportModal
          onImport={(imported) => {
            void saveTransactions([...imported, ...transactions]);
            handleCloseModal();
            notify(`Imported ${imported.length} transactions`);
          }}
          onClose={handleCloseModal}
        />
      )}
      {confirmDialog && (
        <ConfirmModal
          {...confirmDialog}
          onClose={() => setConfirmDialog(null)}
        />
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        newestOnTop
        closeOnClick={false}
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { BrandMark } from '@/components/brand/BrandMark';
import { today, weekStart, formatCurrency } from '@/lib/format';
import {
  buildKhataReminderText,
  computeMonthlySummary,
  getDueRecurringTransactions,
  getKhataTotals,
} from '@/lib/financeHelpers';
import type {
  DateFilter,
  ExpenseGroup,
  GroupExpense,
  KhataEntry,
  KhataTransaction,
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
import { KhataDetailModal } from '@/components/forms/KhataDetailModal';
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
  const [modal, setModal] = useState<'khata' | 'transaction' | 'budgets' | 'importCsv' | ''>('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingEntry, setEditingEntry] = useState<KhataEntry | null>(null);
  const [activeKhataId, setActiveKhataId] = useState<number | null>(null);
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

  const activeKhataEntry = useMemo(
    () => entries.find((entry) => entry.id === activeKhataId) || null,
    [activeKhataId, entries],
  );

  const handleCloseModal = useCallback(() => {
    setModal('');
    setEditingTransaction(null);
    setEditingEntry(null);
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
        if (activeKhataId !== null) {
          setActiveKhataId(null);
          return;
        }
      }
      const target = event.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (isTyping || modal || activeKhataId !== null || confirmDialog || authRequired || !authReady || isInitialLoading) return;

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
  }, [activeKhataId, authReady, authRequired, confirmDialog, handleCloseModal, isInitialLoading, modal, page]);

  const { spent: spentThisMonth, income: incomeThisMonth } = useMemo(
    () => computeMonthlySummary(transactions),
    [transactions],
  );
  const dueRecurring = useMemo(
    () => getDueRecurringTransactions(transactions),
    [transactions],
  );
  const receivable = useMemo(
    () => entries.reduce((sum, entry) => {
      const { net } = getKhataTotals(entry);
      return net > 0 ? sum + net : sum;
    }, 0),
    [entries],
  );
  const payable = useMemo(
    () => entries.reduce((sum, entry) => {
      const { net } = getKhataTotals(entry);
      return net < 0 ? sum + Math.abs(net) : sum;
    }, 0),
    [entries],
  );

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

  const saveKhataPerson = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    if (!name) {
      notify('Enter a person name.', 'error');
      return;
    }

    if (editingEntry) {
      const updated: KhataEntry = {
        ...editingEntry,
        name,
        phone: String(data.get('phone') || '').trim(),
        due: String(data.get('due') || ''),
        note: String(data.get('note') || '').trim(),
      };
      void saveEntries(entries.map((item) => item.id === editingEntry.id ? updated : item));
      handleCloseModal();
      notify(`Updated ${name}'s details`);
      return;
    }

    const openingAmount = Number(data.get('amount') || 0);
    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      notify('Enter a valid opening amount.', 'error');
      return;
    }
    const direction = String(data.get('directionChoice') || 'gave') === 'got' ? 'got' : 'gave';
    const phone = String(data.get('phone') || '').trim();
    const due = String(data.get('due') || '');
    const note = String(data.get('note') || '').trim();
    const entryDate = String(data.get('date') || today);
    const digits = phone.replace(/\D/g, '');
    const existingPerson = entries.find((person) => {
      if (person.name.toLowerCase() !== name.toLowerCase()) return false;
      const existingDigits = person.phone.replace(/\D/g, '');
      return !digits || !existingDigits || digits === existingDigits;
    });

    if (existingPerson) {
      const nextLedger = openingAmount > 0
        ? [
            ...(existingPerson.ledger || []),
            { id: Date.now(), type: direction, amount: openingAmount, date: entryDate, note } as KhataTransaction,
          ]
        : existingPerson.ledger;
      const merged: KhataEntry = {
        ...existingPerson,
        phone: existingPerson.phone || phone,
        due: existingPerson.due || due,
        note: existingPerson.note || note,
        ledger: nextLedger,
      };
      void saveEntries(entries.map((person) => person.id === existingPerson.id ? merged : person));
      handleCloseModal();
      notify(openingAmount > 0 ? `Added entry to ${existingPerson.name}'s khata` : `${existingPerson.name} already exists`);
      return;
    }

    const personId = Date.now();
    const newPerson: KhataEntry = {
      id: personId,
      name,
      phone,
      due,
      note,
      ledger: openingAmount > 0
        ? [{ id: personId + 1, type: direction, amount: openingAmount, date: entryDate, note }]
        : [],
    };
    void saveEntries([newPerson, ...entries]);
    handleCloseModal();
    notify(`Created khata card for ${name}`);
  };

  const addKhataTransaction = (personId: number, transaction: KhataTransaction) => {
    void saveEntries(entries.map((entry) => (
      entry.id === personId
        ? { ...entry, ledger: [...(entry.ledger || []), transaction] }
        : entry
    )));
    notify(
      transaction.type === 'gave'
        ? `Added You Gave ${formatCurrency(transaction.amount)}`
        : `Added You Got ${formatCurrency(transaction.amount)}`,
    );
  };

  const requestDeleteKhataTransaction = (person: KhataEntry, transaction: KhataTransaction) => {
    setConfirmDialog({
      title: 'Delete Khata transaction?',
      description: `Remove this entry from ${person.name}'s khata history?`,
      details: `${transaction.type === 'gave' ? 'You Gave' : 'You Got'} ${formatCurrency(transaction.amount)} · ${transaction.date}`,
      confirmLabel: 'Delete entry',
      tone: 'danger',
      onConfirm: () => {
        const previous = entries;
        void saveEntries(entries.map((item) => (
          item.id === person.id
            ? { ...item, ledger: item.ledger.filter((tx) => tx.id !== transaction.id) }
            : item
        )));
        notify('Khata entry deleted', 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveEntries(previous);
            notify('Khata entry restored');
          },
        });
      },
    });
  };

  const requestSettleKhata = (person: KhataEntry) => {
    const { net } = getKhataTotals(person);
    if (net === 0) return;
    const isReceiving = net > 0;
    const remaining = Math.abs(net);

    setConfirmDialog({
      title: isReceiving ? 'Mark Khata settled?' : 'Mark payable settled?',
      description: isReceiving
        ? `Confirm that you received the full ${formatCurrency(remaining)} from ${person.name}.`
        : `Confirm that you paid the full ${formatCurrency(remaining)} to ${person.name}.`,
      details: `${person.name} · Final settlement ${formatCurrency(remaining)}`,
      confirmLabel: 'Confirm settle',
      tone: 'primary',
      onConfirm: () => {
        const previous = entries;
        const settlementTx: KhataTransaction = {
          id: Date.now(),
          type: isReceiving ? 'got' : 'gave',
          amount: remaining,
          date: today,
          note: 'Full settlement',
          isSettlement: true,
        };
        void saveEntries(entries.map((item) => (
          item.id === person.id
            ? { ...item, ledger: [...(item.ledger || []), settlementTx] }
            : item
        )));
        setActiveKhataId(null);
        notify(`${person.name} marked as settled`, 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveEntries(previous);
            notify('Settlement reverted');
          },
        });
      },
    });
  };

  const requestDeleteKhataPerson = (person: KhataEntry) => {
    const { net } = getKhataTotals(person);
    setConfirmDialog({
      title: 'Delete person from KhataBook?',
      description: `This will remove ${person.name} and all ${person.ledger?.length || 0} entries in their history.`,
      details: `${person.name} · ${net === 0 ? 'Settled' : `${net > 0 ? 'Get' : 'Give'} ${formatCurrency(Math.abs(net))}`}`,
      confirmLabel: 'Delete person',
      tone: 'danger',
      onConfirm: () => {
        const previous = entries;
        void saveEntries(entries.filter((item) => item.id !== person.id));
        setActiveKhataId(null);
        notify(`Removed ${person.name} from KhataBook`, 'success', {
          actionLabel: 'Undo',
          onAction: () => {
            void saveEntries(previous);
            notify(`${person.name} restored`);
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
              onOpenPerson={(entry) => setActiveKhataId(entry.id)}
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

      {activeKhataEntry && !modal && (
        <KhataDetailModal
          entry={activeKhataEntry}
          onAddTransaction={addKhataTransaction}
          onDeleteTransaction={requestDeleteKhataTransaction}
          onSettle={requestSettleKhata}
          onEditPerson={(person) => {
            setEditingEntry(person);
            setModal('khata');
          }}
          onDeletePerson={requestDeleteKhataPerson}
          onRemind={(person) => { void copyKhataReminder(person); }}
          onClose={() => setActiveKhataId(null)}
        />
      )}
      {modal === 'khata' && <KhataModal entry={editingEntry || undefined} onSave={saveKhataPerson} onClose={handleCloseModal} />}
      {modal === 'transaction' && <TransactionModal mode={editingTransaction ? 'edit' : 'create'} form={form} onChange={setForm} onSave={addTransaction} onClose={handleCloseModal} />}
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
        position="top-center"
        autoClose={3500}
        newestOnTop
        closeOnClick={false}
        pauseOnHover
        theme={darkMode ? 'dark' : 'light'}
      />
    </div>
  );
}

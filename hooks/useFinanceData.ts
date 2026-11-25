'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  BudgetRule,
  DatabaseStatus,
  ExpenseGroup,
  GroupExpense,
  KhataEntry,
  LedgerBackup,
  ToastType,
  Transaction,
} from '@/lib/types';

export type NotifyOptions = {
  actionLabel?: string;
  onAction?: () => void;
};
type Notify = (message: string, type?: ToastType, options?: NotifyOptions) => void;

type CollectionName = 'transactions' | 'khata' | 'groups' | 'groupExpenses' | 'budgets';
type CollectionSpec = {
  name: CollectionName;
  legacyKey: string;
  setRecords: (records: unknown[]) => void;
  demoIdLimit: number;
};

async function readCollection(name: CollectionName): Promise<unknown[]> {
  const response = await fetch(`/api/data?collection=${name}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${name}`);
  return response.json();
}

export function useFinanceData(notify: Notify) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [budgets, setBudgets] = useState<BudgetRule[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>('connecting');
  const [authReady, setAuthReady] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const persistCollection = useCallback(async <T,>(
    name: CollectionName,
    nextRecords: T[],
    previousRecords: T[],
    applyState: (records: T[]) => void,
  ) => {
    applyState(nextRecords);
    try {
      const response = await fetch(`/api/data?collection=${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextRecords),
      });
      if (!response.ok) throw new Error('Database write failed');
      setDatabaseStatus('connected');
      return true;
    } catch {
      applyState(previousRecords);
      setDatabaseStatus('setup-required');
      notify('Could not save to server. Reverted local change.', 'error', {
        actionLabel: 'Retry',
        onAction: () => {
          void persistCollection(name, nextRecords, previousRecords, applyState);
        },
      });
      return false;
    }
  }, [notify]);

  const saveTransactions = useCallback((records: Transaction[]) => {
    return persistCollection('transactions', records, transactions, setTransactions);
  }, [persistCollection, transactions]);

  const saveEntries = useCallback((records: KhataEntry[]) => {
    return persistCollection('khata', records, entries, setEntries);
  }, [persistCollection, entries]);

  const saveGroups = useCallback((records: ExpenseGroup[]) => {
    return persistCollection('groups', records, groups, setGroups);
  }, [persistCollection, groups]);

  const saveGroupExpenses = useCallback((records: GroupExpense[]) => {
    return persistCollection('groupExpenses', records, groupExpenses, setGroupExpenses);
  }, [persistCollection, groupExpenses]);

  const saveBudgets = useCallback((records: BudgetRule[]) => {
    return persistCollection('budgets', records, budgets, setBudgets);
  }, [persistCollection, budgets]);

  const restoreBackup = useCallback(async (backup: LedgerBackup) => {
    const results = await Promise.all([
      persistCollection('transactions', backup.transactions, transactions, setTransactions),
      persistCollection('khata', backup.entries, entries, setEntries),
      persistCollection('groups', backup.groups, groups, setGroups),
      persistCollection('groupExpenses', backup.groupExpenses, groupExpenses, setGroupExpenses),
      persistCollection('budgets', backup.budgets, budgets, setBudgets),
    ]);
    return results.every(Boolean);
  }, [budgets, entries, groupExpenses, groups, persistCollection, transactions]);

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [loadedTransactions, loadedEntries, loadedGroups, loadedGroupExpenses, loadedBudgets] = await Promise.all([
        readCollection('transactions'),
        readCollection('khata'),
        readCollection('groups'),
        readCollection('groupExpenses'),
        readCollection('budgets'),
      ]);
      setTransactions(loadedTransactions as Transaction[]);
      setEntries(loadedEntries as KhataEntry[]);
      setGroups(loadedGroups as ExpenseGroup[]);
      setGroupExpenses(loadedGroupExpenses as GroupExpense[]);
      setBudgets(loadedBudgets as BudgetRule[]);
      setDatabaseStatus('connected');
      notify('All finance data refreshed');
    } catch {
      setDatabaseStatus('setup-required');
      notify('Could not refresh server data. Check your MongoDB setup.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, notify]);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const authResponse = await fetch('/api/auth');
        if (!authResponse.ok) throw new Error('Authentication check failed');
        const auth = await authResponse.json();
        if (active) setAuthEnabled(auth.required);
        if (auth.required && !auth.authorized) {
          if (active) {
            setAuthRequired(true);
            setAuthReady(true);
            setIsRefreshing(false);
            setIsInitialLoading(false);
          }
          return;
        }
        if (active) setAuthReady(true);

        const specs: CollectionSpec[] = [
          { name: 'transactions', legacyKey: 'ledger_tx', setRecords: (records) => setTransactions(records as Transaction[]), demoIdLimit: 12 },
          { name: 'khata', legacyKey: 'ledger_khata', setRecords: (records) => setEntries(records as KhataEntry[]), demoIdLimit: 3 },
          { name: 'groups', legacyKey: 'ledger_groups', setRecords: (records) => setGroups(records as ExpenseGroup[]), demoIdLimit: 1 },
          { name: 'groupExpenses', legacyKey: 'ledger_group_expenses', setRecords: (records) => setGroupExpenses(records as GroupExpense[]), demoIdLimit: 3 },
          { name: 'budgets', legacyKey: 'ledger_budgets', setRecords: (records) => setBudgets(records as BudgetRule[]), demoIdLimit: 0 },
        ];
        await Promise.all(specs.map(async (spec) => {
          const serverRecords = await readCollection(spec.name) as { id?: unknown }[];
          const removeDemoRecords = (records: { id?: unknown }[]) =>
            spec.demoIdLimit > 0
              ? records.filter((record) => !(typeof record.id === 'number' && record.id >= 1 && record.id <= spec.demoIdLimit))
              : records;
          let records: unknown[];
          if (serverRecords.length) {
            records = removeDemoRecords(serverRecords);
            if (records.length !== serverRecords.length) {
              const cleanup = await fetch(`/api/data?collection=${spec.name}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(records),
              });
              if (!cleanup.ok) throw new Error('Could not remove sample records');
            }
          } else {
            let legacy: unknown = null;
            try { legacy = JSON.parse(localStorage.getItem(spec.legacyKey) || 'null'); } catch { /* Ignore malformed old browser data. */ }
            records = removeDemoRecords(Array.isArray(legacy) ? legacy : []);
            if (records.length > 0 || spec.name !== 'budgets') {
              const migration = await fetch(`/api/data?collection=${spec.name}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(records),
              });
              if (!migration.ok) throw new Error('Could not migrate old records');
            }
          }
          if (!active) return;
          spec.setRecords(records);
          localStorage.removeItem(spec.legacyKey);
        }));
        if (active) {
          setDatabaseStatus('connected');
          setIsRefreshing(false);
          setIsInitialLoading(false);
        }
      } catch {
        if (active) {
          setDatabaseStatus('setup-required');
          setAuthReady(true);
          setIsRefreshing(false);
          setIsInitialLoading(false);
          notify('Could not load server data. Check your MongoDB setup.', 'error');
        }
      }
    }
    void bootstrap();
    return () => { active = false; };
  }, [notify]);

  return {
    transactions, entries, groups, groupExpenses, budgets, databaseStatus, authReady, authEnabled, authRequired,
    isRefreshing, isInitialLoading, refreshData, saveTransactions, saveEntries, saveGroups, saveGroupExpenses, saveBudgets, restoreBackup,
  };
}

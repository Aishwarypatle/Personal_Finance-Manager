'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DatabaseStatus, ExpenseGroup, GroupExpense, KhataEntry, ToastType, Transaction } from '@/lib/types';

type Notify = (message: string, type?: ToastType) => void;
type CollectionSpec = {
  name: 'transactions' | 'khata' | 'groups' | 'groupExpenses';
  legacyKey: string;
  setRecords: (records: unknown[]) => void;
  demoIdLimit: number;
};

async function readCollection(name: CollectionSpec['name']): Promise<unknown[]> {
  const response = await fetch(`/api/data?collection=${name}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Could not load ${name}`);
  return response.json();
}

export function useFinanceData(notify: Notify) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [entries, setEntries] = useState<KhataEntry[]>([]);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [groupExpenses, setGroupExpenses] = useState<GroupExpense[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseStatus>('connecting');
  const [authReady, setAuthReady] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const saveCollection = useCallback(async (name: CollectionSpec['name'], records: unknown[]) => {
    try {
      const response = await fetch(`/api/data?collection=${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });
      if (!response.ok) throw new Error('Database write failed');
      setDatabaseStatus('connected');
      return true;
    } catch {
      setDatabaseStatus('setup-required');
      notify('Database not connected. This change was not saved to the server.', 'error');
      return false;
    }
  }, [notify]);

  const saveTransactions = useCallback((records: Transaction[]) => {
    setTransactions(records);
    void saveCollection('transactions', records);
  }, [saveCollection]);
  const saveEntries = useCallback((records: KhataEntry[]) => {
    setEntries(records);
    void saveCollection('khata', records);
  }, [saveCollection]);
  const saveGroups = useCallback((records: ExpenseGroup[]) => {
    setGroups(records);
    void saveCollection('groups', records);
  }, [saveCollection]);
  const saveGroupExpenses = useCallback((records: GroupExpense[]) => {
    setGroupExpenses(records);
    void saveCollection('groupExpenses', records);
  }, [saveCollection]);

  const refreshData = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const [loadedTransactions, loadedEntries, loadedGroups, loadedGroupExpenses] = await Promise.all([
        readCollection('transactions'),
        readCollection('khata'),
        readCollection('groups'),
        readCollection('groupExpenses'),
      ]);
      setTransactions(loadedTransactions as Transaction[]);
      setEntries(loadedEntries as KhataEntry[]);
      setGroups(loadedGroups as ExpenseGroup[]);
      setGroupExpenses(loadedGroupExpenses as GroupExpense[]);
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
        ];
        const loaded = await Promise.all(specs.map((spec) => readCollection(spec.name)));
        for (const [index, spec] of specs.entries()) {
          const serverRecords = loaded[index] as { id?: unknown }[];
          const removeDemoRecords = (records: { id?: unknown }[]) =>
            records.filter((record) => !(typeof record.id === 'number' && record.id >= 1 && record.id <= spec.demoIdLimit));
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
            const migration = await fetch(`/api/data?collection=${spec.name}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(records),
            });
            if (!migration.ok) throw new Error('Could not migrate old records');
          }
          if (!active) return;
          spec.setRecords(records);
          localStorage.removeItem(spec.legacyKey);
        }
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
    transactions, entries, groups, groupExpenses, databaseStatus, authReady, authEnabled, authRequired,
    isRefreshing, isInitialLoading, refreshData, saveTransactions, saveEntries, saveGroups, saveGroupExpenses,
  };
}

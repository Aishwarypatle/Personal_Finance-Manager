import assert from 'node:assert/strict';
import test from 'node:test';
import { detectCsvMapping, guessCategory, mapCsvRowsToTransactions, normalizeDateString, parseCsv } from '../lib/csvImport';
import {
  buildKhataReminderText,
  computeBudgetProgress,
  computeMonthlySummary,
  computeMonthlyTrend,
  getDueRecurringTransactions,
  getKhataDueStatus,
  getKhataTotals,
  normalizeKhataEntries,
  sortKhataEntries,
} from '../lib/financeHelpers';
import type { BudgetRule, Transaction } from '../lib/types';

test('computes monthly summary and budget progress statuses', () => {
  const transactions: Transaction[] = [
    { id: 1, title: 'Salary', amount: 50000, category: 'Other', date: '2026-11-01', type: 'income' },
    { id: 2, title: 'Dinner', amount: 4200, category: 'Food & dining', date: '2026-11-10', type: 'expense' },
    { id: 3, title: 'Flight', amount: 11000, category: 'Travel', date: '2026-11-12', type: 'expense' },
    { id: 4, title: 'Old rent', amount: 12000, category: 'Housing', date: '2026-10-05', type: 'expense' },
  ];
  const summary = computeMonthlySummary(transactions, '2026-11');
  assert.deepEqual(summary, { spent: 15200, income: 50000, net: 34800 });

  const budgets: BudgetRule[] = [
    { id: 'overall', category: 'Overall', limit: 20000 },
    { id: 'food', category: 'Food & dining', limit: 5000 },
    { id: 'travel', category: 'Travel', limit: 10000 },
  ];
  const progress = computeBudgetProgress(transactions, budgets, '2026-11');
  assert.equal(progress[0].status, 'ok');
  assert.equal(progress[1].status, 'warning');
  assert.equal(progress[2].status, 'over');
});

test('detects due recurring templates without duplicating already logged periods', () => {
  const transactions: Transaction[] = [
    { id: 1, title: 'Rent', amount: 15000, category: 'Housing', date: '2026-10-01', type: 'expense', recurring: 'monthly' },
    { id: 2, title: 'Netflix', amount: 649, category: 'Entertainment', date: '2026-11-02', type: 'expense', recurring: 'monthly' },
    { id: 3, title: 'Groceries', amount: 1200, category: 'Food & dining', date: '2026-11-10', type: 'expense', recurring: 'weekly' },
  ];
  const due = getDueRecurringTransactions(transactions, '2026-11-25');
  assert.deepEqual(due.map((item) => item.title), ['Groceries', 'Rent']);
});

test('khata person ledger totals, legacy migration, due status, and reminder formatting', () => {
  const migrated = normalizeKhataEntries([
    {
      id: 10,
      name: 'Rahul',
      phone: '9876543210',
      direction: 'lent',
      amount: '1500',
      paid: 500,
      date: '2026-11-01',
      due: '2026-11-20',
      note: 'Trip cab',
    },
    {
      id: 11,
      name: 'rahul',
      phone: '',
      direction: 'borrowed',
      amount: 200,
      paid: 0,
      date: '2026-11-05',
      due: '',
      note: 'Snacks',
    },
  ]);
  assert.equal(migrated.length, 1);
  const entry = migrated[0];
  assert.equal(new Set(entry.ledger.map((item) => item.id)).size, entry.ledger.length);
  assert.deepEqual(getKhataTotals(entry), { gave: 1500, got: 700, net: 800 });
  assert.equal(entry.direction, 'lent');
  assert.equal(entry.amount, 1500);
  assert.equal(entry.paid, 700);
  assert.equal(getKhataDueStatus(entry, '2026-11-25'), 'overdue');
  assert.equal(getKhataDueStatus(entry, '2026-11-20'), 'due-today');
  assert.match(buildKhataReminderText(entry), /₹800/);

  const [aish2] = normalizeKhataEntries([
    {
      id: 1795621816831,
      name: 'aish2',
      phone: '',
      direction: 'lent',
      amount: 10000,
      paid: 0,
      date: '2026-11-25',
      due: '',
      note: '',
    },
  ]);
  assert.deepEqual(getKhataTotals(aish2), { gave: 10000, got: 0, net: 10000 });
  assert.equal(aish2.direction, 'lent');
  assert.equal(aish2.amount, 10000);
  assert.equal(aish2.paid, 0);

  const sortedByDue = sortKhataEntries(
    normalizeKhataEntries([
      { id: 101, name: 'SettledWithDue', direction: 'lent', amount: 500, paid: 500, date: '2026-11-01', due: '2026-11-10' },
      { id: 102, name: 'NoDueOlder', direction: 'lent', amount: 800, paid: 0, date: '2026-11-05', due: '' },
      { id: 103, name: 'LaterDue', direction: 'lent', amount: 1000, paid: 0, date: '2026-11-20', due: '2026-12-05' },
      { id: 104, name: 'EarlierDue', direction: 'lent', amount: 300, paid: 0, date: '2026-11-22', due: '2026-11-28' },
    ]),
    'due',
  );
  assert.deepEqual(sortedByDue.map((item) => item.name), ['EarlierDue', 'LaterDue', 'NoDueOlder', 'SettledWithDue']);

  const sortedByNewest = sortKhataEntries(
    normalizeKhataEntries([
      { id: 201, name: 'RecentSettled', direction: 'lent', amount: 500, paid: 500, date: '2026-11-25', due: '' },
      { id: 202, name: 'OlderOpen', direction: 'lent', amount: 300, paid: 0, date: '2026-11-10', due: '' },
    ]),
    'newest',
  );
  assert.deepEqual(sortedByNewest.map((item) => item.name), ['OlderOpen', 'RecentSettled']);
});

test('parses CSV rows, normalizes dates, and maps transactions', () => {
  const csv = 'Date,Description,Amount,Type\n18/11/2026,"Zomato, Dinner",-450,expense\n2026-11-19,Freelance Payout,12000,income\n';
  const rows = parseCsv(csv);
  assert.equal(rows.length, 3);
  const mapping = detectCsvMapping(rows[0]);
  const mapped = mapCsvRowsToTransactions(rows.slice(1), mapping, 100);
  assert.equal(mapped.length, 2);
  assert.equal(mapped[0].date, '2026-11-18');
  assert.equal(mapped[0].category, 'Food & dining');
  assert.equal(mapped[0].amount, 450);
  assert.equal(mapped[1].type, 'income');
  assert.equal(guessCategory('Uber airport'), 'Transport');
  assert.equal(normalizeDateString('05-11-2026'), '2026-11-05');
});

test('computes 6-month spending trend buckets', () => {
  const trend = computeMonthlyTrend(
    [{ id: 1, title: 'Coffee', amount: 250, category: 'Food & dining', date: '2026-11-10', type: 'expense' }],
    '2026-11-25',
    6,
  );
  assert.equal(trend.length, 6);
  assert.equal(trend[5].key, '2026-11');
  assert.equal(trend[5].spent, 250);
});

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
} from '../lib/financeHelpers';
import type { BudgetRule, KhataEntry, Transaction } from '../lib/types';

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

test('khata due status and reminder formatting', () => {
  const entry: KhataEntry = {
    id: 10,
    name: 'Rahul',
    phone: '9876543210',
    direction: 'lent',
    amount: 1500,
    paid: 500,
    date: '2026-11-01',
    due: '2026-11-20',
    note: 'Trip cab',
  };
  assert.equal(getKhataDueStatus(entry, '2026-11-25'), 'overdue');
  assert.equal(getKhataDueStatus(entry, '2026-11-20'), 'due-today');
  assert.match(buildKhataReminderText(entry), /₹1,000/);
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

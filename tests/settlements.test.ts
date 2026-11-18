import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSettlements } from '../lib/settlements';
import type { ExpenseGroup, GroupExpense } from '../lib/types';

const group: ExpenseGroup = { id: 9, name: 'Trip', members: ['You', 'Mina', 'Arun'] };

function expense(overrides: Partial<GroupExpense>): GroupExpense {
  return {
    id: 1,
    groupId: group.id,
    title: 'Dinner',
    paidBy: 'You',
    amount: 90,
    date: '2026-11-18',
    shares: { You: 30, Mina: 30, Arun: 30 },
    ...overrides,
  };
}

test('balances equal shares and gives a minimal settlement plan', () => {
  const result = calculateSettlements(group, [expense({})]);
  assert.deepEqual(result.balances, [
    { name: 'You', amount: 60 },
    { name: 'Mina', amount: -30 },
    { name: 'Arun', amount: -30 },
  ]);
  assert.deepEqual(result.settlements, [
    { from: 'Mina', to: 'You', amount: 30 },
    { from: 'Arun', to: 'You', amount: 30 },
  ]);
});

test('preserves paise when settling unequal decimal shares', () => {
  const result = calculateSettlements(group, [expense({
    amount: 10.01,
    shares: { You: 3.33, Mina: 3.34, Arun: 3.34 },
  })]);
  assert.deepEqual(result.balances, [
    { name: 'You', amount: 6.68 },
    { name: 'Mina', amount: -3.34 },
    { name: 'Arun', amount: -3.34 },
  ]);
  assert.deepEqual(result.settlements, [
    { from: 'Mina', to: 'You', amount: 3.34 },
    { from: 'Arun', to: 'You', amount: 3.34 },
  ]);
});

test('returns no transfers for an empty or already balanced group', () => {
  assert.deepEqual(calculateSettlements(group, []), {
    balances: group.members.map((name) => ({ name, amount: 0 })),
    settlements: [],
  });
  assert.deepEqual(calculateSettlements(group, [expense({
    paidBy: 'You',
    amount: 30,
    shares: { You: 30, Mina: 0, Arun: 0 },
  })]).settlements, []);
});

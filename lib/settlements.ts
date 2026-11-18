import type { ExpenseGroup, GroupExpense } from './types';

const roundToPaise = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

export function calculateSettlements(group: ExpenseGroup, expenses: GroupExpense[]) {
  const balances = group.members.map((name) => ({
    name,
    amount: roundToPaise(expenses.reduce(
      (sum, expense) => sum
        + (expense.paidBy === name ? expense.amount : 0)
        - (expense.shares[name] || 0),
      0,
    )),
  }));
  const creditors = balances.filter((member) => member.amount > 0).map((member) => ({ ...member }));
  const debtors = balances
    .filter((member) => member.amount < 0)
    .map((member) => ({ ...member, amount: -member.amount }));
  const settlements: { from: string; to: string; amount: number }[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const amount = roundToPaise(Math.min(debtors[debtorIndex].amount, creditors[creditorIndex].amount));
    if (amount > 0) {
      settlements.push({
        from: debtors[debtorIndex].name,
        to: creditors[creditorIndex].name,
        amount,
      });
    }
    debtors[debtorIndex].amount = roundToPaise(debtors[debtorIndex].amount - amount);
    creditors[creditorIndex].amount = roundToPaise(creditors[creditorIndex].amount - amount);
    if (debtors[debtorIndex].amount <= 0) debtorIndex++;
    if (creditors[creditorIndex].amount <= 0) creditorIndex++;
  }

  return { balances, settlements };
}

import { categories } from '@/lib/categories';
import { formatCurrency, today } from '@/lib/format';
import type { BudgetRule, KhataEntry, Transaction } from '@/lib/types';

export function computeMonthlySummary(transactions: Transaction[], monthPrefix = today.slice(0, 7)) {
  let spent = 0;
  let income = 0;
  for (const transaction of transactions) {
    if (transaction.date.slice(0, 7) !== monthPrefix) continue;
    if (transaction.type === 'income') income += transaction.amount;
    else spent += transaction.amount;
  }
  return { spent, income, net: income - spent };
}

export function computeBudgetProgress(
  transactions: Transaction[],
  budgets: BudgetRule[],
  monthPrefix = today.slice(0, 7),
) {
  const expenses = transactions.filter(
    (transaction) => transaction.type === 'expense' && transaction.date.slice(0, 7) === monthPrefix,
  );
  const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);

  return budgets
    .filter((budget) => budget.limit > 0)
    .map((budget) => {
      const spent =
        budget.category === 'Overall'
          ? totalSpent
          : expenses
              .filter((transaction) => transaction.category === budget.category)
              .reduce((sum, transaction) => sum + transaction.amount, 0);
      const percent = Math.round((spent / budget.limit) * 100);
      const status: 'ok' | 'warning' | 'over' =
        spent > budget.limit ? 'over' : percent >= 80 ? 'warning' : 'ok';
      return {
        ...budget,
        spent,
        percent,
        remaining: Math.max(0, budget.limit - spent),
        status,
      };
    });
}

function getMondayOfWeek(dateString: string) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function getDueRecurringTransactions(transactions: Transaction[], referenceDate = today) {
  const latestByTemplate = new Map<string, Transaction>();
  for (const transaction of transactions) {
    if (!transaction.recurring || transaction.recurring === 'none') continue;
    const key = `${transaction.type}|${transaction.title.trim().toLowerCase()}|${transaction.category}|${transaction.amount}|${transaction.recurring}`;
    const existing = latestByTemplate.get(key);
    if (!existing || transaction.date > existing.date) {
      latestByTemplate.set(key, transaction);
    }
  }

  const currentMonth = referenceDate.slice(0, 7);
  const currentWeekStart = getMondayOfWeek(referenceDate);
  const due: Transaction[] = [];

  for (const template of latestByTemplate.values()) {
    if (template.date > referenceDate) continue;
    if (template.recurring === 'monthly' && template.date.slice(0, 7) < currentMonth) {
      due.push(template);
    } else if (template.recurring === 'weekly' && template.date < currentWeekStart) {
      due.push(template);
    }
  }

  return due.sort((left, right) => right.date.localeCompare(left.date));
}

export function getKhataDueStatus(entry: KhataEntry, referenceDate = today) {
  const remaining = entry.amount - entry.paid;
  if (remaining <= 0) return 'settled' as const;
  if (!entry.due) return 'none' as const;
  if (entry.due < referenceDate) return 'overdue' as const;
  if (entry.due === referenceDate) return 'due-today' as const;
  return 'upcoming' as const;
}

export function buildKhataReminderText(entry: KhataEntry) {
  const remaining = Math.max(0, entry.amount - entry.paid);
  const base = `Hi ${entry.name}, friendly reminder about the pending ${formatCurrency(remaining)}`;
  const details = [entry.note ? `for ${entry.note}` : '', entry.due ? `(due ${entry.due})` : '']
    .filter(Boolean)
    .join(' ');
  return details ? `${base} ${details}.` : `${base}.`;
}

export function computeCategoryBreakdown(transactions: Transaction[]) {
  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);

  return categories
    .map(([name, color]) => {
      const amount = expenses
        .filter((transaction) => transaction.category === name)
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      return {
        name,
        color,
        amount,
        percent: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
      };
    })
    .filter((item) => item.amount > 0)
    .sort((left, right) => right.amount - left.amount);
}

export function computeMonthlyTrend(transactions: Transaction[], referenceDate = today, months = 6) {
  const [year, month] = referenceDate.slice(0, 7).split('-').map(Number);
  const buckets: { key: string; label: string; spent: number; income: number }[] = [];

  for (let offset = months - 1; offset >= 0; offset--) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    const key = date.toISOString().slice(0, 7);
    const label = date.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
    buckets.push({ key, label, spent: 0, income: 0 });
  }

  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  for (const transaction of transactions) {
    const bucket = byKey.get(transaction.date.slice(0, 7));
    if (!bucket) continue;
    if (transaction.type === 'income') bucket.income += transaction.amount;
    else bucket.spent += transaction.amount;
  }

  return buckets;
}

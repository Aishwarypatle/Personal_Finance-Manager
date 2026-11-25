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

export function getKhataTotals(entry: KhataEntry) {
  let gave = 0;
  let got = 0;
  if (Array.isArray(entry.ledger)) {
    for (const item of entry.ledger) {
      if (item.type === 'gave') gave += item.amount;
      else got += item.amount;
    }
  } else {
    const legacyAmount = Number(entry.amount) || 0;
    const legacyPaid = Number(entry.paid) || 0;
    if (entry.direction === 'borrowed') {
      got = legacyAmount;
      gave = legacyPaid;
    } else {
      gave = legacyAmount;
      got = legacyPaid;
    }
  }
  const net = Math.round((gave - got) * 100) / 100;
  return { gave, got, net };
}

export function withSyncedKhataSummary(entry: KhataEntry, fallbackDate = today): KhataEntry {
  const { gave, got, net } = getKhataTotals(entry);
  const latestDate = (entry.ledger || []).reduce(
    (max, item) => (item.date > max ? item.date : max),
    entry.date || fallbackDate,
  );
  const direction: 'lent' | 'borrowed' = net >= 0 ? 'lent' : 'borrowed';
  const amount = Math.round((net >= 0 ? gave : got) * 100) / 100;
  const paid = Math.round((net >= 0 ? got : gave) * 100) / 100;

  return {
    ...entry,
    direction,
    amount,
    paid,
    date: latestDate,
  };
}

export function normalizeKhataEntries(rawRecords: unknown[], fallbackDate = today): KhataEntry[] {
  const people: KhataEntry[] = [];
  const usedTxIds = new Set<number>();
  let idCounter = Date.now();

  const nextUniqueTxId = (preferred?: unknown) => {
    const candidate = Number(preferred);
    if (Number.isFinite(candidate) && candidate > 0 && !usedTxIds.has(candidate)) {
      usedTxIds.add(candidate);
      return candidate;
    }
    while (usedTxIds.has(idCounter)) idCounter++;
    usedTxIds.add(idCounter);
    return idCounter++;
  };

  for (const raw of rawRecords) {
    if (!raw || typeof raw !== 'object') continue;
    const record = raw as Record<string, unknown>;
    const name = String(record.name || 'Unnamed').trim() || 'Unnamed';
    const phone = String(record.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    const nameKey = name.toLowerCase();

    let ledger: KhataEntry['ledger'];
    if (Array.isArray(record.ledger)) {
      ledger = record.ledger
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && Number((item as Record<string, unknown>).amount) > 0))
        .map((item) => {
          const rawType = String(item.type || '').toLowerCase();
          return {
            id: nextUniqueTxId(item.id),
            type: rawType === 'got' || rawType === 'credit' || rawType === 'borrowed' ? 'got' : 'gave',
            amount: Math.round(Number(item.amount) * 100) / 100,
            date: String(item.date || fallbackDate),
            note: String(item.note || ''),
            isSettlement: Boolean(item.isSettlement),
          };
        });
    } else {
      const legacyAmount = Math.round((Number(record.amount) || 0) * 100) / 100;
      const legacyPaid = Math.round((Number(record.paid) || 0) * 100) / 100;
      const legacyDate = String(record.date || fallbackDate);
      const rawDir = String(record.direction || '').toLowerCase();
      const legacyType = rawDir === 'borrowed' || rawDir === 'got' || rawDir === 'credit' ? 'got' : 'gave';
      ledger = [];
      if (legacyAmount > 0) {
        ledger.push({
          id: nextUniqueTxId(record.id),
          type: legacyType,
          amount: legacyAmount,
          date: legacyDate,
          note: String(record.note || ''),
        });
      }
      if (legacyPaid > 0) {
        ledger.push({
          id: nextUniqueTxId(),
          type: legacyType === 'gave' ? 'got' : 'gave',
          amount: legacyPaid,
          date: legacyDate,
          note: 'Settled payment',
          isSettlement: true,
        });
      }
    }

    const existing = people.find((person) => {
      if (person.name.toLowerCase() !== nameKey) return false;
      const existingDigits = person.phone.replace(/\D/g, '');
      return !digits || !existingDigits || digits === existingDigits;
    });

    if (existing) {
      existing.ledger = [...existing.ledger, ...ledger];
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.due && record.due) existing.due = String(record.due);
      if (!existing.note && record.note) existing.note = String(record.note);
    } else {
      people.push({
        id: Number(record.id) || nextUniqueTxId(),
        name,
        phone,
        due: String(record.due || ''),
        note: String(record.note || ''),
        ledger,
      });
    }
  }

  return people.map((person) => withSyncedKhataSummary(person, fallbackDate));
}

export function getKhataLatestDate(entry: KhataEntry) {
  if (!entry.ledger?.length) return entry.date || '';
  return entry.ledger.reduce((max, item) => (item.date > max ? item.date : max), entry.date || '');
}

export function sortKhataEntries(entries: KhataEntry[], sortBy: 'newest' | 'due' | 'amount') {
  return [...entries].sort((left, right) => {
    const leftNet = getKhataTotals(left).net;
    const rightNet = getKhataTotals(right).net;
    const leftAbs = Math.abs(leftNet);
    const rightAbs = Math.abs(rightNet);
    const leftOpen = leftAbs > 0;
    const rightOpen = rightAbs > 0;
    if (leftOpen !== rightOpen) return leftOpen ? -1 : 1;

    if (sortBy === 'amount') {
      return rightAbs - leftAbs || getKhataLatestDate(right).localeCompare(getKhataLatestDate(left)) || right.id - left.id;
    }

    if (sortBy === 'due') {
      const leftDue = leftOpen && left.due ? left.due.trim() : '';
      const rightDue = rightOpen && right.due ? right.due.trim() : '';
      if (leftDue && rightDue) {
        return leftDue.localeCompare(rightDue) || rightAbs - leftAbs || left.id - right.id;
      }
      if (leftDue !== rightDue) return leftDue ? -1 : 1;

      return (
        getKhataLatestDate(left).localeCompare(getKhataLatestDate(right))
        || rightAbs - leftAbs
        || left.id - right.id
      );
    }

    return getKhataLatestDate(right).localeCompare(getKhataLatestDate(left)) || right.id - left.id;
  });
}

export function getKhataDueStatus(entry: KhataEntry, referenceDate = today) {
  const { net } = getKhataTotals(entry);
  if (Math.abs(net) <= 0) return 'settled' as const;
  if (!entry.due) return 'none' as const;
  if (entry.due < referenceDate) return 'overdue' as const;
  if (entry.due === referenceDate) return 'due-today' as const;
  return 'upcoming' as const;
}

export function buildKhataReminderText(entry: KhataEntry) {
  const { net } = getKhataTotals(entry);
  const remaining = Math.max(0, net);
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

export type PageName = 'Overview' | 'Transactions' | 'KhataBook' | 'Groups' | 'Reports' | 'Settings';
export type RecurringFrequency = 'none' | 'weekly' | 'monthly';
export type Transaction = {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
  recurring?: RecurringFrequency;
};
export type KhataTransaction = {
  id: number;
  type: 'gave' | 'got';
  amount: number;
  date: string;
  note: string;
  isSettlement?: boolean;
};
export type KhataEntry = {
  id: number;
  name: string;
  phone: string;
  due: string;
  note: string;
  ledger: KhataTransaction[];
  direction?: 'lent' | 'borrowed';
  amount?: number;
  paid?: number;
  date?: string;
};
export type GroupExpense = {
  id: number;
  groupId: number;
  title: string;
  paidBy: string;
  amount: number;
  date: string;
  shares: Record<string, number>;
  isSettlement?: boolean;
};
export type ExpenseGroup = { id: number; name: string; members: string[] };
export type BudgetRule = {
  id: string;
  category: string;
  limit: number;
};
export type DatabaseStatus = 'connecting' | 'connected' | 'setup-required';
export type ToastType = 'success' | 'error';
export type ToastMessage = {
  message: string;
  type: ToastType;
  id: number;
  actionLabel?: string;
  onAction?: () => void;
};
export type TransactionFormState = {
  title: string;
  amount: string;
  category: string;
  date: string;
  type: 'expense' | 'income';
  recurring: RecurringFrequency;
};
export type DateFilter = {
  preset: 'month' | 'today' | 'week' | 'custom';
  startDate: string;
  endDate: string;
};
export type LedgerBackup = {
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  entries: KhataEntry[];
  groups: ExpenseGroup[];
  groupExpenses: GroupExpense[];
  budgets: BudgetRule[];
};

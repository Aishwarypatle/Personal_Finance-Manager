export type PageName = 'Overview' | 'Transactions' | 'KhataBook' | 'Groups' | 'Reports' | 'Settings';
export type Transaction = {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'expense' | 'income';
};
export type KhataEntry = {
  id: number;
  name: string;
  phone: string;
  direction: 'lent' | 'borrowed';
  amount: number;
  paid: number;
  date: string;
  due: string;
  note: string;
};
export type GroupExpense = {
  id: number;
  groupId: number;
  title: string;
  paidBy: string;
  amount: number;
  date: string;
  shares: Record<string, number>;
};
export type ExpenseGroup = { id: number; name: string; members: string[] };
export type DatabaseStatus = 'connecting' | 'connected' | 'setup-required';
export type ToastType = 'success' | 'error';
export type ToastMessage = { message: string; type: ToastType; id: number };
export type TransactionFormState = {
  title: string;
  amount: string;
  category: string;
  date: string;
  type: 'expense' | 'income';
};
export type DateFilter = {
  preset: 'month' | 'today' | 'week' | 'custom';
  startDate: string;
  endDate: string;
};

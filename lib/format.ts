export const today = new Date().toISOString().slice(0, 10);
export const weekStart = new Date(Date.parse(today) - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const formatCurrency = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export function formatDate(date: string, referenceDate = today) {
  return date === referenceDate
    ? 'Today'
    : new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      });
}

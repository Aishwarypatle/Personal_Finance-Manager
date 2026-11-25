export const today = new Date().toISOString().slice(0, 10);
export const yesterday = new Date(Date.parse(today) - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
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

export function formatDateHeading(date: string, referenceDate = today) {
  if (date === referenceDate) return 'Today';
  const refYesterday = new Date(Date.parse(`${referenceDate}T00:00:00Z`) - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  if (date === refYesterday) return 'Yesterday';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.slice(0, 4) === referenceDate.slice(0, 4) ? undefined : 'numeric',
  });
}

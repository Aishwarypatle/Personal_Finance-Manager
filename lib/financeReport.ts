import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeMonthlyTrend,
} from '@/lib/financeHelpers';
import { today } from '@/lib/format';
import type { BudgetRule, DateFilter, Transaction } from '@/lib/types';

type FinanceReportInput = {
  transactions: Transaction[];
  allTransactions: Transaction[];
  budgets: BudgetRule[];
  peopleOwe: number;
  dateFilter: DateFilter;
};

const formatMoney = (amount: number) =>
  `INR ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCompactMoney = (amount: number) => {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
  return String(Math.round(amount));
};

const formatReportDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

function formatPeriodLabel(dateFilter: DateFilter) {
  if (dateFilter.preset === 'today') return `Today (${formatReportDate(today)})`;
  if (dateFilter.preset === 'week') return 'Last 7 days';
  if (dateFilter.preset === 'custom') {
    const start = dateFilter.startDate ? formatReportDate(dateFilter.startDate) : 'Start';
    const end = dateFilter.endDate ? formatReportDate(dateFilter.endDate) : 'Today';
    return `${start} - ${end}`;
  }
  return new Date(`${today}T12:00:00`).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(220, 231, 226);
    doc.line(42, 805, 553, 805);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(116, 132, 127);
    doc.text('Ledger - personal finance', 42, 820);
    doc.text(`Page ${page} of ${pageCount}`, 553, 820, { align: 'right' });
  }
}

function renderDonutChartImage(
  breakdown: { name: string; color: string; amount: number; percent: number }[],
  totalSpent: number,
): string | null {
  if (typeof globalThis.document === 'undefined') return null;
  const scale = 3;
  const width = 244;
  const height = 160;
  const canvas = globalThis.document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, width, height);

  const cx = 64;
  const cy = 80;
  const outerR = 52;
  const innerR = 34;

  if (breakdown.length === 0 || totalSpent <= 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.fillStyle = '#e6ecea';
    ctx.fill();

    ctx.fillStyle = '#738286';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No expenses', cx, cy);
    return canvas.toDataURL('image/png');
  }

  let startAngle = -Math.PI / 2;
  for (const slice of breakdown) {
    const angle = (slice.amount / totalSpent) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + angle);
    ctx.arc(cx, cy, innerR, startAngle + angle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    startAngle += angle;
  }

  // Center label
  ctx.fillStyle = '#24342f';
  ctx.font = '700 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`INR ${formatCompactMoney(totalSpent)}`, cx, cy - 5);
  ctx.fillStyle = '#7a8a85';
  ctx.font = '500 8px sans-serif';
  ctx.fillText('Total spent', cx, cy + 8);

  // Right-side legend (top 6 categories)
  const items = breakdown.slice(0, 6);
  const startY = 26;
  const rowGap = 21;
  items.forEach((item, index) => {
    const y = startY + index * rowGap;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(130, y - 4, 7, 7, 2);
    ctx.fill();

    ctx.fillStyle = '#33443f';
    ctx.font = '500 8.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const label = item.name.length > 13 ? `${item.name.slice(0, 12)}…` : item.name;
    ctx.fillText(label, 142, y);

    ctx.fillStyle = '#6d7e79';
    ctx.font = '600 8.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.percent}%`, 240, y);
  });

  return canvas.toDataURL('image/png');
}

function renderCashflowBarChartImage(
  trend: { key: string; label: string; spent: number; income: number }[],
): string | null {
  if (typeof globalThis.document === 'undefined') return null;
  const scale = 3;
  const width = 244;
  const height = 160;
  const canvas = globalThis.document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.scale(scale, scale);
  ctx.clearRect(0, 0, width, height);

  const chartLeft = 34;
  const chartRight = 236;
  const chartTop = 26;
  const chartBottom = 132;
  const chartHeight = chartBottom - chartTop;
  const maxVal = Math.max(100, ...trend.map((month) => Math.max(month.income, month.spent)));

  // Legend at top right
  ctx.fillStyle = '#9fdac1';
  ctx.beginPath();
  ctx.roundRect(142, 6, 7, 7, 2);
  ctx.fill();
  ctx.fillStyle = '#5c6e69';
  ctx.font = '500 8px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('Income', 152, 10);

  ctx.fillStyle = '#238464';
  ctx.beginPath();
  ctx.roundRect(190, 6, 7, 7, 2);
  ctx.fill();
  ctx.fillStyle = '#5c6e69';
  ctx.fillText('Spent', 200, 10);

  // Horizontal gridlines
  ctx.strokeStyle = '#e8eeec';
  ctx.lineWidth = 1;
  for (let step = 0; step <= 3; step++) {
    const y = chartBottom - (step / 3) * chartHeight;
    ctx.beginPath();
    ctx.moveTo(chartLeft, y);
    ctx.lineTo(chartRight, y);
    ctx.stroke();

    const tickValue = Math.round((maxVal * step) / 3);
    ctx.fillStyle = '#8b9995';
    ctx.font = '500 7.5px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCompactMoney(tickValue), chartLeft - 5, y);
  }

  // Grouped bars per month
  const slotWidth = (chartRight - chartLeft) / Math.max(1, trend.length);
  trend.forEach((month, index) => {
    const centerX = chartLeft + slotWidth * (index + 0.5);
    const barW = 9;
    const gap = 3;

    const incomeH = month.income > 0 ? Math.max(3, (month.income / maxVal) * chartHeight) : 2;
    const spentH = month.spent > 0 ? Math.max(3, (month.spent / maxVal) * chartHeight) : 2;

    ctx.fillStyle = '#9fdac1';
    ctx.beginPath();
    ctx.roundRect(centerX - barW - gap / 2, chartBottom - incomeH, barW, incomeH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#238464';
    ctx.beginPath();
    ctx.roundRect(centerX + gap / 2, chartBottom - spentH, barW, spentH, [3, 3, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#6d7e79';
    ctx.font = '500 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(month.label, centerX, chartBottom + 6);
  });

  return canvas.toDataURL('image/png');
}

export function downloadFinanceReport({
  transactions,
  allTransactions,
  budgets,
  peopleOwe,
  dateFilter,
}: FinanceReportInput) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();

  const expenses = transactions.filter((transaction) => transaction.type === 'expense');
  const incomeItems = transactions.filter((transaction) => transaction.type === 'income');
  const totalSpent = expenses.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = incomeItems.reduce((sum, transaction) => sum + transaction.amount, 0);
  const net = totalIncome - totalSpent;
  const breakdown = computeCategoryBreakdown(transactions);
  const trend = computeMonthlyTrend(allTransactions);
  const budgetProgress = computeBudgetProgress(allTransactions, budgets);

  // Header Banner (consistent with Group & Khata PDFs)
  doc.setFillColor(35, 132, 100);
  doc.rect(0, 0, width, 132, 'F');
  doc.setFillColor(244, 185, 66);
  doc.circle(520, 30, 38, 'F');
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(42, 35, 34, 34, 8, 8, 'F');
  doc.setTextColor(35, 132, 100);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('L', 54, 58);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('Financial Snapshot Report', 90, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Period: ${formatPeriodLabel(dateFilter)} · Receivables: ${formatMoney(peopleOwe)}`, 90, 75);
  doc.setFontSize(9);
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    42,
    112,
  );

  // 4 Summary Cards
  const cards = [
    ['TOTAL SPENT', formatMoney(totalSpent)],
    ['TOTAL INCOME', formatMoney(totalIncome)],
    [net >= 0 ? 'NET SAVED' : 'NET DEFICIT', formatMoney(Math.abs(net))],
    ['TRANSACTIONS', String(transactions.length)],
  ];
  cards.forEach(([label, value], index) => {
    const x = 42 + index * 130;
    doc.setFillColor(246, 249, 247);
    doc.roundedRect(x, 150, 121, 62, 8, 8, 'F');
    doc.setTextColor(109, 129, 122);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(label, x + 11, 171);
    doc.setTextColor(36, 52, 47);
    doc.setFontSize(11.5);
    doc.text(value, x + 11, 195);
  });

  // Side-by-side Charts (Donut + 6-Month Cashflow Bar)
  doc.setFillColor(250, 252, 251);
  doc.setDrawColor(232, 238, 236);
  doc.roundedRect(42, 228, 250, 188, 8, 8, 'FD');
  doc.roundedRect(303, 228, 250, 188, 8, 8, 'FD');

  doc.setTextColor(36, 52, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Spending by category', 54, 248);
  doc.text('6-month cashflow', 315, 248);

  const donutImage = renderDonutChartImage(breakdown, totalSpent);
  if (donutImage) {
    doc.addImage(donutImage, 'PNG', 45, 254, 244, 156);
  }
  const barImage = renderCashflowBarChartImage(trend);
  if (barImage) {
    doc.addImage(barImage, 'PNG', 306, 254, 244, 156);
  }

  // Category Breakdown Table
  doc.setTextColor(36, 52, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Category breakdown', 42, 446);

  autoTable(doc, {
    startY: 458,
    margin: { left: 42, right: 42, bottom: 48 },
    head: [['Category', 'Entries', 'Share', 'Total spent']],
    body: breakdown.length
      ? breakdown.map((item) => [
          item.name,
          String(expenses.filter((tx) => tx.category === item.name).length),
          `${item.percent}%`,
          formatMoney(item.amount),
        ])
      : [['-', '0', '0%', 'INR 0.00']],
    theme: 'plain',
    headStyles: { fillColor: [35, 132, 100], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 8 },
    bodyStyles: { textColor: [42, 58, 53], fontSize: 9, cellPadding: 8 },
    alternateRowStyles: { fillColor: [246, 249, 247] },
    columnStyles: {
      1: { halign: 'center', cellWidth: 60 },
      2: { halign: 'right', cellWidth: 60 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 110 },
    },
  });

  let cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

  // Optional Monthly Budgets Table
  if (budgetProgress.length > 0) {
    if (cursorY > 680) {
      doc.addPage();
      cursorY = 42;
    } else {
      cursorY += 32;
    }
    doc.setTextColor(36, 52, 47);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Monthly budget status', 42, cursorY);

    autoTable(doc, {
      startY: cursorY + 12,
      margin: { left: 42, right: 42, bottom: 48 },
      head: [['Budget', 'Limit', 'Spent', 'Usage', 'Status']],
      body: budgetProgress.map((item) => [
        item.category,
        formatMoney(item.limit),
        formatMoney(item.spent),
        `${item.percent}%`,
        item.status === 'over' ? 'Exceeded' : item.status === 'warning' ? 'Near limit' : 'On track',
      ]),
      theme: 'plain',
      headStyles: { fillColor: [229, 241, 235], textColor: [35, 104, 78], fontStyle: 'bold', fontSize: 9, cellPadding: 8 },
      bodyStyles: { textColor: [42, 58, 53], fontSize: 9, cellPadding: 8 },
      alternateRowStyles: { fillColor: [248, 250, 249] },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  }

  // Transactions Detail Table
  if (cursorY > 680) {
    doc.addPage();
    cursorY = 42;
  } else {
    cursorY += 32;
  }
  doc.setTextColor(36, 52, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Transactions in period', 42, cursorY);

  autoTable(doc, {
    startY: cursorY + 12,
    margin: { left: 42, right: 42, bottom: 48 },
    head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
    body: transactions.length
      ? transactions.map((tx) => [
          formatReportDate(tx.date),
          tx.title,
          tx.category,
          tx.type === 'income' ? 'Income' : 'Expense',
          `${tx.type === 'income' ? '+' : '-'}${formatMoney(tx.amount)}`,
        ])
      : [['-', 'No transactions in selected period', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [35, 132, 100], textColor: 255, fontStyle: 'bold', fontSize: 8.5, cellPadding: 7 },
    bodyStyles: { textColor: [42, 58, 53], fontSize: 8.5, cellPadding: 7 },
    alternateRowStyles: { fillColor: [248, 250, 249] },
    columnStyles: {
      0: { cellWidth: 68 },
      2: { cellWidth: 94 },
      3: { cellWidth: 55 },
      4: { halign: 'right', fontStyle: 'bold', cellWidth: 96 },
    },
  });

  addPageNumbers(doc);
  doc.save(`finance-report-${dateFilter.preset}-${today}.pdf`);
}

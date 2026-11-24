import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExpenseGroup, GroupExpense } from '@/lib/types';

type Settlement = { from: string; to: string; amount: number };
type Balance = { name: string; amount: number };

const formatMoney = (amount: number) => `INR ${Number(amount || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatReportDate = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function addPageNumbers(document: jsPDF) {
  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    document.setPage(page);
    document.setDrawColor(220, 231, 226);
    document.line(42, 805, 553, 805);
    document.setFont('helvetica', 'normal');
    document.setFontSize(8);
    document.setTextColor(116, 132, 127);
    document.text('Ledger - personal finance', 42, 820);
    document.text(`Page ${page} of ${pageCount}`, 553, 820, { align: 'right' });
  }
}

export function downloadGroupReport(group: ExpenseGroup, expenses: GroupExpense[], balances: Balance[], settlements: Settlement[]) {
  const document = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = document.internal.pageSize.getWidth();
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalToSettle = settlements.reduce((sum, settlement) => sum + settlement.amount, 0);

  document.setFillColor(35, 132, 100);
  document.rect(0, 0, width, 132, 'F');
  document.setFillColor(244, 185, 66);
  document.circle(520, 30, 38, 'F');
  document.setFillColor(255, 255, 255);
  document.roundedRect(42, 35, 34, 34, 8, 8, 'F');
  document.setTextColor(35, 132, 100);
  document.setFont('helvetica', 'bold');
  document.setFontSize(18);
  document.text('L', 54, 58);
  document.setTextColor(255, 255, 255);
  document.setFontSize(22);
  document.text(group.name, 90, 55);
  document.setFont('helvetica', 'normal');
  document.setFontSize(10);
  document.text('Shared trip expense and settlement report', 90, 75);
  document.setFontSize(9);
  document.text(`Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 42, 112);

  const cards = [
    ['TOTAL SPENT', formatMoney(totalSpent)],
    ['MEMBERS', String(group.members.length)],
    ['TO SETTLE', formatMoney(totalToSettle)],
  ];
  cards.forEach(([label, value], index) => {
    const x = 42 + index * 172;
    document.setFillColor(246, 249, 247);
    document.roundedRect(x, 152, 156, 65, 8, 8, 'F');
    document.setTextColor(109, 129, 122);
    document.setFont('helvetica', 'bold');
    document.setFontSize(8);
    document.text(label, x + 13, 175);
    document.setTextColor(36, 52, 47);
    document.setFontSize(13);
    document.text(value, x + 13, 200);
  });

  document.setTextColor(36, 52, 47);
  document.setFont('helvetica', 'bold');
  document.setFontSize(15);
  document.text('Settle up', 42, 255);
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(109, 129, 122);
  document.text('Use these transfers to make every member even.', 42, 271);

  autoTable(document, {
    startY: 284,
    margin: { left: 42, right: 42 },
    head: [['From', 'Pays', 'To', 'Amount']],
    body: settlements.length
      ? settlements.map((settlement) => [settlement.from, 'pays', settlement.to, formatMoney(settlement.amount)])
      : [['Everyone', 'is', 'settled up', '-']],
    theme: 'plain',
    headStyles: { fillColor: [35, 132, 100], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 8 },
    bodyStyles: { textColor: [42, 58, 53], fontSize: 10, cellPadding: 9 },
    alternateRowStyles: { fillColor: [246, 249, 247] },
    columnStyles: { 1: { halign: 'center', textColor: [109, 129, 122] }, 3: { halign: 'right', fontStyle: 'bold' } },
  });

  const afterSettlements = (document as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  document.setTextColor(36, 52, 47);
  document.setFont('helvetica', 'bold');
  document.setFontSize(15);
  document.text('Balances by member', 42, afterSettlements + 38);

  autoTable(document, {
    startY: afterSettlements + 49,
    margin: { left: 42, right: 42 },
    head: [['Member', 'Status', 'Net balance']],
    body: balances.map((balance) => [
      balance.name,
      balance.amount > 0 ? 'Should receive' : balance.amount < 0 ? 'Needs to pay' : 'Settled',
      balance.amount === 0 ? '-' : formatMoney(Math.abs(balance.amount)),
    ]),
    theme: 'plain',
    headStyles: { fillColor: [229, 241, 235], textColor: [35, 104, 78], fontStyle: 'bold', fontSize: 9, cellPadding: 8 },
    bodyStyles: { textColor: [42, 58, 53], fontSize: 10, cellPadding: 9 },
    alternateRowStyles: { fillColor: [248, 250, 249] },
    columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
  });

  const afterBalances = (document as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  document.setTextColor(36, 52, 47);
  document.setFont('helvetica', 'bold');
  document.setFontSize(15);
  document.text('Expense details', 42, afterBalances + 38);

  autoTable(document, {
    startY: afterBalances + 49,
    margin: { left: 42, right: 42, bottom: 48 },
    head: [['Date', 'Expense', 'Paid by', 'Total', 'Split details']],
    body: expenses.length
      ? expenses.map((expense) => [
        formatReportDate(expense.date),
        expense.title,
        expense.paidBy,
        formatMoney(expense.amount),
        Object.entries(expense.shares).map(([name, share]) => `${name}: ${formatMoney(share)}`).join('\n'),
      ])
      : [['-', 'No expenses recorded', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: [35, 132, 100], textColor: 255, fontStyle: 'bold', fontSize: 8, cellPadding: 7 },
    bodyStyles: { textColor: [42, 58, 53], fontSize: 8, cellPadding: 7, valign: 'top' },
    alternateRowStyles: { fillColor: [248, 250, 249] },
    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 94 }, 2: { cellWidth: 66 }, 3: { cellWidth: 72, halign: 'right' }, 4: { cellWidth: 166 } },
  });

  addPageNumbers(document);
  const fileBase = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'trip';
  document.save(`${fileBase}-settlement-report.pdf`);
}

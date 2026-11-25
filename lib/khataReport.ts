import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getKhataTotals } from '@/lib/financeHelpers';
import type { KhataEntry } from '@/lib/types';

const formatMoney = (amount: number) =>
  `INR ${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatReportDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
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

export function downloadKhataReport(entry: KhataEntry) {
  const document = new jsPDF({ unit: 'pt', format: 'a4' });
  const width = document.internal.pageSize.getWidth();
  const { gave, got, net } = getKhataTotals(entry);

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
  document.text(entry.name, 90, 55);
  document.setFont('helvetica', 'normal');
  document.setFontSize(10);
  const metaParts = [
    'Personal Khata statement',
    entry.phone ? `Phone: ${entry.phone}` : '',
    entry.due ? `Due: ${formatReportDate(entry.due)}` : '',
  ].filter(Boolean);
  document.text(metaParts.join(' · '), 90, 75);
  document.setFontSize(9);
  document.text(
    `Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    42,
    112,
  );

  const netLabel = net > 0 ? 'YOU WILL GET' : net < 0 ? 'YOU WILL GIVE' : 'STATUS';
  const netValue = net === 0 ? 'Settled' : formatMoney(Math.abs(net));

  const cards = [
    ['YOU GAVE (DEBIT)', formatMoney(gave)],
    ['YOU GOT (CREDIT)', formatMoney(got)],
    [netLabel, netValue],
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
  document.text('Transaction history', 42, 255);
  document.setFont('helvetica', 'normal');
  document.setFontSize(9);
  document.setTextColor(109, 129, 122);
  document.text(
    entry.note ? `Note: ${entry.note}` : 'Chronological record of credit and debit entries.',
    42,
    271,
  );

  const chronological = [...(entry.ledger || [])].sort((left, right) => {
    const dateCmp = left.date.localeCompare(right.date);
    return dateCmp !== 0 ? dateCmp : left.id - right.id;
  });

  let running = 0;
  const rows = chronological.map((item) => {
    running = Math.round((running + (item.type === 'gave' ? item.amount : -item.amount)) * 100) / 100;
    const balanceText =
      running === 0
        ? 'Settled'
        : running > 0
          ? `Get ${formatMoney(running)}`
          : `Give ${formatMoney(Math.abs(running))}`;

    return [
      formatReportDate(item.date),
      item.note || (item.type === 'gave' ? 'Money given' : 'Money received'),
      item.type === 'gave' ? 'You Gave' : 'You Got',
      formatMoney(item.amount),
      balanceText,
    ];
  });

  autoTable(document, {
    startY: 284,
    margin: { left: 42, right: 42, bottom: 48 },
    head: [['Date', 'Details', 'Type', 'Amount', 'Balance']],
    body: rows.length ? rows : [['-', 'No transactions recorded', '-', '-', '-']],
    theme: 'plain',
    headStyles: { fillColor: [35, 132, 100], textColor: 255, fontStyle: 'bold', fontSize: 9, cellPadding: 8 },
    bodyStyles: { textColor: [42, 58, 53], fontSize: 9, cellPadding: 8 },
    alternateRowStyles: { fillColor: [246, 249, 247] },
    columnStyles: {
      0: { cellWidth: 68 },
      2: { cellWidth: 64 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 88 },
      4: { halign: 'right', cellWidth: 96 },
    },
  });

  addPageNumbers(document);
  const fileBase = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'person';
  document.save(`${fileBase}-khata-statement.pdf`);
}

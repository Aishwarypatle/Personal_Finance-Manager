import { categories } from '@/lib/categories';
import { today } from '@/lib/format';
import type { Transaction } from '@/lib/types';

export type CsvColumnMapping = {
  dateCol: number;
  titleCol: number;
  amountCol: number;
  typeCol: number;
  categoryCol: number;
};

const categoryKeywords: [string, string[]][] = [
  ['Food & dining', ['zomato', 'swiggy', 'cafe', 'coffee', 'restaurant', 'dinner', 'lunch', 'breakfast', 'grocery', 'blinkit', 'zepto', 'instamart', 'food', 'bakery', 'tea']],
  ['Transport', ['uber', 'ola', 'rapido', 'metro', 'fuel', 'petrol', 'diesel', 'parking', 'toll', 'cab', 'auto', 'bus', 'train']],
  ['Shopping', ['amazon', 'flipkart', 'myntra', 'ajio', 'mall', 'store', 'shop', 'clothes', 'electronics']],
  ['Housing', ['rent', 'electricity', 'water', 'wifi', 'broadband', 'internet', 'maintenance', 'gas', 'bill', 'emi']],
  ['Health', ['pharmacy', 'medical', 'hospital', 'doctor', 'clinic', 'medicine', 'apollo', 'gym', 'health']],
  ['Entertainment', ['netflix', 'spotify', 'prime', 'hotstar', 'movie', 'cinema', 'pvr', 'inox', 'game']],
  ['Education', ['course', 'udemy', 'coursera', 'book', 'tuition', 'exam', 'school', 'college']],
  ['Travel', ['flight', 'hotel', 'irctc', 'makemytrip', 'goibibo', 'airbnb', 'trip', 'resort', 'indigo']],
];

const validCategories = new Set<string>(categories.map(([name]) => name));

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const clean = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < clean.length; index++) {
    const char = clean[index];
    if (inQuotes) {
      if (char === '"' && clean[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && clean[index + 1] === '\n') index++;
      row.push(cell.trim());
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some((value) => value !== '')) rows.push(row);
  return rows;
}

export function guessCategory(title: string) {
  const lower = title.toLowerCase();
  for (const [category, keywords] of categoryKeywords) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category;
  }
  return 'Other';
}

export function normalizeDateString(raw: string, fallback = today) {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const slashMatch = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(trimmed);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : fallback;
}

export function detectCsvMapping(headers: string[]): CsvColumnMapping {
  const lower = headers.map((header) => header.toLowerCase());
  const findCol = (patterns: string[], fallback = -1) =>
    lower.findIndex((header) => patterns.some((pattern) => header.includes(pattern))) ?? fallback;

  const dateCol = Math.max(0, findCol(['date', 'time', 'posted'], 0));
  const titleCol = Math.max(0, findCol(['description', 'title', 'narration', 'merchant', 'note', 'particular'], 1));
  const amountCol = Math.max(0, findCol(['amount', 'value', 'inr', 'debit', 'total'], 2));
  const typeCol = findCol(['type', 'dr/cr', 'direction']);
  const categoryCol = findCol(['category', 'tag']);

  return { dateCol, titleCol, amountCol, typeCol, categoryCol };
}

export function mapCsvRowsToTransactions(
  rows: string[][],
  mapping: CsvColumnMapping,
  baseId = Date.now(),
): Transaction[] {
  const result: Transaction[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rawAmount = (row[mapping.amountCol] || '').replace(/[₹,\s]/g, '');
    const numeric = Number(rawAmount);
    if (!Number.isFinite(numeric) || numeric === 0) continue;

    const title = (row[mapping.titleCol] || '').trim() || 'Imported transaction';
    const date = normalizeDateString(row[mapping.dateCol] || '');
    const rawType = mapping.typeCol >= 0 ? (row[mapping.typeCol] || '').toLowerCase() : '';
    const resolvedType: Transaction['type'] =
      rawType.includes('income') || rawType.includes('credit') || rawType === 'cr'
        ? 'income'
        : 'expense';

    const rawCategory = mapping.categoryCol >= 0 ? (row[mapping.categoryCol] || '').trim() : '';
    const category = validCategories.has(rawCategory) ? rawCategory : guessCategory(title);

    result.push({
      id: baseId + index,
      title,
      amount: Math.abs(Math.round(numeric * 100) / 100),
      category,
      date,
      type: resolvedType,
      recurring: 'none',
    });
  }

  return result;
}

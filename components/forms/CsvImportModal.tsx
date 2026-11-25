import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { detectCsvMapping, mapCsvRowsToTransactions, parseCsv } from '@/lib/csvImport';
import type { CsvColumnMapping } from '@/lib/csvImport';
import type { Transaction } from '@/lib/types';
import { ModalTitle } from '@/components/shared/ModalTitle';

type Props = {
  onImport: (transactions: Transaction[]) => void;
  onClose: () => void;
};

export function CsvImportModal({ onImport, onClose }: Props) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({ dateCol: 0, titleCol: 1, amountCol: 2, typeCol: -1, categoryCol: -1 });
  const [error, setError] = useState('');

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      if (parsed.length < 2) {
        setError('CSV must include a header row and at least one transaction row.');
        return;
      }
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      setMapping(detectCsvMapping(parsed[0]));
    } catch {
      setError('Could not read the selected CSV file.');
    }
  };

  const previewTransactions = useMemo(
    () => (rows.length ? mapCsvRowsToTransactions(rows, mapping) : []),
    [rows, mapping],
  );

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal max-h-[88vh] w-full max-w-[520px] overflow-y-auto">
        <ModalTitle title="Import CSV transactions" onClose={onClose} />
        <p className="mb-3 text-[11px] text-[#8b979b]">
          Upload a bank or wallet CSV export. Categories are auto-detected from descriptions if no category column is mapped.
        </p>

        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#c9dcd4] bg-[#f4faf7] p-4 text-[11px] font-semibold text-[#2d8a69] hover:bg-[#ebf6f1] dark:border-[#355348] dark:bg-[#1d2e29] dark:text-[#73d2a9]">
          <Upload size={16} />
          <span>{headers.length ? `${rows.length} rows loaded — choose another CSV` : 'Choose CSV file'}</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { void handleFileChange(event); }} />
        </label>

        {headers.length > 0 && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2.5 max-[560px]:grid-cols-1">
              <label className="field !m-0">
                Date column
                <select value={mapping.dateCol} onChange={(event) => setMapping((prev) => ({ ...prev, dateCol: Number(event.target.value) }))}>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </select>
              </label>
              <label className="field !m-0">
                Description column
                <select value={mapping.titleCol} onChange={(event) => setMapping((prev) => ({ ...prev, titleCol: Number(event.target.value) }))}>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </select>
              </label>
              <label className="field !m-0">
                Amount column
                <select value={mapping.amountCol} onChange={(event) => setMapping((prev) => ({ ...prev, amountCol: Number(event.target.value) }))}>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </select>
              </label>
              <label className="field !m-0">
                Type column (optional)
                <select value={mapping.typeCol} onChange={(event) => setMapping((prev) => ({ ...prev, typeCol: Number(event.target.value) }))}>
                  <option value={-1}>Default to expense</option>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-[#edf0f2] p-3 dark:border-[#2b3a3c]">
              <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#647278] dark:text-[#b2c0bc]">
                <span>Preview ({previewTransactions.length} valid rows)</span>
              </div>
              {previewTransactions.length === 0 ? (
                <p className="text-[10px] text-[#9aa4a7]">No valid numeric amounts matched the selected columns.</p>
              ) : (
                <div className="grid gap-1.5">
                  {previewTransactions.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate font-medium text-[#324046] dark:text-[#dce5e2]">{item.title}</span>
                      <span className="shrink-0 text-[#8e999d]">{item.category} · {item.date}</span>
                      <b className="shrink-0 text-[#253138] dark:text-[#e3ebea]">
                        {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <button
          type="button"
          disabled={previewTransactions.length === 0}
          onClick={() => onImport(previewTransactions)}
          className="primary submit-button mt-4"
        >
          Import {previewTransactions.length || ''} transactions
        </button>
      </div>
    </div>
  );
}

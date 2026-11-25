import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { detectCsvMapping, mapCsvRowsToTransactions, parseCsv } from '@/lib/csvImport';
import type { CsvColumnMapping } from '@/lib/csvImport';
import type { Transaction } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Input';
import { Modal, ModalHeader } from '@/components/ui/Modal';

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
    <Modal size="lg" onClose={onClose} ariaLabel="Import CSV transactions">
      <ModalHeader
        title="Import CSV transactions"
        subtitle="Categories are auto-detected from descriptions when no category column is mapped."
        onClose={onClose}
      />

      <div className="space-y-4 overflow-y-auto px-5 py-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#c9dcd4] bg-[#f4faf7] p-4 text-[11.5px] font-medium text-[#2d8a69] transition-colors hover:bg-[#ebf6f1] dark:border-[#355348] dark:bg-[#1d2e29] dark:text-[#73d2a9]">
          <Upload size={16} />
          <span>{headers.length ? `${rows.length} rows loaded — choose another CSV` : 'Choose CSV file'}</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { void handleFileChange(event); }} />
        </label>

        {headers.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 max-[560px]:grid-cols-1">
              <Field label="Date column">
                <Select value={mapping.dateCol} onChange={(event) => setMapping((prev) => ({ ...prev, dateCol: Number(event.target.value) }))}>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </Select>
              </Field>
              <Field label="Description column">
                <Select value={mapping.titleCol} onChange={(event) => setMapping((prev) => ({ ...prev, titleCol: Number(event.target.value) }))}>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </Select>
              </Field>
              <Field label="Amount column">
                <Select value={mapping.amountCol} onChange={(event) => setMapping((prev) => ({ ...prev, amountCol: Number(event.target.value) }))}>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </Select>
              </Field>
              <Field label="Type column" optional>
                <Select value={mapping.typeCol} onChange={(event) => setMapping((prev) => ({ ...prev, typeCol: Number(event.target.value) }))}>
                  <option value={-1}>Default to expense</option>
                  {headers.map((header, index) => <option key={index} value={index}>{header || `Column ${index + 1}`}</option>)}
                </Select>
              </Field>
            </div>

            <div className="rounded-xl border border-[#edf0f2] bg-[#fafcfb] p-3.5 dark:border-[#2b3a3c] dark:bg-[#172224]">
              <div className="mb-2 text-[10.5px] font-medium text-[#647278] dark:text-[#b2c0bc]">
                Preview ({previewTransactions.length} valid rows)
              </div>
              {previewTransactions.length === 0 ? (
                <p className="text-[10.5px] text-[#9aa4a7]">No valid numeric amounts matched the selected columns.</p>
              ) : (
                <div className="grid gap-1.5">
                  {previewTransactions.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="truncate font-medium text-[#324046] dark:text-[#dce5e2]">{item.title}</span>
                      <span className="shrink-0 text-[#8e999d]">{item.category} · {item.date}</span>
                      <b className="shrink-0 font-medium tabular-nums text-[#253138] dark:text-[#e3ebea]">
                        {item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}
                      </b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="text-[11px] text-[#c95540]" role="alert">{error}</p>}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-[#eff3f2] px-5 py-3.5 dark:border-[#273537]">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          disabled={previewTransactions.length === 0}
          onClick={() => onImport(previewTransactions)}
        >
          Import {previewTransactions.length || ''} transactions
        </Button>
      </div>
    </Modal>
  );
}

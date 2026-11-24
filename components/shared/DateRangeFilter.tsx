import { CalendarDays } from 'lucide-react';
import type { DateFilter } from '@/lib/types';

type Props = {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  const updatePreset = (preset: DateFilter['preset']) => onChange({ ...value, preset });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className="select-button" value={value.preset} onChange={(event) => updatePreset(event.target.value as DateFilter['preset'])} aria-label="Transaction date range">
        <option value="month">This month</option>
        <option value="today">Today</option>
        <option value="week">This week</option>
        <option value="custom">Custom range</option>
      </select>
      {value.preset === 'custom' && (
        <div className="flex items-center gap-1 text-[10px] text-muted">
          <label className="flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 dark:border-[#344446] dark:bg-[#172224]"><CalendarDays size={14} /><span className="sr-only">Start date</span><input className="w-[112px] border-0 bg-transparent text-[10px] outline-none" type="date" value={value.startDate} onChange={(event) => onChange({ ...value, startDate: event.target.value })} /></label>
          <span>to</span>
          <label className="rounded-md border border-line bg-white px-2 py-1 dark:border-[#344446] dark:bg-[#172224]"><span className="sr-only">End date</span><input className="w-[112px] border-0 bg-transparent text-[10px] outline-none" type="date" value={value.endDate} onChange={(event) => onChange({ ...value, endDate: event.target.value })} /></label>
        </div>
      )}
    </div>
  );
}

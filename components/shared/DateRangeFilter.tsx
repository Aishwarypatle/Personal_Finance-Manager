import { CalendarDays } from 'lucide-react';
import type { DateFilter } from '@/lib/types';
import { Input, Select } from '@/components/ui/Input';

type Props = {
  value: DateFilter;
  onChange: (filter: DateFilter) => void;
};

export function DateRangeFilter({ value, onChange }: Props) {
  const updatePreset = (preset: DateFilter['preset']) => onChange({ ...value, preset });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-auto min-w-[120px]">
        <Select
          compact
          value={value.preset}
          onChange={(event) => updatePreset(event.target.value as DateFilter['preset'])}
          aria-label="Transaction date range"
        >
          <option value="month">This month</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="custom">Custom range</option>
        </Select>
      </div>
      {value.preset === 'custom' && (
        <div className="flex items-center gap-1.5 text-[10.5px] text-[#7f8c90]">
          <label className="relative flex items-center">
            <CalendarDays size={13} className="pointer-events-none absolute left-2.5 text-[#8d999d]" />
            <span className="sr-only">Start date</span>
            <Input
              compact
              type="date"
              value={value.startDate}
              onChange={(event) => onChange({ ...value, startDate: event.target.value })}
              className="w-[134px] pl-7"
            />
          </label>
          <span>to</span>
          <label className="relative flex items-center">
            <span className="sr-only">End date</span>
            <Input
              compact
              type="date"
              value={value.endDate}
              onChange={(event) => onChange({ ...value, endDate: event.target.value })}
              className="w-[122px]"
            />
          </label>
        </div>
      )}
    </div>
  );
}

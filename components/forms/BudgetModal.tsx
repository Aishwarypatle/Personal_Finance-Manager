import { useState } from 'react';
import type { FormEvent } from 'react';
import { categories } from '@/lib/categories';
import type { BudgetRule } from '@/lib/types';
import { ModalTitle } from '@/components/shared/ModalTitle';

type Props = {
  budgets: BudgetRule[];
  onSave: (budgets: BudgetRule[]) => void;
  onClose: () => void;
};

export function BudgetModal({ budgets, onSave, onClose }: Props) {
  const initialMap = Object.fromEntries(budgets.map((rule) => [rule.category, String(rule.limit)]));
  const [values, setValues] = useState<Record<string, string>>(initialMap);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextBudgets: BudgetRule[] = [];
    const orderedKeys = ['Overall', ...categories.map(([name]) => name)];
    for (const category of orderedKeys) {
      const numeric = Number(values[category]);
      if (Number.isFinite(numeric) && numeric > 0) {
        nextBudgets.push({ id: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'), category, limit: numeric });
      }
    }
    onSave(nextBudgets);
  };

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className="modal max-h-[88vh] overflow-y-auto" onSubmit={handleSubmit}>
        <ModalTitle title="Monthly budgets" onClose={onClose} />
        <p className="mb-3 text-[11px] text-[#8b979b]">
          Set monthly spending limits (leave blank or 0 to disable a limit).
        </p>

        <div className="grid gap-2.5">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-[#dcebe5] bg-[#f2f9f5] px-3 py-2 text-[11px] font-semibold text-[#25453b] dark:border-[#2c4a40] dark:bg-[#1f342d] dark:text-[#cde5dc]">
            <span>Overall monthly limit</span>
            <input
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 25000"
              value={values.Overall || ''}
              onChange={(event) => setValues((current) => ({ ...current, Overall: event.target.value }))}
              className="w-32 rounded-md border border-[#cfe0d9] bg-white px-2.5 py-1.5 text-right text-[11px] text-[#253138] outline-none focus:border-[#32a881] dark:border-[#344446] dark:bg-[#172224] dark:text-[#e3ebea]"
            />
          </label>

          {categories.map(([name, color]) => (
            <label
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg border border-[#edf0f2] px-3 py-2 text-[11px] text-[#455259] dark:border-[#2d3b3d] dark:text-[#cbd6d3]"
            >
              <span className="flex items-center gap-2">
                <i className="h-2.5 w-2.5 rounded-xs" style={{ background: color }} />
                {name}
              </span>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="No limit"
                value={values[name] || ''}
                onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                className="w-32 rounded-md border border-[#e6ebea] bg-white px-2.5 py-1.5 text-right text-[11px] text-[#253138] outline-none focus:border-[#32a881] dark:border-[#344446] dark:bg-[#172224] dark:text-[#e3ebea]"
              />
            </label>
          ))}
        </div>

        <button type="submit" className="primary submit-button mt-4">Save budgets</button>
      </form>
    </div>
  );
}

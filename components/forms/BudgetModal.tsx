import { useState } from 'react';
import type { FormEvent } from 'react';
import { categories } from '@/lib/categories';
import type { BudgetRule } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalHeader } from '@/components/ui/Modal';

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
    <Modal size="md" onClose={onClose} ariaLabel="Monthly budgets">
      <ModalHeader
        title="Monthly budgets"
        subtitle="Set spending limits (leave blank or 0 to disable)."
        onClose={onClose}
      />
      <form className="flex flex-col overflow-hidden" onSubmit={handleSubmit}>
        <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-[#d6ece2] bg-[#f2f9f5] px-3.5 py-2.5 text-[11.5px] font-medium text-[#25453b] dark:border-[#2c4a40] dark:bg-[#1f342d] dark:text-[#cde5dc]">
            <span>Overall monthly limit</span>
            <div className="w-32">
              <Input
                compact
                type="number"
                min="0"
                step="100"
                prefixText="₹"
                placeholder="25000"
                value={values.Overall || ''}
                onChange={(event) => setValues((current) => ({ ...current, Overall: event.target.value }))}
              />
            </div>
          </label>

          {categories.map(([name, color]) => (
            <label
              key={name}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#edf0f2] px-3.5 py-2 text-[11.5px] text-[#455259] dark:border-[#2d3b3d] dark:text-[#cbd6d3]"
            >
              <span className="flex items-center gap-2.5">
                <i className="h-2.5 w-2.5 rounded-xs" style={{ background: color }} />
                {name}
              </span>
              <div className="w-32">
                <Input
                  compact
                  type="number"
                  min="0"
                  step="50"
                  prefixText="₹"
                  placeholder="No limit"
                  value={values[name] || ''}
                  onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                />
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#eff3f2] px-5 py-3.5 dark:border-[#273537]">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save budgets</Button>
        </div>
      </form>
    </Modal>
  );
}

'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { computeCategoryBreakdown, computeMonthlyTrend } from '@/lib/financeHelpers';
import type { Transaction } from '@/lib/types';
import { Skeleton } from '@/components/shared/Skeleton';

type Props = {
  allTransactions: Transaction[];
  periodTransactions: Transaction[];
  isLoading?: boolean;
  onSelectCategory?: (category: string) => void;
};

export function SpendingCharts({ allTransactions, periodTransactions, isLoading = false, onSelectCategory }: Props) {
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const trend = computeMonthlyTrend(allTransactions);
  const breakdown = computeCategoryBreakdown(periodTransactions);
  const totalCategorySpend = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const maxTrendValue = Math.max(1, ...trend.map((month) => Math.max(month.spent, month.income)));

  const focusedMonth = trend.find((item) => item.key === activeMonth) ?? trend[trend.length - 1];
  const focusedCategory = breakdown.find((item) => item.name === activeCategory) ?? breakdown[0];

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  return (
    <div className="mt-4 grid grid-cols-[1.35fr_1fr] gap-3.5 max-[820px]:grid-cols-1">
      <section className="rounded-[10px] border border-[#edf0f2] bg-white p-[18px] shadow-[0_2px_9px_#1b303b05] dark:border-[#2b3a3c] dark:bg-[#1a2628] dark:shadow-none">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-[13px] font-bold text-[#253138] dark:text-[#e4ecea]">6-month cashflow</h2>
            <p className="mt-1 text-[10px] text-[#9aa3a7]">Hover or tap a month to inspect income vs. spending</p>
          </div>
          {!isLoading && focusedMonth && (
            <div className="rounded-lg bg-[#f7f9f8] px-2.5 py-1.5 text-right text-[10px] dark:bg-[#202e30]">
              <div className="font-semibold text-[#354248] dark:text-[#e3ebea]">{focusedMonth.label}</div>
              <div className="mt-0.5 flex items-center gap-2 text-[9px]">
                <span className="text-[#2fa77d]">+{formatCurrency(focusedMonth.income)}</span>
                <span className="text-[#9aa3a7]">·</span>
                <span className="text-[#cf7b63]">−{formatCurrency(focusedMonth.spent)}</span>
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="mt-5 flex h-[142px] items-end justify-around gap-3 border-b border-[#eff1f2] pb-3 dark:border-[#2b393b]" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="flex h-full flex-col items-center justify-end gap-2">
                <div className="flex items-end gap-1">
                  <Skeleton className="h-12 w-3 rounded-t" />
                  <Skeleton className="h-16 w-3 rounded-t" />
                </div>
                <Skeleton className="h-2.5 w-7" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 flex h-[138px] items-end justify-around gap-2 border-b border-[#eff1f2] pt-2 pb-1 dark:border-[#2b393b]">
              {trend.map((month) => {
                const incomeHeight = month.income > 0 ? Math.max(6, Math.round((month.income / maxTrendValue) * 102)) : 3;
                const spentHeight = month.spent > 0 ? Math.max(6, Math.round((month.spent / maxTrendValue) * 102)) : 3;
                const isSelected = focusedMonth?.key === month.key;

                return (
                  <button
                    key={month.key}
                    type="button"
                    onMouseEnter={() => setActiveMonth(month.key)}
                    onFocus={() => setActiveMonth(month.key)}
                    onClick={() => setActiveMonth(month.key)}
                    className={`group flex h-full flex-1 flex-col items-center justify-end gap-1.5 rounded-lg px-1 py-1 transition-colors ${
                      isSelected ? 'bg-[#f4f8f6] dark:bg-[#202e30]' : 'hover:bg-[#f8faf9] dark:hover:bg-[#1f2c2e]'
                    }`}
                  >
                    <div className="flex items-end gap-1">
                      <span
                        className="w-3 rounded-t bg-[#cbe9dc] transition-all dark:bg-[#2b5245]"
                        style={{ height: `${incomeHeight}px` }}
                      />
                      <span
                        className={`w-3 rounded-t transition-all ${
                          isSelected ? 'bg-[#32a881]' : 'bg-[#68bfa0] group-hover:bg-[#32a881]'
                        }`}
                        style={{ height: `${spentHeight}px` }}
                      />
                    </div>
                    <span className="text-[9px] font-medium text-[#8b969a]">{month.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[9px] text-[#738087] dark:text-[#9baaa7]">
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-xs bg-[#cbe9dc] dark:bg-[#2b5245]" /> Income</span>
              <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-xs bg-[#32a881]" /> Expenses</span>
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col rounded-[10px] border border-[#edf0f2] bg-white p-[18px] shadow-[0_2px_9px_#1b303b05] dark:border-[#2b3a3c] dark:bg-[#1a2628] dark:shadow-none">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display text-[13px] font-bold text-[#253138] dark:text-[#e4ecea]">Spending by category</h2>
            <p className="mt-1 text-[10px] text-[#9aa3a7]">Click a category to view matching transactions</p>
          </div>
          {!isLoading && focusedCategory && onSelectCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(focusedCategory.name)}
              className="inline-flex items-center gap-1 text-[10px] view-all !font-bold font-semibold text-[#299773] hover:underline"
            >
              Filter <ArrowRight size={12} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="my-auto flex items-center justify-around gap-4 py-4" aria-busy="true">
            <Skeleton className="h-[126px] w-[126px] rounded-full" />
            <div className="grid flex-1 gap-2.5">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-2">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-2.5 w-10" />
                </div>
              ))}
            </div>
          </div>
        ) : breakdown.length === 0 ? (
          <div className="my-auto py-10 text-center text-[11px] text-[#9da7aa]">No expenses in this period yet.</div>
        ) : (
          <div className="my-auto flex items-center justify-between gap-4 pt-3 max-[560px]:flex-col">
            <div className="relative h-[132px] w-[132px] shrink-0">
              <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90" role="img" aria-label="Spending by category chart">
                {breakdown.map((item) => {
                  const fraction = totalCategorySpend > 0 ? item.amount / totalCategorySpend : 0;
                  const dashLength = fraction * circumference;
                  const dashOffset = -offsetAccumulator;
                  offsetAccumulator += dashLength;
                  const isFocused = focusedCategory?.name === item.name;
                  return (
                    <circle
                      key={item.name}
                      cx="66"
                      cy="66"
                      r={radius}
                      fill="transparent"
                      stroke={item.color}
                      strokeWidth={isFocused ? 16 : 12}
                      strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                      strokeDashoffset={dashOffset}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setActiveCategory(item.name)}
                      onClick={() => onSelectCategory?.(item.name)}
                    />
                  );
                })}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                <strong className="font-display text-[13px] font-bold text-[#253138] dark:text-[#e3ebea]">
                  {formatCurrency(focusedCategory ? focusedCategory.amount : totalCategorySpend)}
                </strong>
                <small className="mt-0.5 truncate text-[8px] text-[#8f9a9e]">
                  {focusedCategory ? `${focusedCategory.name} · ${focusedCategory.percent}%` : 'Total spent'}
                </small>
              </div>
            </div>

            <div className="grid flex-1 gap-1.5 max-[560px]:w-full">
              {breakdown.slice(0, 5).map((item) => {
                const isFocused = focusedCategory?.name === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onMouseEnter={() => setActiveCategory(item.name)}
                    onClick={() => onSelectCategory?.(item.name)}
                    className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-[10px] transition-colors ${
                      isFocused ? 'bg-[#f2f7f4] dark:bg-[#202e30]' : 'hover:bg-[#f7f9f8] dark:hover:bg-[#202e30]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-[#647177] dark:text-[#b4c2be]">
                      <i className="h-2 w-2 shrink-0 rounded-xs" style={{ background: item.color }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <b className="shrink-0 font-semibold text-[#334046] dark:text-[#e0e9e6]">{item.percent}%</b>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

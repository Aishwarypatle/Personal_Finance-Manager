import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-[#eff3f2] text-[#606e72] dark:bg-[#243235] dark:text-[#a8b6b3]',
  success: 'bg-[#edf7f2] text-[#278c6a] dark:bg-[#1e3830] dark:text-[#6ed0a5]',
  warning: 'bg-[#fff8e6] text-[#a97214] dark:bg-[#3a301d] dark:text-[#f2c464]',
  danger: 'bg-[#fff0eb] text-[#c55a45] dark:bg-[#3c2724] dark:text-[#f0a092]',
  accent: 'bg-[#edf6f2] text-[#258562] dark:bg-[#203c35] dark:text-[#73d2a9]',
};

export function Badge({ tone = 'neutral', className = '', children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${toneClasses[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}

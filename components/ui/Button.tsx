import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#2fa77d] text-white shadow-[0_2px_8px_rgba(28,151,96,0.18)] hover:bg-[#27916c] active:bg-[#227f5f]',
  secondary:
    'border border-[#dce4e2] bg-[#f5f8f7] text-[#3d4d52] hover:bg-[#ebf1ef] dark:border-[#304042] dark:bg-[#202e30] dark:text-[#d5e0dd] dark:hover:bg-[#27383a]',
  outline:
    'border border-[#e2e8e6] bg-white text-[#4b5c60] hover:border-[#32a881]/70 hover:text-[#258562] dark:border-[#324244] dark:bg-[#192527] dark:text-[#c7d3d0] dark:hover:border-[#32a881]/70 dark:hover:text-[#73d2a9]',
  ghost:
    'bg-transparent text-[#768488] hover:bg-[#f2f6f5] hover:text-[#233036] dark:text-[#9aa9a6] dark:hover:bg-[#243235] dark:hover:text-[#e6eeec]',
  danger:
    'bg-[#c95540] text-white shadow-[0_2px_8px_rgba(201,85,64,0.18)] hover:bg-[#b54835]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 rounded-lg px-3 text-[11px] gap-1.5',
  md: 'h-9 rounded-[9px] px-4 text-[11.5px] gap-1.5',
  icon: 'h-8 w-8 rounded-lg p-0 justify-center',
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#32a881]/35 disabled:cursor-not-allowed disabled:opacity-55 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

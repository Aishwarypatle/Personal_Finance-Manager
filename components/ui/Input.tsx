import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export const controlSurfaceClass =
  'w-full rounded-[9px] border border-[#e3e9e7] bg-[#fafcfb] text-[#233036] placeholder:text-[#9aa5a9] outline-none transition-all duration-150 focus:border-[#32a881] focus:bg-white focus:ring-3 focus:ring-[#32a881]/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#324244] dark:bg-[#1a2628] dark:text-[#e6eeec] dark:placeholder:text-[#738386] dark:focus:border-[#32a881] dark:focus:bg-[#202e30]';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  prefixText?: string;
  compact?: boolean;
};

export function Input({ prefixText, compact = false, className = '', ...rest }: InputProps) {
  const heightClass = compact ? 'h-8 text-[11px]' : 'h-9 text-[12px]';
  if (prefixText) {
    return (
      <div className="relative w-full">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[12px] text-[#8d999d]">
          {prefixText}
        </span>
        <input
          className={`${controlSurfaceClass} ${heightClass} pr-3 pl-7 ${className}`.trim()}
          {...rest}
        />
      </div>
    );
  }
  return <input className={`${controlSurfaceClass} ${heightClass} px-3 ${className}`.trim()} {...rest} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className = '', ...rest }: TextareaProps) {
  return (
    <textarea
      className={`${controlSurfaceClass} min-h-[68px] resize-y px-3 py-2 text-[12px] ${className}`.trim()}
      {...rest}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  compact?: boolean;
  children: ReactNode;
};

export function Select({ compact = false, className = '', children, ...rest }: SelectProps) {
  const sizeClass = compact ? 'h-8 pl-2.5 pr-7 text-[10.5px]' : 'h-9 pl-3 pr-8 text-[12px]';
  return (
    <div className="relative inline-flex w-full items-center">
      <select
        className={`${controlSurfaceClass} ${sizeClass} cursor-pointer appearance-none font-medium ${className}`.trim()}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-2.5 text-[#7c8a8e] dark:text-[#96a6a2]"
        aria-hidden="true"
      />
    </div>
  );
}

type SearchInputProps = InputHTMLAttributes<HTMLInputElement>;

export function SearchInput({ className = '', ...rest }: SearchInputProps) {
  return (
    <label className="relative flex h-8 min-w-[160px] items-center">
      <Search size={14} className="pointer-events-none absolute left-2.5 text-[#98a4a8]" aria-hidden="true" />
      <input
        className={`${controlSurfaceClass} h-8 pr-3 pl-8 text-[11px] ${className}`.trim()}
        {...rest}
      />
    </label>
  );
}

type FieldLabelProps = {
  label: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
};

export function Field({ label, optional = false, children, className = '' }: FieldLabelProps) {
  return (
    <label className={`block text-[11px] font-medium text-[#667579] dark:text-[#9aa8a4] ${className}`.trim()}>
      <span>
        {label}
        {optional && <span className="ml-1 font-normal text-[#9aa4a8]">(optional)</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

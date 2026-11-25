import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  open?: boolean;
  size?: 'sm' | 'md' | 'lg';
  zIndexClass?: string;
  onClose: () => void;
  children: ReactNode;
  ariaLabel?: string;
};

const sizeMap = {
  sm: 'max-w-[400px]',
  md: 'max-w-[440px]',
  lg: 'max-w-[520px]',
};

export function Modal({
  size = 'md',
  zIndexClass = 'z-30',
  onClose,
  children,
  ariaLabel,
}: ModalProps) {
  return (
    <div
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-[#121e21]/50 p-4 backdrop-blur-[2px]`}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`flex max-h-[88vh] w-full ${sizeMap[size]} flex-col overflow-hidden rounded-2xl border border-[#e6ecea] bg-white shadow-[0_24px_60px_rgba(16,32,36,0.2)] dark:border-[#2a383a] dark:bg-[#192527]`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}

type ModalHeaderProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  actions?: ReactNode;
};

export function ModalHeader({ title, subtitle, onClose, actions }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#eff3f2] px-5 py-4 dark:border-[#273537]">
      <div className="min-w-0">
        <h2 className="truncate font-display text-[15.5px] font-semibold tracking-tight text-[#233036] dark:text-[#e6eeec]">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 truncate text-[11px] font-normal text-[#879397]">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-lg text-[#849195] transition-colors hover:bg-[#f4f7f6] hover:text-[#233036] dark:hover:bg-[#243235] dark:hover:text-[#e6eeec]"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

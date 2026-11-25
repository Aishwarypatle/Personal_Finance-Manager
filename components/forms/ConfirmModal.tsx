import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export type ConfirmDialogState = {
  title: string;
  description: string;
  details?: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
};

type Props = ConfirmDialogState & {
  onClose: () => void;
};

export function ConfirmModal({
  title,
  description,
  details,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onClose,
}: Props) {
  const isDanger = tone === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#121e21]/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-[400px] rounded-2xl border border-[#e6ecea] bg-white p-5 shadow-[0_24px_60px_rgba(16,32,36,0.22)] dark:border-[#2a383a] dark:bg-[#192527]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="mb-3.5 flex items-center justify-between gap-2">
          <h2 id="confirm-modal-title" className="font-display text-[15px] font-semibold tracking-tight text-[#233036] dark:text-[#e6eeec]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-[#849195] transition-colors hover:bg-[#f4f7f6] hover:text-[#233036] dark:hover:bg-[#243235] dark:hover:text-[#e6eeec]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              isDanger
                ? 'bg-[#fff0eb] text-[#c95540] dark:bg-[#3c2724] dark:text-[#f29b8b]'
                : 'bg-[#edf7f2] text-[#2fa77d] dark:bg-[#203c35] dark:text-[#73d2a9]'
            }`}
          >
            {isDanger ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
          </span>
          <div className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-[#647177] dark:text-[#b4c2be]">
            <p>{description}</p>
            {details && (
              <div className="mt-2.5 rounded-lg border border-[#edf0f2] bg-[#f8faf9] px-3 py-2 font-medium text-[#253138] dark:border-[#2d3b3d] dark:bg-[#202e30] dark:text-[#e3ebea]">
                {details}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border border-[#e5ebe8] bg-white px-3.5 text-[11px] font-medium text-[#5b696d] transition-colors hover:bg-[#f5f8f6] dark:border-[#344446] dark:bg-[#1b2729] dark:text-[#c7d3d0] dark:hover:bg-[#202e30]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`h-9 rounded-lg px-4 text-[11px] font-medium text-white transition-colors ${
              isDanger
                ? 'bg-[#c95540] hover:bg-[#b54835]'
                : 'bg-[#2fa77d] hover:bg-[#27916c]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

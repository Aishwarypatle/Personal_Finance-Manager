import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ModalTitle } from '@/components/shared/ModalTitle';

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
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal max-w-[400px]" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <ModalTitle title={title} onClose={onClose} />

        <div className="flex items-start gap-3">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              isDanger
                ? 'bg-[#fff0eb] text-[#c95540] dark:bg-[#3c2724] dark:text-[#f29b8b]'
                : 'bg-[#edf7f2] text-[#2fa77d] dark:bg-[#203c35] dark:text-[#73d2a9]'
            }`}
          >
            {isDanger ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          </span>
          <div className="text-[11px] leading-relaxed text-[#647177] dark:text-[#b4c2be]">
            <p id="confirm-modal-title">{description}</p>
            {details && (
              <div className="mt-2.5 rounded-lg border border-[#edf0f2] bg-[#f8faf9] px-3 py-2 font-semibold text-[#253138] dark:border-[#2d3b3d] dark:bg-[#202e30] dark:text-[#e3ebea]">
                {details}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5ebe8] bg-white px-3.5 py-2 text-[11px] font-semibold text-[#5b696d] hover:bg-[#f5f8f6] dark:border-[#344446] dark:bg-[#172224] dark:text-[#c7d3d0] dark:hover:bg-[#202e30]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-4 py-2 text-[11px] font-semibold text-white transition-colors ${
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

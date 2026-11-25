import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader } from '@/components/ui/Modal';

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
    <Modal size="sm" zIndexClass="z-50" onClose={onClose} ariaLabel={title}>
      <ModalHeader title={title} onClose={onClose} />
      <div className="px-5 py-4">
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

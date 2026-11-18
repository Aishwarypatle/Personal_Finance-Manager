import { X } from 'lucide-react';

type Props = { title: string; onClose: () => void };

export function ModalTitle({ title, onClose }: Props) {
  return (
    <div className="modal-head">
      <h2>{title}</h2>
      <button type="button" className="close-button" onClick={onClose} aria-label="Close">
        <X />
      </button>
    </div>
  );
}

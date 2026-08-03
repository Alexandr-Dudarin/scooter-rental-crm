import { useState } from "react";
import { Modal } from "./Modal";

type ConfirmModalProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm
}: ConfirmModalProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal title={title} subtitle={description} onClose={onClose} compact>
      <div className="modal-actions">
        <button className="secondary-button" type="button" onClick={onClose}>
          Отмена
        </button>
        <button
          className="danger-button"
          type="button"
          disabled={submitting}
          onClick={async () => {
            setSubmitting(true);
            await onConfirm();
            setSubmitting(false);
          }}
        >
          {submitting ? "Удаляем…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

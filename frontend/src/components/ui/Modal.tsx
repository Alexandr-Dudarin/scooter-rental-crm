import { X } from "lucide-react";
import { type ReactNode, useEffect, useId } from "react";

type ModalProps = {
  title: string;
  subtitle: string;
  onClose: () => void;
  compact?: boolean;
  children: ReactNode;
};

export function Modal({
  title,
  subtitle,
  onClose,
  compact = false,
  children
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={compact ? "modal modal--compact" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

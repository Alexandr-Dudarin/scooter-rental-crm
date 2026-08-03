import { type FormEvent, useState } from "react";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { Modal } from "../../components/ui/Modal";
import type { RentalInput, Scooter } from "../../types";

type RentalFormModalProps = {
  scooters: Scooter[];
  onClose: () => void;
  onSubmit: (input: RentalInput) => Promise<void>;
};

export function RentalFormModal({
  scooters,
  onClose,
  onSubmit
}: RentalFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RentalInput>({
    scooterId: scooters[0]?.id ?? "",
    userName: "",
    userPhone: ""
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title="Создать аренду"
      subtitle="Доступны только свободные и готовые к поездке самокаты."
      onClose={onClose}
    >
      <form className="form-grid form-grid--single" onSubmit={submit}>
        <div className="form-field">
          <span>Самокат</span>
          <CustomSelect
            value={form.scooterId}
            options={scooters.map((scooter) => ({
              value: scooter.id,
              label: `${scooter.number} · ${scooter.model}`,
              description: `Заряд ${scooter.batteryLevel}%`
            }))}
            onChange={(value) => setForm({ ...form, scooterId: value })}
            ariaLabel="Выберите самокат"
            layout="full"
            dropdownWidth="trigger"
          />
        </div>
        <label>
          <span>Имя пользователя</span>
          <input
            required
            maxLength={80}
            value={form.userName}
            onChange={(event) => setForm({ ...form, userName: event.target.value })}
            placeholder="Анна Смирнова"
          />
        </label>
        <label>
          <span>Телефон</span>
          <input
            required
            type="tel"
            maxLength={24}
            value={form.userPhone}
            onChange={(event) =>
              setForm({ ...form, userPhone: event.target.value })
            }
            placeholder="+7 999 123-45-67"
          />
        </label>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Создаём…" : "Начать аренду"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

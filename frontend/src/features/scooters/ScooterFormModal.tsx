import { type FormEvent, useState } from "react";
import type { ScooterFormDraft } from "../../app/types";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { Modal } from "../../components/ui/Modal";
import type { Scooter, ScooterInput } from "../../types";
import { scooterStatusOptions } from "./scooterConfig";

type ScooterFormModalProps = {
  scooter?: Scooter;
  onClose: () => void;
  onSubmit: (input: ScooterInput) => Promise<void>;
};

export function ScooterFormModal({
  scooter,
  onClose,
  onSubmit
}: ScooterFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ScooterFormDraft>({
    number: scooter?.number ?? "",
    model: scooter?.model ?? "",
    status:
      scooter?.status === "in_use" ? "available" : scooter?.status ?? "available",
    batteryLevel: String(scooter?.batteryLevel ?? 100),
    latitude: String(scooter?.latitude ?? 55.751244),
    longitude: String(scooter?.longitude ?? 37.618423)
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        batteryLevel: Number(form.batteryLevel),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude)
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={scooter ? "Редактировать самокат" : "Новый самокат"}
      subtitle="Заполните технические данные и текущее состояние."
      onClose={onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label>
          <span>Номер самоката</span>
          <input
            required
            minLength={2}
            maxLength={32}
            value={form.number}
            onChange={(event) => setForm({ ...form, number: event.target.value })}
            placeholder="S-1013"
          />
        </label>
        <label>
          <span>Модель</span>
          <input
            required
            maxLength={80}
            value={form.model}
            onChange={(event) => setForm({ ...form, model: event.target.value })}
            placeholder="Ninebot Max G30"
          />
        </label>
        <div className="form-field">
          <span>Статус</span>
          <CustomSelect
            value={scooter?.status === "in_use" ? "in_use" : form.status}
            disabled={scooter?.status === "in_use"}
            options={
              scooter?.status === "in_use"
                ? [
                    {
                      value: "in_use",
                      label: "В аренде",
                      description: "Изменится после завершения аренды"
                    },
                    ...scooterStatusOptions
                  ]
                : scooterStatusOptions
            }
            onChange={(value) =>
              setForm({ ...form, status: value as ScooterInput["status"] })
            }
            ariaLabel="Статус самоката"
            layout="form"
            dropdownWidth="trigger"
          />
          {scooter?.status === "in_use" && (
            <small>Статус изменится после завершения аренды.</small>
          )}
        </div>
        <label>
          <span>Уровень заряда, %</span>
          <input
            required
            type="number"
            min={0}
            max={100}
            value={form.batteryLevel}
            onChange={(event) =>
              setForm({ ...form, batteryLevel: event.target.value })
            }
          />
        </label>
        <label>
          <span>Широта</span>
          <input
            required
            type="number"
            min={-90}
            max={90}
            step="0.000001"
            value={form.latitude}
            onChange={(event) => setForm({ ...form, latitude: event.target.value })}
          />
        </label>
        <label>
          <span>Долгота</span>
          <input
            required
            type="number"
            min={-180}
            max={180}
            step="0.000001"
            value={form.longitude}
            onChange={(event) =>
              setForm({ ...form, longitude: event.target.value })
            }
          />
        </label>
        <div className="modal-actions form-grid__full">
          <button className="secondary-button" type="button" onClick={onClose}>
            Отмена
          </button>
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Сохраняем…" : scooter ? "Сохранить" : "Добавить"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

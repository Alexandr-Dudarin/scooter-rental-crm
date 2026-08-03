import { Pencil, Trash2 } from "lucide-react";
import { formatTime } from "../../shared/formatters";
import type { Scooter, ScooterStatus } from "../../types";
import { statusMeta } from "./scooterConfig";

type ScooterTableProps = {
  scooters: Scooter[];
  compact?: boolean;
  onEdit: (scooter: Scooter) => void;
  onDelete: (scooter: Scooter) => void;
};

export function ScooterTable({
  scooters,
  compact = false,
  onEdit,
  onDelete
}: ScooterTableProps) {
  return (
    <div className="table-scroll">
      <table className={compact ? "data-table data-table--compact" : "data-table"}>
        <thead>
          <tr>
            <th>Номер</th>
            <th>Модель</th>
            <th>Статус</th>
            <th>Заряд</th>
            {!compact && <th>Координаты</th>}
            <th>Обновлено</th>
            {!compact && <th aria-label="Действия" />}
          </tr>
        </thead>
        <tbody>
          {scooters.map((scooter) => (
            <tr key={scooter.id}>
              <td>
                <strong className="scooter-number">{scooter.number}</strong>
              </td>
              <td>{scooter.model}</td>
              <td>
                <StatusBadge status={scooter.status} />
              </td>
              <td>
                <Battery level={scooter.batteryLevel} />
              </td>
              {!compact && (
                <td className="coordinates">
                  {scooter.latitude.toFixed(4)}, {scooter.longitude.toFixed(4)}
                </td>
              )}
              <td>{formatTime(scooter.updatedAt)}</td>
              {!compact && (
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onEdit(scooter)}
                      aria-label={`Редактировать ${scooter.number}`}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      onClick={() => onDelete(scooter)}
                      aria-label={`Удалить ${scooter.number}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: ScooterStatus }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span />
      {statusMeta[status].shortLabel}
    </span>
  );
}

function Battery({ level }: { level: number }) {
  const tone = level < 20 ? "danger" : level < 45 ? "warning" : "good";
  return (
    <div className="battery">
      <span>{level}%</span>
      <span className="battery__track">
        <span
          className={`battery__fill battery__fill--${tone}`}
          style={{ width: `${level}%` }}
        />
      </span>
    </div>
  );
}

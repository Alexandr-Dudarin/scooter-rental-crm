import { CalendarClock } from "lucide-react";
import type { RentalTab } from "../../app/types";
import { EmptyState } from "../../components/ui/EmptyState";
import { durationLabel, formatDate } from "../../shared/formatters";
import type { Rental } from "../../types";

type RentalsSectionProps = {
  rentals: Rental[];
  tab: RentalTab;
  counts: Record<RentalTab, number>;
  onTab: (tab: RentalTab) => void;
  onComplete: (rental: Rental) => Promise<void>;
};

export function RentalsSection({
  rentals,
  tab,
  counts,
  onTab,
  onComplete
}: RentalsSectionProps) {
  return (
    <section className="card table-card">
      <div className="section-heading rentals-heading">
        <div>
          <p className="eyebrow">Журнал поездок</p>
          <h2>Управление арендами</h2>
        </div>
        <div className="tabs" role="tablist">
          <button
            className={tab === "active" ? "tab tab--active" : "tab"}
            type="button"
            onClick={() => onTab("active")}
          >
            Активные <span>{counts.active}</span>
          </button>
          <button
            className={tab === "completed" ? "tab tab--active" : "tab"}
            type="button"
            onClick={() => onTab("completed")}
          >
            Завершённые <span>{counts.completed}</span>
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table rentals-table">
          <thead>
            <tr>
              <th>Самокат</th>
              <th>Пользователь</th>
              <th>Телефон</th>
              <th>Начало</th>
              <th>{tab === "active" ? "Длительность" : "Окончание"}</th>
              <th>Статус</th>
              {tab === "active" && <th aria-label="Действие" />}
            </tr>
          </thead>
          <tbody>
            {rentals.map((rental) => (
              <tr key={rental.id}>
                <td>
                  <strong className="scooter-number">{rental.scooterNumber}</strong>
                  <small className="cell-subtitle">{rental.scooterModel}</small>
                </td>
                <td>{rental.userName}</td>
                <td>{rental.userPhone}</td>
                <td>{formatDate(rental.startedAt)}</td>
                <td>
                  {tab === "active"
                    ? durationLabel(rental)
                    : formatDate(rental.endedAt)}
                </td>
                <td>
                  <span
                    className={
                      rental.status === "active"
                        ? "rental-status rental-status--active"
                        : "rental-status"
                    }
                  >
                    {rental.status === "active" ? "Активна" : "Завершена"}
                  </span>
                </td>
                {tab === "active" && (
                  <td>
                    <button
                      className="secondary-button secondary-button--small"
                      type="button"
                      onClick={() => void onComplete(rental)}
                    >
                      Завершить
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rentals.length && (
        <EmptyState
          icon={<CalendarClock size={25} />}
          title={tab === "active" ? "Нет активных аренд" : "История пока пуста"}
          text={
            tab === "active"
              ? "Создайте новую аренду для доступного самоката."
              : "Завершённые аренды появятся здесь."
          }
        />
      )}
    </section>
  );
}

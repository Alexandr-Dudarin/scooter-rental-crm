import { Search } from "lucide-react";
import { CustomSelect } from "../../components/CustomSelect/CustomSelect";
import { EmptyState } from "../../components/ui/EmptyState";
import type { Scooter, ScooterStatus } from "../../types";
import { scooterStatusFilterOptions } from "./scooterConfig";
import { ScooterTable } from "./ScooterTable";

type ScootersSectionProps = {
  scooters: Scooter[];
  total: number;
  search: string;
  statusFilter: "all" | ScooterStatus;
  onSearch: (value: string) => void;
  onStatusFilter: (value: "all" | ScooterStatus) => void;
  onEdit: (scooter: Scooter) => void;
  onDelete: (scooter: Scooter) => void;
};

export function ScootersSection({
  scooters,
  total,
  search,
  statusFilter,
  onSearch,
  onStatusFilter,
  onEdit,
  onDelete
}: ScootersSectionProps) {
  return (
    <section className="card table-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Парк техники</p>
          <h2>
            Все самокаты <span className="count-badge">{total}</span>
          </h2>
        </div>
        <div className="filters">
          <label className="search-field">
            <Search size={18} />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Номер или модель"
              aria-label="Поиск самокатов"
            />
          </label>
          <CustomSelect
            value={statusFilter}
            options={scooterStatusFilterOptions}
            onChange={(value) => onStatusFilter(value as "all" | ScooterStatus)}
            ariaLabel="Фильтр по статусу"
            layout="filter"
            dropdownAlign="end"
            dropdownWidth="trigger"
          />
        </div>
      </div>
      <ScooterTable scooters={scooters} onEdit={onEdit} onDelete={onDelete} />
      {!scooters.length && (
        <EmptyState
          icon={<Search size={24} />}
          title="Самокаты не найдены"
          text="Измените запрос или выбранный статус."
        />
      )}
    </section>
  );
}

import { BatteryCharging, Bike, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import FleetMap from "../../FleetMap";
import type { BootstrapData, ScooterStatus } from "../../types";
import { ScooterTable } from "../scooters/ScooterTable";
import { statusMeta } from "../scooters/scooterConfig";

type OverviewProps = {
  data: BootstrapData;
  onShowScooters: () => void;
};

export function Overview({ data, onShowScooters }: OverviewProps) {
  const { analytics, scooters } = data;
  const statuses = Object.keys(statusMeta) as ScooterStatus[];

  return (
    <div className="page-stack">
      <section className="metric-grid" aria-label="Основные показатели">
        <MetricCard
          icon={<Bike size={26} />}
          value={analytics.totalScooters}
          label="Самокаты"
          tone="emerald"
        />
        <MetricCard
          icon={<Users size={25} />}
          value={analytics.activeRentals}
          label="Активные аренды"
          tone="teal"
        />
        <MetricCard
          icon={<BatteryCharging size={26} />}
          value={`${analytics.averageBattery}%`}
          label="Средний заряд"
          tone="emerald"
        />
      </section>

      <section className="card status-overview">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Состояние парка</p>
            <h2>Статусы самокатов</h2>
          </div>
          <span className="live-indicator">
            <span />
            Обновляется каждые 10 сек.
          </span>
        </div>
        <div className="status-grid">
          {statuses.map((status) => {
            const meta = statusMeta[status];
            const Icon = meta.icon;
            const count = analytics.statusCounts[status];
            const percentage = analytics.totalScooters
              ? Math.round((count / analytics.totalScooters) * 100)
              : 0;
            return (
              <div className="status-stat" key={status}>
                <span className={`status-stat__icon status-${status}`}>
                  <Icon size={20} />
                </span>
                <div>
                  <span>{meta.label}</span>
                  <strong>
                    {count} <small>{percentage}%</small>
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
        <div className="segmented-bar" aria-hidden="true">
          {statuses.map((status) => (
            <span
              className={`segment segment--${status}`}
              key={status}
              style={{
                width: `${
                  analytics.totalScooters
                    ? (analytics.statusCounts[status] / analytics.totalScooters) *
                      100
                    : 0
                }%`
              }}
            />
          ))}
        </div>
      </section>

      <section className="overview-grid">
        <div className="card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Последние обновления</p>
              <h2>Самокаты</h2>
            </div>
            <button className="text-button" type="button" onClick={onShowScooters}>
              Весь парк
            </button>
          </div>
          <ScooterTable
            scooters={scooters.slice(0, 5)}
            compact
            onEdit={() => undefined}
            onDelete={() => undefined}
          />
        </div>
        <div className="card map-card">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Геопозиция</p>
              <h2>Карта парка</h2>
            </div>
            <span className="map-count">
              <MapPin size={15} />
              {scooters.length}
            </span>
          </div>
          <FleetMap scooters={scooters} compact />
        </div>
      </section>
    </div>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone: "emerald" | "teal";
};

function MetricCard({ icon, value, label, tone }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className={`metric-card__icon metric-card__icon--${tone}`}>
        {icon}
      </span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

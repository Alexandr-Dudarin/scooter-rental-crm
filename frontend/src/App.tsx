"use client";

import {
  Activity,
  BatteryCharging,
  Bike,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  Gauge,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  Wrench,
  X,
  Zap
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { api, ApiError } from "./api";
import { filterScooters } from "./domain";
import FleetMap from "./FleetMap";
import type {
  Analytics,
  BootstrapData,
  Rental,
  RentalInput,
  Scooter,
  ScooterInput,
  ScooterStatus,
  SessionUser
} from "./types";

type Section = "overview" | "scooters" | "rentals";
type RentalTab = "active" | "completed";
type ToastState = { type: "success" | "error"; message: string } | null;
type ScooterFormDraft = Omit<
  ScooterInput,
  "batteryLevel" | "latitude" | "longitude"
> & {
  batteryLevel: string;
  latitude: string;
  longitude: string;
};

const sectionPaths: Record<Section, string> = {
  overview: "/overview",
  scooters: "/scooters",
  rentals: "/rentals"
};

function sectionFromPath(pathname: string): Section {
  const match = Object.entries(sectionPaths).find(
    ([, path]) => path === pathname
  );
  return (match?.[0] as Section | undefined) ?? "overview";
}

const emptyAnalytics: Analytics = {
  totalScooters: 0,
  activeRentals: 0,
  averageBattery: 0,
  statusCounts: {
    available: 0,
    in_use: 0,
    maintenance: 0,
    offline: 0
  }
};

const statusMeta: Record<
  ScooterStatus,
  { label: string; shortLabel: string; icon: typeof Check }
> = {
  available: { label: "Доступные", shortLabel: "Доступен", icon: Check },
  in_use: { label: "В аренде", shortLabel: "В аренде", icon: Users },
  maintenance: {
    label: "Обслуживание",
    shortLabel: "Обслуживание",
    icon: Wrench
  },
  offline: { label: "Офлайн", shortLabel: "Офлайн", icon: Zap }
};

const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  overview: {
    title: "Добрый день",
    subtitle: "Вот что происходит с вашим парком сегодня."
  },
  scooters: {
    title: "Самокаты",
    subtitle: "Управляйте техникой, зарядом и состоянием парка."
  },
  rentals: {
    title: "Аренды",
    subtitle: "Следите за активными поездками и историей аренд."
  }
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function durationLabel(rental: Rental) {
  const end = rental.endedAt ? new Date(rental.endedAt) : new Date();
  const minutes = Math.max(
    1,
    Math.round((end.getTime() - new Date(rental.startedAt).getTime()) / 60000)
  );
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function App() {
  const [section, setSection] = useState<Section>(() =>
    sectionFromPath(window.location.pathname)
  );
  const [data, setData] = useState<BootstrapData>({
    scooters: [],
    rentals: [],
    analytics: emptyAnalytics
  });
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scooterModal, setScooterModal] = useState<
    { mode: "create" } | { mode: "edit"; scooter: Scooter } | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<Scooter | null>(null);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ScooterStatus>("all");
  const [rentalTab, setRentalTab] = useState<RentalTab>("active");

  const showToast = useCallback((next: NonNullable<ToastState>) => {
    setToast(next);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const refreshData = useCallback(async (silent = false) => {
    const startedAt = window.performance.now();
    if (!silent) setRefreshing(true);
    try {
      const next = await api.bootstrap();
      setData(next);
      setError(null);
      return true;
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        setUser(null);
      } else if (!silent) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не удалось загрузить данные"
        );
      }
      return false;
    } finally {
      if (!silent) {
        const elapsed = window.performance.now() - startedAt;
        if (elapsed < 650) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, 650 - elapsed)
          );
        }
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const navigateToSection = useCallback((nextSection: Section) => {
    if (window.location.pathname !== sectionPaths[nextSection]) {
      window.history.pushState(null, "", sectionPaths[nextSection]);
    }
    setSection(nextSection);
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (window.location.pathname === "/") {
      window.history.replaceState(null, "", sectionPaths.overview);
    }
    const handlePopState = () =>
      setSection(sectionFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const session = await api.getSession();
        setUser(session.user);
        await refreshData();
      } catch (requestError) {
        if (!(requestError instanceof ApiError) || requestError.status !== 401) {
          setError("Не удалось проверить авторизацию");
        }
        setLoading(false);
      } finally {
        setAuthChecked(true);
      }
    }
    void load();
  }, [refreshData]);

  useEffect(() => {
    if (!user) return;
    const interval = window.setInterval(() => void refreshData(true), 10000);
    return () => window.clearInterval(interval);
  }, [refreshData, user]);

  const filteredScooters = useMemo(
    () =>
      [...filterScooters(data.scooters, search, statusFilter)].sort(
        (first, second) =>
          second.number.localeCompare(first.number, "ru", {
            numeric: true,
            sensitivity: "base"
          })
      ),
    [data.scooters, search, statusFilter]
  );

  const availableScooters = data.scooters.filter(
    (scooter) => scooter.status === "available"
  );
  const visibleRentals = data.rentals.filter(
    (rental) => rental.status === rentalTab
  );

  async function runMutation(
    mutation: () => Promise<unknown>,
    successMessage: string
  ) {
    try {
      await mutation();
      await refreshData(true);
      showToast({ type: "success", message: successMessage });
      return true;
    } catch (mutationError) {
      showToast({
        type: "error",
        message:
          mutationError instanceof Error
            ? mutationError.message
            : "Не удалось сохранить изменения"
      });
      return false;
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => undefined);
    setUser(null);
  }

  if (!authChecked || (loading && user)) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={async (email, password) => {
          const session = await api.login(email, password);
          setUser(session.user);
          setLoading(true);
          await refreshData();
        }}
      />
    );
  }

  const currentHeading = sectionTitles[section];
  const firstName = user.name.split(" ")[0] || "Александр";

  return (
    <div className="crm-shell">
      <aside className={mobileNavOpen ? "sidebar sidebar--open" : "sidebar"}>
        <div className="brand">
          <span className="brand__mark">
            <Bike size={28} strokeWidth={2.2} />
          </span>
          <span>SAMO CRM</span>
        </div>

        <nav className="sidebar__nav" aria-label="Основная навигация">
          <NavButton
            active={section === "overview"}
            icon={<LayoutDashboard size={20} />}
            label="Обзор"
            onClick={() => navigateToSection("overview")}
          />
          <NavButton
            active={section === "scooters"}
            icon={<Bike size={21} />}
            label="Самокаты"
            onClick={() => navigateToSection("scooters")}
          />
          <NavButton
            active={section === "rentals"}
            icon={<CalendarClock size={20} />}
            label="Аренды"
            onClick={() => navigateToSection("rentals")}
          />
        </nav>

        <div className="sidebar__footer">
          <div className="user-card">
            <span className="avatar">{getInitials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <span>Администратор</span>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={handleLogout}
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar__heading">
            <button
              className="menu-button"
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1>
                {currentHeading.title}
                {section === "overview" ? `, ${firstName}` : ""}
              </h1>
              <p>{currentHeading.subtitle}</p>
            </div>
          </div>

          <div className="topbar__actions">
            <button
              className="icon-button icon-button--bordered"
              type="button"
              disabled={refreshing}
              onClick={async () => {
                if (await refreshData()) {
                  showToast({
                    type: "success",
                    message: "Данные обновлены"
                  });
                }
              }}
              aria-label="Обновить данные"
              title="Обновить данные"
            >
              <RefreshCw
                className={refreshing ? "spin" : ""}
                size={19}
              />
            </button>
            {section !== "rentals" ? (
              <button
                className="primary-button"
                type="button"
                onClick={() => setScooterModal({ mode: "create" })}
              >
                <Plus size={20} />
                Добавить самокат
              </button>
            ) : (
              <button
                className="primary-button"
                type="button"
                disabled={!availableScooters.length}
                onClick={() => setRentalModalOpen(true)}
              >
                <Plus size={20} />
                Новая аренда
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <CircleAlert size={19} />
            <span>{error}</span>
            <button type="button" onClick={() => void refreshData()}>
              Повторить
            </button>
          </div>
        )}

        {section === "overview" && (
          <Overview
            data={data}
            onShowScooters={() => navigateToSection("scooters")}
          />
        )}

        {section === "scooters" && (
          <ScootersSection
            scooters={filteredScooters}
            total={data.scooters.length}
            search={search}
            statusFilter={statusFilter}
            onSearch={setSearch}
            onStatusFilter={setStatusFilter}
            onEdit={(scooter) => setScooterModal({ mode: "edit", scooter })}
            onDelete={setDeleteTarget}
          />
        )}

        {section === "rentals" && (
          <RentalsSection
            rentals={visibleRentals}
            tab={rentalTab}
            counts={{
              active: data.rentals.filter((item) => item.status === "active")
                .length,
              completed: data.rentals.filter(
                (item) => item.status === "completed"
              ).length
            }}
            onTab={setRentalTab}
            onComplete={async (rental) => {
              await runMutation(
                () => api.completeRental(rental.id),
                `Аренда ${rental.scooterNumber} завершена`
              );
            }}
          />
        )}
      </main>

      {scooterModal && (
        <ScooterFormModal
          scooter={
            scooterModal.mode === "edit" ? scooterModal.scooter : undefined
          }
          onClose={() => setScooterModal(null)}
          onSubmit={async (input) => {
            const success =
              scooterModal.mode === "create"
                ? await runMutation(
                    () => api.createScooter(input),
                    "Самокат добавлен"
                  )
                : await runMutation(
                    () => api.updateScooter(scooterModal.scooter.id, input),
                    "Данные самоката обновлены"
                  );
            if (success) setScooterModal(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Удалить самокат?"
          description={`${deleteTarget.number} исчезнет из активного списка. История завершённых аренд сохранится.`}
          confirmLabel="Удалить"
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            const success = await runMutation(
              () => api.deleteScooter(deleteTarget.id),
              "Самокат удалён"
            );
            if (success) setDeleteTarget(null);
          }}
        />
      )}

      {rentalModalOpen && (
        <RentalFormModal
          scooters={availableScooters}
          onClose={() => setRentalModalOpen(false)}
          onSubmit={async (input) => {
            const success = await runMutation(
              () => api.createRental(input),
              "Аренда создана"
            );
            if (success) setRentalModalOpen(false);
          }}
        />
      )}

      {toast && (
        <div className={`toast toast--${toast.type}`} role="status">
          {toast.type === "success" ? (
            <Check size={18} />
          ) : (
            <CircleAlert size={18} />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "nav-button nav-button--active" : "nav-button"}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Overview({
  data,
  onShowScooters
}: {
  data: BootstrapData;
  onShowScooters: () => void;
}) {
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
                    ? (analytics.statusCounts[status] /
                        analytics.totalScooters) *
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

function MetricCard({
  icon,
  value,
  label,
  tone
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  tone: "emerald" | "teal";
}) {
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

function ScootersSection({
  scooters,
  total,
  search,
  statusFilter,
  onSearch,
  onStatusFilter,
  onEdit,
  onDelete
}: {
  scooters: Scooter[];
  total: number;
  search: string;
  statusFilter: "all" | ScooterStatus;
  onSearch: (value: string) => void;
  onStatusFilter: (value: "all" | ScooterStatus) => void;
  onEdit: (scooter: Scooter) => void;
  onDelete: (scooter: Scooter) => void;
}) {
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
          <label className="select-field">
            <select
              value={statusFilter}
              onChange={(event) =>
                onStatusFilter(event.target.value as "all" | ScooterStatus)
              }
              aria-label="Фильтр по статусу"
            >
              <option value="all">Все статусы</option>
              <option value="available">Доступен</option>
              <option value="in_use">В аренде</option>
              <option value="maintenance">Обслуживание</option>
              <option value="offline">Офлайн</option>
            </select>
            <ChevronDown size={16} />
          </label>
        </div>
      </div>
      <ScooterTable
        scooters={scooters}
        onEdit={onEdit}
        onDelete={onDelete}
      />
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

function ScooterTable({
  scooters,
  compact = false,
  onEdit,
  onDelete
}: {
  scooters: Scooter[];
  compact?: boolean;
  onEdit: (scooter: Scooter) => void;
  onDelete: (scooter: Scooter) => void;
}) {
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

function RentalsSection({
  rentals,
  tab,
  counts,
  onTab,
  onComplete
}: {
  rentals: Rental[];
  tab: RentalTab;
  counts: Record<RentalTab, number>;
  onTab: (tab: RentalTab) => void;
  onComplete: (rental: Rental) => Promise<void>;
}) {
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
                  <strong className="scooter-number">
                    {rental.scooterNumber}
                  </strong>
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
          title={
            tab === "active" ? "Нет активных аренд" : "История пока пуста"
          }
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

function ScooterFormModal({
  scooter,
  onClose,
  onSubmit
}: {
  scooter?: Scooter;
  onClose: () => void;
  onSubmit: (input: ScooterInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ScooterFormDraft>({
    number: scooter?.number ?? "",
    model: scooter?.model ?? "",
    status:
      scooter?.status === "in_use"
        ? "available"
        : scooter?.status ?? "available",
    batteryLevel: String(scooter?.batteryLevel ?? 100),
    latitude: String(scooter?.latitude ?? 55.751244),
    longitude: String(scooter?.longitude ?? 37.618423)
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit({
      ...form,
      batteryLevel: Number(form.batteryLevel),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude)
    });
    setSubmitting(false);
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
            onChange={(event) =>
              setForm({ ...form, number: event.target.value })
            }
            placeholder="S-1013"
          />
        </label>
        <label>
          <span>Модель</span>
          <input
            required
            maxLength={80}
            value={form.model}
            onChange={(event) =>
              setForm({ ...form, model: event.target.value })
            }
            placeholder="Ninebot Max G30"
          />
        </label>
        <label>
          <span>Статус</span>
          <select
            value={scooter?.status === "in_use" ? "in_use" : form.status}
            disabled={scooter?.status === "in_use"}
            onChange={(event) =>
              setForm({
                ...form,
                status: event.target.value as ScooterInput["status"]
              })
            }
          >
            {scooter?.status === "in_use" && (
              <option value="in_use">В аренде</option>
            )}
            <option value="available">Доступен</option>
            <option value="maintenance">Обслуживание</option>
            <option value="offline">Офлайн</option>
          </select>
          {scooter?.status === "in_use" && (
            <small>Статус изменится после завершения аренды.</small>
          )}
        </label>
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
            onChange={(event) =>
              setForm({ ...form, latitude: event.target.value })
            }
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

function RentalFormModal({
  scooters,
  onClose,
  onSubmit
}: {
  scooters: Scooter[];
  onClose: () => void;
  onSubmit: (input: RentalInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<RentalInput>({
    scooterId: scooters[0]?.id ?? "",
    userName: "",
    userPhone: ""
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  return (
    <Modal
      title="Создать аренду"
      subtitle="Доступны только свободные и готовые к поездке самокаты."
      onClose={onClose}
    >
      <form className="form-grid form-grid--single" onSubmit={submit}>
        <label>
          <span>Самокат</span>
          <select
            required
            value={form.scooterId}
            onChange={(event) =>
              setForm({ ...form, scooterId: event.target.value })
            }
          >
            {scooters.map((scooter) => (
              <option value={scooter.id} key={scooter.id}>
                {scooter.number} · {scooter.model} · {scooter.batteryLevel}%
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Имя пользователя</span>
          <input
            required
            maxLength={80}
            value={form.userName}
            onChange={(event) =>
              setForm({ ...form, userName: event.target.value })
            }
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

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
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

function Modal({
  title,
  subtitle,
  onClose,
  compact = false,
  children
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  compact?: boolean;
  children: ReactNode;
}) {
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
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal__header">
          <div>
            <h2 id="modal-title">{title}</h2>
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

function LoginScreen({
  onLogin
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("admin@samo.local");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Не удалось войти в систему"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="brand brand--login">
          <span className="brand__mark">
            <Bike size={29} strokeWidth={2.2} />
          </span>
          <span>SAMO CRM</span>
        </div>
        <div className="login-copy">
          <p className="eyebrow">Внутренняя система</p>
          <h1>Управляйте парком в одном окне</h1>
          <p>
            Самокаты, аренды, заряд и координаты — актуальная картина без лишних
            переключений.
          </p>
        </div>
        <div className="login-feature-grid">
          <span>
            <Activity size={18} /> Живые статусы
          </span>
          <span>
            <MapPin size={18} /> Геопозиция
          </span>
          <span>
            <Gauge size={18} /> Аналитика
          </span>
        </div>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">Добро пожаловать</p>
            <h2>Вход в CRM</h2>
            <p>Используйте демонстрационную учётную запись.</p>
          </div>
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button primary-button--wide" type="submit">
            {submitting ? "Входим…" : "Войти"}
          </button>
          <p className="demo-hint">
            Демо: admin@samo.local / admin123
          </p>
        </form>
      </section>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <span className="loading-logo">
        <Bike size={30} />
      </span>
      <strong>SAMO CRM</strong>
      <span className="loading-line" />
    </main>
  );
}

function EmptyState({
  icon,
  title,
  text
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="empty-state">
      <span>{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

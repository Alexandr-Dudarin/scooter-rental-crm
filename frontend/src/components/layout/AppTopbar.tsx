import { Menu, Plus, RefreshCw } from "lucide-react";
import type { Section } from "../../app/navigation";

type AppTopbarProps = {
  section: Section;
  title: string;
  subtitle: string;
  firstName: string;
  refreshing: boolean;
  canCreateRental: boolean;
  onOpenMenu: () => void;
  onRefresh: () => void;
  onCreateScooter: () => void;
  onCreateRental: () => void;
};

export function AppTopbar({
  section,
  title,
  subtitle,
  firstName,
  refreshing,
  canCreateRental,
  onOpenMenu,
  onRefresh,
  onCreateScooter,
  onCreateRental
}: AppTopbarProps) {
  return (
    <header className="topbar">
      <div className="topbar__heading">
        <button
          className="menu-button"
          type="button"
          onClick={onOpenMenu}
          aria-label="Открыть меню"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1>
            {title}
            {section === "overview" ? `, ${firstName}` : ""}
          </h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar__actions">
        <button
          className="icon-button icon-button--bordered"
          type="button"
          disabled={refreshing}
          onClick={onRefresh}
          aria-label="Обновить данные"
          title="Обновить данные"
        >
          <RefreshCw className={refreshing ? "spin" : ""} size={19} />
        </button>
        {section !== "rentals" ? (
          <button
            className="primary-button"
            type="button"
            onClick={onCreateScooter}
          >
            <Plus size={20} />
            Добавить самокат
          </button>
        ) : (
          <button
            className="primary-button"
            type="button"
            disabled={!canCreateRental}
            onClick={onCreateRental}
          >
            <Plus size={20} />
            Новая аренда
          </button>
        )}
      </div>
    </header>
  );
}

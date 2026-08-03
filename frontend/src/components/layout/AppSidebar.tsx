import {
  Bike,
  CalendarClock,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import type { ReactNode } from "react";
import type { Section } from "../../app/navigation";
import { getInitials } from "../../shared/formatters";
import type { SessionUser } from "../../types";

type AppSidebarProps = {
  section: Section;
  user: SessionUser;
  open: boolean;
  onNavigate: (section: Section) => void;
  onClose: () => void;
  onLogout: () => void;
};

export function AppSidebar({
  section,
  user,
  open,
  onNavigate,
  onClose,
  onLogout
}: AppSidebarProps) {
  return (
    <>
      <aside className={open ? "sidebar sidebar--open" : "sidebar"}>
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
            onClick={() => onNavigate("overview")}
          />
          <NavButton
            active={section === "scooters"}
            icon={<Bike size={21} />}
            label="Самокаты"
            onClick={() => onNavigate("scooters")}
          />
          <NavButton
            active={section === "rentals"}
            icon={<CalendarClock size={20} />}
            label="Аренды"
            onClick={() => onNavigate("rentals")}
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
              onClick={onLogout}
              aria-label="Выйти"
              title="Выйти"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="sidebar-backdrop"
          type="button"
          aria-label="Закрыть меню"
          onClick={onClose}
        />
      )}
    </>
  );
}

type NavButtonProps = {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

function NavButton({ active, icon, label, onClick }: NavButtonProps) {
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

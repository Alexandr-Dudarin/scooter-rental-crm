"use client";

import { Check, CircleAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "./api";
import { emptyAnalytics } from "./app/constants";
import {
  sectionFromPath,
  sectionPaths,
  sectionTitles,
  type Section
} from "./app/navigation";
import type {
  RentalTab,
  ScooterModalState,
  ToastState
} from "./app/types";
import { AppSidebar } from "./components/layout/AppSidebar";
import { AppTopbar } from "./components/layout/AppTopbar";
import { ConfirmModal } from "./components/ui/ConfirmModal";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { LoginScreen } from "./features/auth/LoginScreen";
import { Overview } from "./features/overview/Overview";
import { RentalFormModal } from "./features/rentals/RentalFormModal";
import { RentalsSection } from "./features/rentals/RentalsSection";
import { ScooterFormModal } from "./features/scooters/ScooterFormModal";
import { ScootersSection } from "./features/scooters/ScootersSection";
import { filterScooters } from "./domain";
import type {
  BootstrapData,
  Scooter,
  ScooterStatus,
  SessionUser
} from "./types";

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
  const [scooterModal, setScooterModal] = useState<ScooterModalState>(null);
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

  const availableScooters = useMemo(
    () => data.scooters.filter((scooter) => scooter.status === "available"),
    [data.scooters]
  );

  const visibleRentals = useMemo(
    () => data.rentals.filter((rental) => rental.status === rentalTab),
    [data.rentals, rentalTab]
  );

  const rentalCounts = useMemo(
    () => ({
      active: data.rentals.filter((rental) => rental.status === "active").length,
      completed: data.rentals.filter((rental) => rental.status === "completed")
        .length
    }),
    [data.rentals]
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

  async function handleRefresh() {
    if (await refreshData()) {
      showToast({ type: "success", message: "Данные обновлены" });
    }
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
      <AppSidebar
        section={section}
        user={user}
        open={mobileNavOpen}
        onNavigate={navigateToSection}
        onClose={() => setMobileNavOpen(false)}
        onLogout={() => void handleLogout()}
      />

      <main className="main-content">
        <AppTopbar
          section={section}
          title={currentHeading.title}
          subtitle={currentHeading.subtitle}
          firstName={firstName}
          refreshing={refreshing}
          canCreateRental={availableScooters.length > 0}
          onOpenMenu={() => setMobileNavOpen(true)}
          onRefresh={() => void handleRefresh()}
          onCreateScooter={() => setScooterModal({ mode: "create" })}
          onCreateRental={() => setRentalModalOpen(true)}
        />

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
            counts={rentalCounts}
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

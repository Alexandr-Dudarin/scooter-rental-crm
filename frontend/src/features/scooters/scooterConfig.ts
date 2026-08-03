import { Check, Users, Wrench, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CustomSelectOption } from "../../components/CustomSelect/CustomSelect";
import type { ScooterStatus } from "../../types";

export const statusMeta: Record<
  ScooterStatus,
  { label: string; shortLabel: string; icon: LucideIcon }
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

export const scooterStatusOptions: CustomSelectOption[] = [
  {
    value: "available",
    label: "Доступен",
    description: "Готов к новой аренде"
  },
  {
    value: "maintenance",
    label: "Обслуживание",
    description: "На диагностике или ремонте"
  },
  {
    value: "offline",
    label: "Офлайн",
    description: "Временно недоступен"
  }
];

export const scooterStatusFilterOptions: CustomSelectOption[] = [
  { value: "all", label: "Все статусы" },
  { value: "available", label: "Доступен" },
  { value: "in_use", label: "В аренде" },
  { value: "maintenance", label: "Обслуживание" },
  { value: "offline", label: "Офлайн" }
];

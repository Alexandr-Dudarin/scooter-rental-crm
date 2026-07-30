export const SCOOTER_STATUSES = [
  "available",
  "in_use",
  "maintenance",
  "offline"
] as const;

export type ScooterStatus = (typeof SCOOTER_STATUSES)[number];
export type RentalStatus = "active" | "completed";

export interface Scooter {
  id: string;
  number: string;
  model: string;
  status: ScooterStatus;
  batteryLevel: number;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface Rental {
  id: string;
  scooterId: string;
  scooterNumber: string;
  scooterModel: string;
  userName: string;
  userPhone: string;
  startedAt: string;
  endedAt: string | null;
  status: RentalStatus;
}

export interface Analytics {
  totalScooters: number;
  activeRentals: number;
  averageBattery: number;
  statusCounts: Record<ScooterStatus, number>;
}

export interface BootstrapData {
  scooters: Scooter[];
  rentals: Rental[];
  analytics: Analytics;
}

export interface ScooterInput {
  number: string;
  model: string;
  status: Exclude<ScooterStatus, "in_use">;
  batteryLevel: number;
  latitude: number;
  longitude: number;
}

export interface RentalInput {
  scooterId: string;
  userName: string;
  userPhone: string;
}

export interface SessionUser {
  name: string;
  email?: string;
}

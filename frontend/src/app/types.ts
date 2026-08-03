import type { Scooter, ScooterInput } from "../types";

export type RentalTab = "active" | "completed";
export type ToastState = { type: "success" | "error"; message: string } | null;
export type ScooterModalState =
  | { mode: "create" }
  | { mode: "edit"; scooter: Scooter }
  | null;

export type ScooterFormDraft = Omit<
  ScooterInput,
  "batteryLevel" | "latitude" | "longitude"
> & {
  batteryLevel: string;
  latitude: string;
  longitude: string;
};

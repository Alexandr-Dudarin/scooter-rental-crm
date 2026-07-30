import type { Scooter, ScooterStatus } from "./types";

export function filterScooters(
  scooters: Scooter[],
  search: string,
  status: "all" | ScooterStatus
) {
  const normalized = search.trim().toLowerCase();
  return scooters.filter((scooter) => {
    const matchesSearch =
      !normalized ||
      scooter.number.toLowerCase().includes(normalized) ||
      scooter.model.toLowerCase().includes(normalized);
    const matchesStatus = status === "all" || scooter.status === status;
    return matchesSearch && matchesStatus;
  });
}

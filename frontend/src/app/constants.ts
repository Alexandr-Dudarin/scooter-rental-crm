import type { Analytics } from "../types";

export const emptyAnalytics: Analytics = {
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

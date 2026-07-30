import { describe, expect, it } from "vitest";
import { filterScooters } from "./domain";
import type { Scooter } from "./types";

const scooters: Scooter[] = [
  {
    id: "1",
    number: "S-1001",
    model: "Ninebot Max G30",
    status: "available",
    batteryLevel: 80,
    latitude: 55.75,
    longitude: 37.61,
    updatedAt: "2026-07-30T12:00:00.000Z"
  },
  {
    id: "2",
    number: "S-1002",
    model: "Xiaomi Electric 4",
    status: "maintenance",
    batteryLevel: 30,
    latitude: 55.76,
    longitude: 37.62,
    updatedAt: "2026-07-30T12:00:00.000Z"
  }
];

describe("filterScooters", () => {
  it("searches by number and model", () => {
    expect(filterScooters(scooters, "1001", "all")).toHaveLength(1);
    expect(filterScooters(scooters, "xiaomi", "all")[0]?.id).toBe("2");
  });

  it("filters by status", () => {
    expect(filterScooters(scooters, "", "maintenance")).toEqual([scooters[1]]);
  });

  it("combines search and status", () => {
    expect(filterScooters(scooters, "Ninebot", "maintenance")).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  assertRentalCanBeCompleted,
  assertScooterCanBeRented,
  rentalInputSchema,
  scooterInputSchema
} from "./domain.js";

describe("scooter validation", () => {
  it("accepts a valid scooter", () => {
    const result = scooterInputSchema.safeParse({
      number: "S-1001",
      model: "Ninebot Max G30",
      status: "available",
      batteryLevel: 82,
      latitude: 55.7512,
      longitude: 37.6184
    });
    expect(result.success).toBe(true);
  });

  it("rejects a battery outside 0–100", () => {
    const result = scooterInputSchema.safeParse({
      number: "S-1001",
      model: "Ninebot Max G30",
      status: "available",
      batteryLevel: 120,
      latitude: 55.7512,
      longitude: 37.6184
    });
    expect(result.success).toBe(false);
  });
});

describe("rental business rules", () => {
  it("allows only available scooters", () => {
    expect(() => assertScooterCanBeRented("available")).not.toThrow();
    expect(() => assertScooterCanBeRented("maintenance")).toThrow(
      "Самокат уже занят или временно недоступен"
    );
    expect(() => assertScooterCanBeRented("in_use")).toThrow();
  });

  it("allows completion only for active rentals", () => {
    expect(() => assertRentalCanBeCompleted("active")).not.toThrow();
    expect(() => assertRentalCanBeCompleted("completed")).toThrow(
      "Аренда уже завершена"
    );
  });

  it("validates user and phone", () => {
    expect(
      rentalInputSchema.safeParse({
        scooterId: "d7d0321f-cf73-4c99-9cd6-b58f31160c32",
        userName: "Анна Смирнова",
        userPhone: "+7 999 123-45-67"
      }).success
    ).toBe(true);
  });
});

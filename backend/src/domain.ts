import { z } from "zod";
import { AppError } from "./errors.js";

export const scooterStatuses = [
  "available",
  "in_use",
  "maintenance",
  "offline"
] as const;

export type ScooterStatus = (typeof scooterStatuses)[number];

export const scooterInputSchema = z.object({
  number: z
    .string()
    .trim()
    .min(2, "Укажите номер")
    .max(32, "Номер слишком длинный"),
  model: z
    .string()
    .trim()
    .min(2, "Укажите модель")
    .max(80, "Название модели слишком длинное"),
  status: z.enum(["available", "maintenance", "offline"]),
  batteryLevel: z.coerce
    .number()
    .int()
    .min(0, "Минимальный заряд — 0%")
    .max(100, "Максимальный заряд — 100%"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180)
});

export const rentalInputSchema = z.object({
  scooterId: z.string().uuid("Некорректный ID самоката"),
  userName: z
    .string()
    .trim()
    .min(2, "Укажите имя пользователя")
    .max(80),
  userPhone: z
    .string()
    .trim()
    .min(7, "Укажите телефон")
    .max(24)
    .regex(/^[+\d\s()-]+$/, "Некорректный формат телефона")
});

export const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль")
});

export function assertScooterCanBeRented(status: ScooterStatus) {
  if (status !== "available") {
    throw new AppError(
      409,
      "Самокат уже занят или временно недоступен",
      "SCOOTER_NOT_AVAILABLE"
    );
  }
}

export function assertRentalCanBeCompleted(status: string) {
  if (status !== "active") {
    throw new AppError(
      409,
      "Аренда уже завершена",
      "RENTAL_ALREADY_COMPLETED"
    );
  }
}

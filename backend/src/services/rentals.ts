import type pg from "pg";
import {
  assertRentalCanBeCompleted,
  assertScooterCanBeRented,
  type ScooterStatus
} from "../domain.js";
import { AppError } from "../errors.js";

export async function startRental(
  client: pg.PoolClient,
  input: { scooterId: string; userName: string; userPhone: string }
) {
  const scooterResult = await client.query<{
    id: string;
    status: ScooterStatus;
  }>(
    `SELECT id, status
     FROM scooters
     WHERE id = $1 AND deleted_at IS NULL
     FOR UPDATE`,
    [input.scooterId]
  );
  const scooter = scooterResult.rows[0];
  if (!scooter) {
    throw new AppError(404, "Самокат не найден", "SCOOTER_NOT_FOUND");
  }

  assertScooterCanBeRented(scooter.status);

  const rentalResult = await client.query(
    `INSERT INTO rentals (scooter_id, user_name, user_phone, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING *`,
    [input.scooterId, input.userName, input.userPhone]
  );

  await client.query(
    `UPDATE scooters
     SET status = 'in_use', updated_at = NOW()
     WHERE id = $1`,
    [input.scooterId]
  );

  return rentalResult.rows[0];
}

export async function completeRental(
  client: pg.PoolClient,
  rentalId: string
) {
  const rentalResult = await client.query<{
    id: string;
    scooter_id: string;
    status: string;
  }>(
    `SELECT id, scooter_id, status
     FROM rentals
     WHERE id = $1
     FOR UPDATE`,
    [rentalId]
  );
  const rental = rentalResult.rows[0];
  if (!rental) {
    throw new AppError(404, "Аренда не найдена", "RENTAL_NOT_FOUND");
  }

  assertRentalCanBeCompleted(rental.status);

  await client.query(
    `UPDATE rentals
     SET status = 'completed', ended_at = NOW()
     WHERE id = $1`,
    [rental.id]
  );
  await client.query(
    `UPDATE scooters
     SET status = 'available', updated_at = NOW()
     WHERE id = $1`,
    [rental.scooter_id]
  );
}

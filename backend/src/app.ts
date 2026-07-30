import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response
} from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import {
  clearAuthCookie,
  createToken,
  type AuthenticatedRequest,
  requireAuth,
  setAuthCookie
} from "./auth.js";
import { config } from "./config.js";
import { pool, withTransaction } from "./db.js";
import {
  loginSchema,
  rentalInputSchema,
  scooterInputSchema
} from "./domain.js";
import { AppError, isPostgresUniqueViolation } from "./errors.js";
import { serializeRental, serializeScooter } from "./serializers.js";
import {
  completeRental,
  startRental
} from "./services/rentals.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true
  })
);
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());

app.get("/api/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/login", async (request, response, next) => {
  try {
    const input = loginSchema.parse(request.body);
    const result = await pool.query<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
    }>(
      `SELECT id, email, name, password_hash
       FROM admins
       WHERE email = $1`,
      [input.email.toLowerCase()]
    );
    const admin = result.rows[0];
    if (!admin || !(await bcrypt.compare(input.password, admin.password_hash))) {
      throw new AppError(
        401,
        "Неверный email или пароль",
        "INVALID_CREDENTIALS"
      );
    }

    const user = { id: admin.id, email: admin.email, name: admin.name };
    setAuthCookie(response, createToken(user));
    response.json({ user: { email: user.email, name: user.name } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/logout", (_request, response) => {
  clearAuthCookie(response);
  response.json({ ok: true });
});

app.get("/api/auth/me", requireAuth, (request, response) => {
  const user = (request as AuthenticatedRequest).user;
  response.json({
    user: {
      name: user.name,
      email: user.email
    }
  });
});

app.use("/api", requireAuth);

app.get("/api/bootstrap", async (_request, response, next) => {
  try {
    const [scootersResult, rentalsResult, statusResult, activeResult] =
      await Promise.all([
        pool.query(
          `SELECT id, number, model, status, battery_level, latitude, longitude, updated_at
           FROM scooters
           WHERE deleted_at IS NULL
           ORDER BY updated_at DESC, number ASC`
        ),
        pool.query(
          `SELECT r.id, r.scooter_id, s.number AS scooter_number,
                  s.model AS scooter_model, r.user_name, r.user_phone,
                  r.started_at, r.ended_at, r.status
           FROM rentals r
           JOIN scooters s ON s.id = r.scooter_id
           ORDER BY r.started_at DESC`
        ),
        pool.query<{ status: string; count: string }>(
          `SELECT status, COUNT(*)::text AS count
           FROM scooters
           WHERE deleted_at IS NULL
           GROUP BY status`
        ),
        pool.query<{ count: string; average_battery: string | null }>(
          `SELECT
             (SELECT COUNT(*) FROM rentals WHERE status = 'active')::text AS count,
             AVG(battery_level)::text AS average_battery
           FROM scooters
           WHERE deleted_at IS NULL`
        )
      ]);

    const statusCounts = {
      available: 0,
      in_use: 0,
      maintenance: 0,
      offline: 0
    };
    statusResult.rows.forEach((row) => {
      if (row.status in statusCounts) {
        statusCounts[row.status as keyof typeof statusCounts] = Number(row.count);
      }
    });
    const aggregate = activeResult.rows[0];

    response.json({
      scooters: scootersResult.rows.map(serializeScooter),
      rentals: rentalsResult.rows.map(serializeRental),
      analytics: {
        totalScooters: scootersResult.rowCount ?? 0,
        activeRentals: Number(aggregate?.count ?? 0),
        averageBattery: Math.round(Number(aggregate?.average_battery ?? 0)),
        statusCounts
      }
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/scooters", async (request, response, next) => {
  try {
    const search = String(request.query.search ?? "").trim();
    const status = String(request.query.status ?? "").trim();
    const values: string[] = [];
    const conditions = ["deleted_at IS NULL"];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(number ILIKE $${values.length} OR model ILIKE $${values.length})`
      );
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    const result = await pool.query(
      `SELECT id, number, model, status, battery_level, latitude, longitude, updated_at
       FROM scooters
       WHERE ${conditions.join(" AND ")}
       ORDER BY updated_at DESC`,
      values
    );
    response.json({ scooters: result.rows.map(serializeScooter) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/scooters", async (request, response, next) => {
  try {
    const input = scooterInputSchema.parse(request.body);
    const result = await pool.query(
      `INSERT INTO scooters
        (number, model, status, battery_level, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, number, model, status, battery_level, latitude, longitude, updated_at`,
      [
        input.number,
        input.model,
        input.status,
        input.batteryLevel,
        input.latitude,
        input.longitude
      ]
    );
    response.status(201).json({ scooter: serializeScooter(result.rows[0]) });
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      next(new AppError(409, "Самокат с таким номером уже существует"));
      return;
    }
    next(error);
  }
});

app.patch("/api/scooters/:id", async (request, response, next) => {
  try {
    const input = scooterInputSchema.parse(request.body);
    const current = await pool.query<{ status: string }>(
      `SELECT status FROM scooters WHERE id = $1 AND deleted_at IS NULL`,
      [request.params.id]
    );
    if (!current.rows[0]) {
      throw new AppError(404, "Самокат не найден", "SCOOTER_NOT_FOUND");
    }
    const nextStatus =
      current.rows[0].status === "in_use" ? "in_use" : input.status;
    const result = await pool.query(
      `UPDATE scooters
       SET number = $2, model = $3, status = $4, battery_level = $5,
           latitude = $6, longitude = $7, updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, number, model, status, battery_level, latitude, longitude, updated_at`,
      [
        request.params.id,
        input.number,
        input.model,
        nextStatus,
        input.batteryLevel,
        input.latitude,
        input.longitude
      ]
    );
    response.json({ scooter: serializeScooter(result.rows[0]) });
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      next(new AppError(409, "Самокат с таким номером уже существует"));
      return;
    }
    next(error);
  }
});

app.delete("/api/scooters/:id", async (request, response, next) => {
  try {
    await withTransaction(async (client) => {
      const current = await client.query<{ id: string }>(
        `SELECT id FROM scooters
         WHERE id = $1 AND deleted_at IS NULL
         FOR UPDATE`,
        [request.params.id]
      );
      if (!current.rows[0]) {
        throw new AppError(404, "Самокат не найден", "SCOOTER_NOT_FOUND");
      }
      const active = await client.query(
        `SELECT 1 FROM rentals
         WHERE scooter_id = $1 AND status = 'active'
         LIMIT 1`,
        [request.params.id]
      );
      if (active.rows[0]) {
        throw new AppError(
          409,
          "Нельзя удалить самокат с активной арендой",
          "ACTIVE_RENTAL_EXISTS"
        );
      }
      await client.query(
        `UPDATE scooters SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [request.params.id]
      );
    });
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post("/api/rentals", async (request, response, next) => {
  try {
    const input = rentalInputSchema.parse(request.body);
    const rental = await withTransaction((client) =>
      startRental(client, input)
    );
    response.status(201).json({ rental });
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      next(
        new AppError(
          409,
          "У самоката уже есть активная аренда",
          "ACTIVE_RENTAL_EXISTS"
        )
      );
      return;
    }
    next(error);
  }
});

app.post("/api/rentals/:id/complete", async (request, response, next) => {
  try {
    await withTransaction((client) =>
      completeRental(client, request.params.id)
    );
    response.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use((_request, _response, next) => {
  next(new AppError(404, "Маршрут не найден", "NOT_FOUND"));
});

const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  void _next;
  if (error instanceof ZodError) {
    const fields = Object.fromEntries(
      error.issues.map((issue) => [issue.path.join("."), issue.message])
    );
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Проверьте введённые данные",
        fields
      }
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        fields: error.fields
      }
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Внутренняя ошибка сервера"
    }
  });
};

app.use(errorHandler);

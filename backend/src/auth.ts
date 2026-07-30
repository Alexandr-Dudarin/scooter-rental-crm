import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { pool } from "./db.js";
import { AppError } from "./errors.js";

const COOKIE_NAME = "samo_token";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export type AuthenticatedRequest = Request & { user: AuthUser };

export async function ensureDemoAdmin() {
  const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 10);
  await pool.query(
    `INSERT INTO admins (email, name, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash`,
    [config.ADMIN_EMAIL.toLowerCase(), "Александр Дударин", passwordHash]
  );
}

export function createToken(user: AuthUser) {
  return jwt.sign(user, config.JWT_SECRET, { expiresIn: "8h" });
}

export function setAuthCookie(response: Response, token: string) {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.NODE_ENV === "production",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/"
  });
}

export function clearAuthCookie(response: Response) {
  response.clearCookie(COOKIE_NAME, { path: "/" });
}

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const token = request.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) {
    next(new AppError(401, "Требуется авторизация", "UNAUTHORIZED"));
    return;
  }

  try {
    (request as AuthenticatedRequest).user = jwt.verify(
      token,
      config.JWT_SECRET
    ) as AuthUser;
    next();
  } catch {
    next(new AppError(401, "Сессия истекла", "SESSION_EXPIRED"));
  }
}

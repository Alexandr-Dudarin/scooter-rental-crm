import { z } from "zod";

const configSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z
    .string()
    .default("postgresql://samo:samo@localhost:5432/samo_crm"),
  JWT_SECRET: z.string().min(16).default("local-development-secret-change-me"),
  ADMIN_EMAIL: z.string().email().default("admin@samo.local"),
  ADMIN_PASSWORD: z.string().min(8).default("admin123"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000")
});

export const config = configSchema.parse(process.env);

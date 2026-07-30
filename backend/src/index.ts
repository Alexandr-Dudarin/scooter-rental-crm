import { ensureDemoAdmin } from "./auth.js";
import { app } from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
import { runMigrations } from "./migrations.js";

async function start() {
  await pool.query("SELECT 1");
  await runMigrations();
  await ensureDemoAdmin();

  const server = app.listen(config.PORT, "0.0.0.0", () => {
    console.log(`SAMO CRM API is running on port ${config.PORT}`);
  });

  async function shutdown(signal: string) {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});

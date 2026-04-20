import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const disableSsl = process.env.PGSSLMODE === "disable" || process.env.DISABLE_DB_SSL === "true";
const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: disableSsl ? false : { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 10000),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 10000),
});

export const db = drizzle(pool, { schema });

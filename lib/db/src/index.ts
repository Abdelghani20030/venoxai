import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { createPgPool } from "../../pg-pool.ts";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Shared pool factory (lib/pg-pool.ts): normalizes sslmode params out of the
// URL and applies the right TLS settings for remote hosts.
export const pool = createPgPool(process.env.DATABASE_URL);
export const db = drizzle(pool, { schema });

export * from "./schema";

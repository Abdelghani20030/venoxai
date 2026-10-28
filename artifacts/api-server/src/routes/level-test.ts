// @ts-nocheck
/**
 * level-test.ts — dev mirror of the Venoxa Level Test API.
 * Production runs the same routes inside api/index.ts (Vercel serverless);
 * this wrapper keeps `pnpm run dev` (vite → :3001 proxy) working identically.
 * All logic lives in ../lib/level-test-api.ts.
 */
import { Router, type IRouter } from "express";
import pg from "pg";
import { registerLevelTestRoutes } from "../lib/level-test-api";

const router: IRouter = Router();

const dbUrl = (process.env.DATABASE_URL ?? "").trim();
let pool: pg.Pool | null = null;
const getPool = () => (dbUrl ? (pool ||= new pg.Pool({ connectionString: dbUrl })) : null);

registerLevelTestRoutes(router, { pool: getPool });

export default router;

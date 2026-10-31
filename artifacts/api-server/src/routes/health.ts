// @ts-nocheck
import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { describeDbError } from "../../../../lib/pg-pool";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// GET /api/healthz/db — live `select 1` against the configured database.
// Reports the *kind* of failure (config/pooler_username/password/ssl/dns/
// network/unknown) but never the connection string itself.
router.get("/healthz/db", async (_req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(500).json({ ok: false, kind: "config", message: "DATABASE_URL is not set." });
    return;
  }
  try {
    await pool.query("select 1");
    res.json({ ok: true });
  } catch (error) {
    const described = describeDbError(error);
    console.error(
      "[healthz/db] database check failed:",
      error instanceof Error ? error.message : error,
      described?.kind ?? "",
    );
    if (described) {
      res.status(500).json({ ok: false, kind: described.kind, message: described.message });
      return;
    }
    res.status(500).json({ ok: false, kind: "unknown", message: "Database check failed. See server logs." });
  }
});

export default router;

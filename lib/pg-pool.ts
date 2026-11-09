// @ts-nocheck
// lib/pg-pool.ts — shared Postgres pool construction + error classification.
//
// Used by BOTH backends:
//   - api/index.ts (Vercel serverless)
//   - artifacts/api-server (local dev) via lib/db + lib/level-test-server
//
// Why this exists: with pg 8.20+/pg-connection-string 2.12+, any connection
// string that contains `?sslmode=require` (Supabase/Neon default) OVERRIDES the
// programmatic `ssl` option (ConnectionParameters does
// `Object.assign({}, config, parse(connectionString))`), and `sslmode=require`
// keeps TLS verification on. Verified certificates from Supabase's pooler then
// fail with "self-signed certificate in certificate chain".
// normalizeDatabaseUrl strips those URL params so the options below win.
import pg from "pg";

/* ────────────────────────────────────────────────────────────────────────────
 * URL normalisation
 * ──────────────────────────────────────────────────────────────────────────── */

/** URL params that would fight with the programmatic ssl/TLS behaviour. */
const STRIPPED_URL_PARAMS = ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert", "uselibpqcompat", "channel_binding"];

function isLocalHost(host: string | null | undefined): boolean {
  return (
    typeof host === "string" &&
    (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]")
  );
}

/** Strip surrounding quotes ('…', "…" or `…`) left over from dotenv-style env. */
function unquote(value: string): string {
  const trimmed = value.trim();
  const m = trimmed.match(/^(['"`])([\s\S]*)\1$/);
  return m ? m[2].trim() : trimmed;
}

export interface NormalizedDatabaseUrl {
  url: string;
  /** `rejectUnauthorized: false` for remote hosts, null for local ones. */
  ssl: { rejectUnauthorized: false } | null;
}

/**
 * Trim/unquote a raw DATABASE_URL, delete the SSL-related query params, and
 * derive the `ssl` option to use for pg. Returns `{ url: "", ssl: null }` for
 * an unset value; the ssl param is null when parsing fails (pg will surface
 * the error on connect, where describeDbError classifies it).
 */
export function normalizeDatabaseUrl(raw: unknown): NormalizedDatabaseUrl {
  const value = typeof raw === "string" ? unquote(raw) : "";
  if (!value) return { url: "", ssl: null };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { url: value, ssl: null };
  }

  for (const name of STRIPPED_URL_PARAMS) {
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase() === name) url.searchParams.delete(key);
    }
  }

  const ssl: NormalizedDatabaseUrl["ssl"] = isLocalHost(url.hostname) ? null : { rejectUnauthorized: false };
  return { url: url.toString(), ssl };
}

export interface CreatePgPoolOptions {
  max?: number;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Pool factory
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * A pg.Pool with sane serverless defaults.
 * - max 3 on Vercel, 10 locally (override with `options.max`)
 * - SSL except for localhost/127.0.0.1/::1 (see normalizeDatabaseUrl)
 * - timeouts so a dead host fails fast instead of hanging a request
 */
export function createPgPool(rawUrl: unknown, options: CreatePgPoolOptions = {}): pg.Pool {
  const { url, ssl } = normalizeDatabaseUrl(rawUrl);
  const max = options.max ?? (process.env.VERCEL ? 3 : 10);
  const pool = new pg.Pool({
    connectionString: url || undefined,
    ...(ssl ? { ssl } : {}),
    max,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 20_000,
  });
  // Idle-client errors must be logged, never thrown — an unhandled "error"
  // event on the pool takes the whole serverless invocation down.
  pool.on("error", (error) => {
    console.error("[pg-pool] idle client error:", error instanceof Error ? error.message : error);
  });
  return pool;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Error classification
 * ──────────────────────────────────────────────────────────────────────────── */

export type DbErrorKind = "pooler_username" | "password" | "ssl" | "dns" | "network";

export interface DescribedDbError {
  kind: DbErrorKind;
  message: string;
}

/** Flatten one error into message codes + all nested `cause` messages. */
function errorSignal(error: unknown): { message: string; codes: string[] } {
  const parts: string[] = [];
  const codes: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth++) {
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    if (typeof current !== "object") {
      if (typeof current !== "undefined" && current !== null) parts.push(String(current));
      break;
    }
    const err = current as { message?: unknown; code?: unknown; errno?: unknown; cause?: unknown };
    if (typeof err.message === "string") parts.push(err.message);
    if (typeof err.code === "string") codes.push(err.code);
    if (typeof err.errno === "string") codes.push(err.errno);
    current = err.cause;
  }
  return { message: parts.join(" | "), codes };
}

function hostFromSignal(signal: string): string | null {
  const fromMessage = signal.match(/getaddrinfo \w+ ([A-Za-z0-9.\-]+)/);
  if (fromMessage?.[1]) return fromMessage[1];
  const url = unquote(process.env.DATABASE_URL ?? "");
  try {
    return new URL(url).hostname || null;
  } catch {
    return null;
  }
}

/**
 * Map a raw connection error onto the one correct user-facing message, or
 * return null when it is not obviously a database connectivity problem.
 * Never include the connection string or password in a message.
 */
export function describeDbError(error: unknown): DescribedDbError | null {
  if (!error) return null;
  const { message, codes } = errorSignal(error);
  const text = `${message} | ${codes.join(" | ")}`.toLowerCase();
  const codeSet = new Set(codes.filter(Boolean).map((c) => c.toLowerCase()));

  const has = (...needles: string[]) => needles.some((needle) => text.includes(needle));

  // Supabase transaction pooler with the wrong username (not postgres.<ref>).
  if (has("tenant or user not found")) {
    return {
      kind: "pooler_username",
      message:
        "The Supabase pooler rejected the username. The user in DATABASE_URL must be postgres.<project-ref> (transaction pooler, port 6543), not plain postgres.",
    };
  }

  if (has("password authentication failed") || codeSet.has("28p01")) {
    return {
      kind: "password",
      message:
        "The database rejected the password (28P01). Fix DATABASE_URL and URL-encode special characters in the password.",
    };
  }

  if (has("self-signed certificate", "certificate", "ssl", "insecure")) {
    return {
      kind: "ssl",
      message:
        "TLS negotiation with the database failed. Connect with SSL and relaxed certificate verification (rejectUnauthorized: false) for Supabase/Neon poolers.",
    };
  }

  if (codeSet.has("enotfound") || has("getaddrinfo", "enetunreach")) {
    const host = hostFromSignal(message);
    return {
      kind: "dns",
      message:
        `Could not resolve the database host${host ? ` (DNS failed for ${host})` : ""}. ` +
        "db.<ref>.supabase.co is IPv6-only — use the Supabase pooler host aws-0-<region>.pooler.supabase.com (port 6543).",
    };
  }

  if (codeSet.has("econnrefused") || codeSet.has("etimedout") || has("timeout", "connection terminated")) {
    const host = hostFromSignal(message);
    return {
      kind: "network",
      message: `Could not reach the database${host ? ` (${host})` : ""} — connection refused or timed out. Check the host/port and any network firewall.`,
    };
  }

  return null;
}

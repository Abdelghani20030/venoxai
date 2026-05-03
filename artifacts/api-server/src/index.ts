// --- Load .env from the workspace root ---
// We use Node's built-in fs instead of dotenv to avoid adding a dependency.
// This MUST run before any other import that reads process.env.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

(function loadDotEnv() {
  // Walk up from the compiled file's directory to find the workspace root .env
  // The compiled output lives at: artifacts/api-server/dist/index.mjs
  // The .env lives at:           .env  (workspace root, 3 levels up)
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, ".env"),              // same dir (dev)
    resolve(here, "..", ".env"),        // one up
    resolve(here, "..", "..", ".env"),  // two up
    resolve(here, "..", "..", "..", ".env"), // three up (workspace root)
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        // Only set if not already defined (respect actual env vars over .env)
        if (key && !(key in process.env)) {
          process.env[key] = value;
        }
      }
      console.log(`[env] Loaded environment from: ${envPath}`);
      break;
    }
  }
})();
// -----------------------------------------------

import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

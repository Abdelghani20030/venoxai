// --- Load .env from the workspace root ---
// We use Node's built-in fs instead of dotenv to avoid adding a dependency.
// This MUST run before any other import that reads process.env.
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

(function loadDotEnv() {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    resolve(here, ".env"),
    resolve(here, "..", ".env"),
    resolve(here, "..", "..", ".env"),
    resolve(here, "..", "..", "..", ".env"),
    resolve(process.cwd(), ".env"),
  ];

  console.log("[env] Searching for .env file...");
  let found = false;

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, '$1'); // Strip quotes
        
        if (key) {
          process.env[key] = value;
        }
      }
      console.log(`[env] Successfully loaded from: ${envPath}`);
      found = true;
      break;
    }
  }
  if (!found) {
    console.warn("[env] No .env file found in candidate paths.");
  }
})();
// -----------------------------------------------

const { default: app } = await import("./app");
const { logger } = await import("./lib/logger");

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

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "Server listening on 0.0.0.0");
});

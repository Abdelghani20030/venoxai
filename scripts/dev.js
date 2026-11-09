import { spawn } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "..");

// 1. Load .env file from the workspace root
const envPath = resolve(rootDir, ".env");
if (existsSync(envPath)) {
  console.log("[dev] Loading environment variables from .env...");
  const content = readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["'](.*)["']$/, '$1');
    if (key) {
      process.env[key] = value;
    }
  }
} else {
  console.warn("[dev] No .env file found in root directory!");
}

// 2. Helper to spawn child processes and pipe output
function startProcess(name, command, args, options = {}) {
  const child = spawn(command, args, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    ...options,
  });

  child.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      console.log(`[${name}] ${line}`);
    }
  });

  child.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    for (const line of lines) {
      console.error(`[${name}-err] ${line}`);
    }
  });

  child.on("error", (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  child.on("close", (code) => {
    console.log(`[${name}] Exited with code ${code}`);
  });

  return child;
}

console.log("\n=== Starting Venoxa AI Platform Local Servers ===");

// 3. Start Backend API on port 3001
const backendEnv = { ...process.env, PORT: "3001" };
const backend = startProcess(
  "Backend",
  "node",
  ["--enable-source-maps", "artifacts/api-server/dist/index.mjs"],
  { env: backendEnv, cwd: rootDir }
);

// 4. Start Frontend Vite Dev Server on port 3000
const frontendEnv = { ...process.env, PORT: "3000" };
const frontend = startProcess(
  "Frontend",
  "pnpm",
  ["run", "dev"],
  { env: frontendEnv, cwd: resolve(rootDir, "artifacts/venoxa") }
);

// 5. Clean up child processes on exit
const cleanup = () => {
  console.log("\n[dev] Stopping all servers...");
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit();
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

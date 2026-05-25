import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env variables FIRST, before importing anything else
const envPath = resolve(process.cwd(), ".env");
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

// Now dynamically import app
const { default: app } = await import("../artifacts/api-server/src/app.ts");

// Start local test server
const PORT = 3050;
const server = app.listen(PORT, "127.0.0.1", async () => {
  console.log(`Test server running on http://127.0.0.1:${PORT}`);

  try {
    console.log("Testing POST /api/chat (non-streaming)...");
    const response = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello, say test" }),
    });

    console.log("Status:", response.status);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data));
  } catch (err) {
    console.error("Non-streaming test failed:", err);
  }

  try {
    console.log("\nTesting POST /api/chat/stream (streaming)...");
    const response = await fetch(`http://127.0.0.1:${PORT}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello, say test" }),
    });

    console.log("Status:", response.status);
    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        console.log("CHUNK:", decoder.decode(value));
      }
    } else {
      console.log("Error response:", await response.text());
    }
  } catch (err) {
    console.error("Streaming test failed:", err);
  }

  server.close();
});

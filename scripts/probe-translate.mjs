// scripts/probe-translate.mjs — one small translation call per provider/model,
// bounded and loud, so we know exactly which model works right now.
import { readFileSync } from "fs";
import "dotenv/config";

function envKey(name) {
  const line = (readFileSync(new URL("../.env", import.meta.url), "utf8").match(new RegExp(`^${name}=(.*)$`, "m")) ?? [])[1];
  return line ? line.trim().replace(/^["']|["']$/g, "") : "";
}

const ITEMS = [
  { id: 1, word: "breakfast", pos: "n.", level: "A1", category: "Food", meaning: "The first meal of the day.", example: "I have breakfast at seven." },
  { id: 2, word: "airport", pos: "n.", level: "A2", category: "Travel", meaning: "A place where planes take off and land.", example: "We arrived at the airport early." },
  { id: 3, word: "achieve", pos: "v.", level: "B1", category: "Success", meaning: "To succeed in doing something.", example: "She achieved her goal." },
];
const SYSTEM = `You are a professional bilingual lexicographer. Translate each meaning and example into natural Modern Standard Arabic. Respond with ONLY a JSON array of objects {"id": <id>, "m": "<Arabic meaning>", "e": "<Arabic example>"} — same order, nothing else.`;

const TARGETS = [
  { name: "openrouter qwen3.8-flash", url: "https://openrouter.ai/api/v1/chat/completions", key: "OPENROUTER_API_KEY", model: "qwen/qwen3.8-flash" },
  { name: "openrouter qwen3.8-27b", url: "https://openrouter.ai/api/v1/chat/completions", key: "OPENROUTER_API_KEY", model: "qwen/qwen3.8-27b" },
  { name: "gemini-3.8-flash", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: "GEMINI_API_KEY", model: "gemini-3.8-flash" },
  { name: "gemini-3.5-flash", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: "GEMINI_API_KEY", model: "gemini-3.5-flash" },
  { name: "gemini-2.5-pro", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: "GEMINI_API_KEY", model: "gemini-2.5-pro" },
  { name: "groq gpt-oss-120b", url: "https://api.groq.com/openai/v1/chat/completions", key: "GROQ_API_KEY", model: "openai/gpt-oss-120b" },
  { name: "groq qwen3.8-27b", url: "https://api.groq.com/openai/v1/chat/completions", key: "GROQ_API_KEY", model: "qwen/qwen3.8-27b" },
  { name: "groq allam-2-7b", url: "https://api.groq.com/openai/v1/chat/completions", key: "GROQ_API_KEY", model: "allam-2-7b" },
];

for (const t of TARGETS) {
  const t0 = Date.now();
  try {
    const res = await fetch(t.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${envKey(t.key)}` },
      body: JSON.stringify({
        model: t.model,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Translate these ${ITEMS.length} items:\n${JSON.stringify(ITEMS)}` },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(75_000),
    });
    const ms = Math.round((Date.now() - t0) / 1000);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.log(`✗ ${t.name.padEnd(26)} HTTP ${res.status} (${ms}s) ${body.slice(0, 110).replace(/\n/g, " ")}`);
      continue;
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const close = raw.lastIndexOf("</think>");
    const clean = close !== -1 ? raw.slice(close + 8) : raw;
    const arr = clean.match(/\[[\s\S]*\]/);
    let ok = "?", sample = "";
    if (arr) {
      try {
        const parsed = JSON.parse(arr[0]);
        ok = `${parsed.length}/3`;
        sample = (parsed[0]?.m ?? "").slice(0, 40);
      } catch { ok = "unparseable"; }
    } else ok = "no array";
    console.log(`✓ ${t.name.padEnd(26)} ${ok} (${ms}s) sample: ${sample}`);
  } catch (e) {
    const ms = Math.round((Date.now() - t0) / 1000);
    console.log(`✗ ${t.name.padEnd(26)} ${e.name === "TimeoutError" ? "TIMEOUT" : e.message.slice(0, 90)} (${ms}s)`);
  }
}

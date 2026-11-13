// scripts/probe-ai-models.mjs — list available models from Groq / Gemini / OpenRouter
import "dotenv/config";
import { readFileSync } from "fs";

function envKey(name) {
  const line = (readFileSync(new URL("../.env", import.meta.url), "utf8").match(new RegExp(`^${name}=(.*)$`, "m")) ?? [])[1];
  return line ? line.trim().replace(/^["']|["']$/g, "") : "";
}

const jobs = [
  { name: "groq", key: envKey("GROQ_API_KEY"), url: "https://api.groq.com/openai/v1/models" },
  { name: "gemini", key: envKey("GEMINI_API_KEY"), url: "https://generativelanguage.googleapis.com/v1beta/openai/models" },
];

for (const j of jobs) {
  try {
    const res = await fetch(j.url, { headers: { Authorization: `Bearer ${j.key}` } });
    const data = await res.json();
    const ids = (data.data ?? []).map((m) => m.id);
    console.log(`\n=== ${j.name} (${res.status}) ${ids.length} models ===`);
    console.log(ids.join("\n"));
  } catch (e) {
    console.log(`\n=== ${j.name} ERROR: ${e.message} ===`);
  }
}

// OpenRouter: too many to print — filter to translation-capable cheap/free ones
try {
  const key = envKey("OPENROUTER_API_KEY");
  const res = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${key}` } });
  const data = await res.json();
  const models = (data.data ?? []).filter((m) => /deepseek|llama-3|qwen|gemini|gpt-4o-mini|arabic|aya/i.test(m.id));
  console.log(`\n=== openrouter (${res.status}) filtered ${models.length}/${(data.data ?? []).length} ===`);
  for (const m of models.slice(0, 40)) {
    console.log(`${m.id}  in=$${m.pricing?.prompt ?? "?"}/tok out=$${m.pricing?.completion ?? "?"} ctx=${m.context_length ?? "?"}`);
  }
} catch (e) {
  console.log(`\n=== openrouter ERROR: ${e.message} ===`);
}

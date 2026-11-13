// scripts/translate-vocab.mjs
// ─────────────────────────────────────────────────────────────────────────────
//  Generates Arabic translations (meaning_ar / example_ar, category name_ar)
//  for the canonical vocabulary catalog, using the app's AI keys.
//
//  Providers, in order: DeepSeek → Groq → Gemini (OpenAI-compatible REST).
//  Fully resumable: every completed batch is checkpointed to
//    attached_assets/vocab-ar-progress.json   (senses, keyed by sense id)
//    attached_assets/vocab-cat-ar-progress.json (categories, keyed by cat id)
//  Rerun the script any time — it skips completed batches, and a final sweep
//  retries any senses that are still missing.
//
//  Finalize (automatic once everything is translated):
//    migrations/vocabulary-ar-seed.sql        UPDATE statements
//    artifacts/venoxa/public/data/vocab-catalog.json  regenerated with _ar fields
//
//  Usage:
//    node scripts/translate-vocab.mjs                 (run/resume all)
//    node scripts/translate-vocab.mjs --limit 40      (only N remaining batches)
//    node scripts/translate-vocab.mjs --finalize-only (just emit SQL + catalog)
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync } from "fs";
import "dotenv/config";

// ── config ──────────────────────────────────────────────────────────────────
const BATCH = Number(process.env.VBATCH ?? 40);
const CONCURRENCY = Number(process.env.VCONC ?? 2);
const MAX_TOKENS = Number(process.env.VMAXTOK ?? 8000);
const PROGRESS = "attached_assets/vocab-ar-progress.json";
const CAT_PROGRESS = "attached_assets/vocab-cat-ar-progress.json";
const NORM = "attached_assets/vocab-normalized.json";

const norm = JSON.parse(readFileSync(NORM, "utf8"));
const senses = norm.senses;
const categories = norm.categories;

// ── providers ───────────────────────────────────────────────────────────────
function envKey(name) {
  const line = (readFileSync(new URL("../.env", import.meta.url), "utf8").match(new RegExp(`^${name}=(.*)$`, "m")) ?? [])[1];
  return line ? line.trim().replace(/^["']|["']$/g, "") : "";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROVIDERS = [
  // order verified by scripts/probe-translate.mjs (gemini currently 503/timeout/404)
  {
    name: "openrouter/qwen3.8-flash",
    key: () => envKey("OPENROUTER_API_KEY"),
    url: "https://openrouter.ai/api/v1/chat/completions",
    models: ["qwen/qwen3.8-flash"],
  },
  {
    name: "groq/qwen3.8-27b",
    key: () => envKey("GROQ_API_KEY"),
    url: "https://api.groq.com/openai/v1/chat/completions",
    models: ["qwen/qwen3.8-27b"],
  },
  {
    name: "groq/gpt-oss-120b",
    key: () => envKey("GROQ_API_KEY"),
    url: "https://api.groq.com/openai/v1/chat/completions",
    models: ["openai/gpt-oss-120b", "allam-2-7b"],
  },
  {
    name: "gemini",
    key: () => envKey("GEMINI_API_KEY"),
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    models: ["gemini-3.8-flash"],
  },
];

function extractJSON(text) {
  let t = String(text ?? "").trim();
  // qwen3-family models emit reasoning tags: drop everything before the closing tag
  const close = t.lastIndexOf("</think>");
  if (close !== -1) t = t.slice(close + "</think>".length);
  t = t.replace(/<\/?think>/g, "");
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const s = t.indexOf("[");
  const e = t.lastIndexOf("]");
  if (s === -1 || e === -1) throw new Error("no JSON array in response");
  return JSON.parse(t.slice(s, e + 1));
}

async function chat(provider, messages) {
  const key = provider.key();
  if (!key) throw new Error(`no key for ${provider.name}`);
  const errors = [];
  for (const model of provider.models) {
    let lastErr = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(provider.url, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: MAX_TOKENS,
            temperature: 0.2,
            stream: false,
          }),
          // hard cap per attempt so a slow/hung provider can't stall the run
          signal: AbortSignal.timeout(Number(process.env.VTIMEOUT ?? 90_000)),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          lastErr = new Error(`${model} HTTP ${res.status} ${body.slice(0, 140)}`);
          // rate-limit / credit congestion: wait before retrying
          if (res.status === 429 || res.status === 402) await sleep(attempt === 1 ? 4000 : 12000);
          continue;
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? "";
      } catch (e) {
        lastErr = e;
        await sleep(2000);
      }
    }
    if (lastErr) errors.push(lastErr.message);
  }
  throw new Error(errors.join(" | ") || "all models failed");
}

const SYSTEM = `You are a professional bilingual lexicographer building an English-learning dataset for Arabic-speaking students (Modern Standard Arabic, clear and simple).
For each item you receive an English word with its part of speech, level, category, meaning and example sentence.
Translate BOTH the meaning and the example sentence into natural Modern Standard Arabic — the way a good teacher would explain it, not a literal word-by-word translation.
Keep technical part labels like "n." unchanged. Respond with ONLY a JSON array of objects: {"id": <the given id>, "m": "<Arabic meaning>", "e": "<Arabic example>"} — same order, same ids, nothing else.`;

function buildMessages(items) {
  const payload = items.map((s) => ({ id: s.id, word: s.word, pos: s.pos, level: s.level, category: s.category, meaning: s.meaning, example: s.example }));
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Translate these ${payload.length} items:\n${JSON.stringify(payload)}` },
  ];
}

const CAT_SYSTEM = `You are a professional bilingual lexicographer. Translate each English vocabulary-category name into short Modern Standard Arabic (2-4 words, the natural name Arabic teachers use for that topic). Respond with ONLY a JSON array of objects: {"id": <id>, "t": "<Arabic name>"}.`;

function buildCatMessages(items) {
  const payload = items.map((c) => ({ id: c.id, name: c.name }));
  return [
    { role: "system", content: CAT_SYSTEM },
    { role: "user", content: `Translate these ${payload.length} category names:\n${JSON.stringify(payload)}` },
  ];
}

// ── checkpointing ───────────────────────────────────────────────────────────
function loadJSON(file, fallback) {
  if (existsSync(file)) {
    try { return JSON.parse(readFileSync(file, "utf8")); } catch { return fallback; }
  }
  return fallback;
}
let prog = loadJSON(PROGRESS, {});
let catProg = loadJSON(CAT_PROGRESS, {});
let progDirty = 0;
const saveProg = (force = false) => {
  if (!force && progDirty < 3) return;
  writeFileSync(PROGRESS, JSON.stringify(prog));
  writeFileSync(CAT_PROGRESS, JSON.stringify(catProg));
  progDirty = 0;
};

// ── batch driver ────────────────────────────────────────────────────────────
let stats = { ok: 0, fail: 0 };
async function translateBatch(items, messages, target, validate) {
  const errors = [];
  for (const provider of PROVIDERS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const out = extractJSON(await chat(provider, messages));
        if (!Array.isArray(out)) throw new Error("not an array");
        const byId = new Map(out.map((o) => [Number(o.id), o]));
        let applied = 0;
        for (const it of items) {
          const o = byId.get(it.id);
          if (o && validate(o)) { target(it.id, o); applied++; }
        }
        if (applied < Math.ceil(items.length * 0.6)) throw new Error(`only ${applied}/${items.length} valid`);
        stats.ok++;
        return true;
      } catch (e) {
        errors.push(`${provider.name}#${attempt}: ${e.message}`);
      }
    }
  }
  stats.fail++;
  console.error(`  ✗ batch failed (${errors.join(" | ")})`);
  return false;
}

const missingSenses = senses.filter((s) => !prog[s.id]);
const missingCats = categories.filter((c) => !catProg[c.id]);
console.log(`senses: ${senses.length}, missing: ${missingSenses.length} · categories: ${categories.length}, missing: ${missingCats.length}`);

const finalizeOnly = process.argv.includes("--finalize-only");
const limitArg = process.argv.indexOf("--limit");
const limit = limitArg !== -1 ? Number(process.argv[limitArg + 1] ?? Infinity) : Infinity;

if (!finalizeOnly) {
  const batches = [];
  for (let i = 0; i < missingSenses.length; i += BATCH) batches.push(missingSenses.slice(i, i + BATCH));
  console.log(`sense batches to run: ${Math.min(batches.length, limit === Infinity ? batches.length : limit)} (of ${batches.length})`);

  let idx = 0, done = 0;
  async function worker(wid) {
    while (idx < batches.length && (limit === Infinity || done < limit)) {
      const batch = batches[idx++];
      const t0 = Date.now();
      await translateBatch(batch, buildMessages(batch), (id, o) => { prog[id] = { m: o.m, e: o.e }; progDirty++; }, (o) => typeof o.m === "string" && o.m.length > 1);
      done++;
      if (done % 10 === 0) saveProg(true);
      if (done % 5 === 0) {
        console.log(`  [w${wid}] ${done} batches · ${Object.keys(prog).length}/${senses.length} senses · ${Math.round((Date.now() - t0) / 1000)}s/batch`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, w) => worker(w + 1)));
  saveProg(true);

  if (limit !== Infinity) {
    console.log(`--limit reached: stopping after ${done} batches. Senses translated: ${Object.keys(prog).length}/${senses.length}. Rerun without --limit to continue.`);
    process.exit(0);
  }

  // categories (quick, single-threaded)
  const catBatches = [];
  for (let i = 0; i < missingCats.length; i += 30) catBatches.push(missingCats.slice(i, i + 30));
  for (const cb of catBatches) {
    await translateBatch(cb, buildCatMessages(cb), (id, o) => { catProg[id] = o.t; progDirty++; }, (o) => typeof o.t === "string" && o.t.length > 1);
  }
  saveProg(true);
  console.log(`after pass: senses translated ${Object.keys(prog).length}/${senses.length} · cats ${Object.keys(catProg).length}/${categories.length} · ok=${stats.ok} fail=${stats.fail}`);
}

// ── final sweep for stragglers (single batch retry) ─────────────────────────
if (!finalizeOnly) {
  const still = senses.filter((s) => !prog[s.id]);
  if (still.length) {
    console.log(`final sweep: ${still.length} senses`);
    for (let i = 0; i < still.length; i += BATCH) {
      const b = still.slice(i, i + BATCH);
      await translateBatch(b, buildMessages(b), (id, o) => { prog[id] = { m: o.m, e: o.e }; }, (o) => typeof o.m === "string" && o.m.length > 1);
    }
    saveProg(true);
  }
}

// ── finalize: seed SQL + refreshed catalog ───────────────────────────────────
const doneSenses = senses.filter((s) => prog[s.id]);
const q = (s) => `'${String(s ?? "").replace(/'/g, "''")}'`;
const qi = (s) => (s == null ? "null" : q(s));

if (doneSenses.length > 0) {
  const parts = [`-- Generated by scripts/translate-vocab.mjs — Arabic translations (meanings + examples)
-- ${doneSenses.length} of ${senses.length} senses translated.

begin;`];
  for (let i = 0; i < doneSenses.length; i += 200) {
    parts.push(doneSenses.slice(i, i + 200).map((s) =>
      `update public.vocab_senses set meaning_ar = ${qi(prog[s.id].m)}, example_ar = ${qi(prog[s.id].e ?? null)} where id = ${s.id};`).join("\n"));
  }
  parts.push("commit;");
  writeFileSync("migrations/vocabulary-ar-seed.sql", parts.join("\n"), "utf8");

  // refresh the frontend catalog with Arabic fields
  const catById = new Map(categories.map((c) => [c.id, c]));
  const catalog = JSON.parse(readFileSync("artifacts/venoxa/public/data/vocab-catalog.json", "utf8"));
  for (const s of catalog.senses) {
    const tr = prog[s.id];
    if (tr) { s.meaning_ar = tr.m; s.example_ar = tr.e ?? null; }
  }
  catalog.arabic = { translated: doneSenses.length, total: senses.length, generated: new Date().toISOString() };
  for (const c of catalog.categories) {
    c.name_ar = catProg[c.id] ?? null;
  }
  writeFileSync("artifacts/venoxa/public/data/vocab-catalog.json", JSON.stringify(catalog), "utf8");
  console.log(`FINALIZED: ${doneSenses.length}/${senses.length} senses · migrations/vocabulary-ar-seed.sql written · catalog refreshed`);
} else {
  console.log("nothing finalized yet");
}

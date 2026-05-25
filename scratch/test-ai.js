import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env variables
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
  if (key) process.env[key] = value;
}

const groqKey = process.env.GROQ_API_KEY || "";
const geminiKey = process.env.GEMINI_API_KEY || "";
const orKey = process.env.OPENROUTER_API_KEY || "";
const dsKey = process.env.DEEPSEEK_API_KEY || "";
const pollKey = process.env.POLLINATIONS_API_KEY || "";

console.log("Keys loaded:");
console.log("- GROQ_API_KEY:", groqKey ? "Present" : "Missing");
console.log("- GEMINI_API_KEY:", geminiKey ? "Present" : "Missing");
console.log("- OPENROUTER_API_KEY:", orKey ? "Present" : "Missing");
console.log("- DEEPSEEK_API_KEY:", dsKey ? "Present" : "Missing");
console.log("- POLLINATIONS_API_KEY:", pollKey ? "Present" : "Missing");

async function testGroq() {
  if (!groqKey) return "Skip";
  try {
    const openai = new OpenAI({ apiKey: groqKey, baseURL: "https://api.groq.com/openai/v1" });
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: "Say ok" }],
      max_tokens: 10
    });
    return response.choices[0]?.message?.content?.trim() || "Empty";
  } catch (err) {
    return "Error: " + err.message;
  }
}

async function testGemini() {
  if (!geminiKey) return "Skip";
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say ok");
    return result.response.text().trim();
  } catch (err) {
    return "Error: " + err.message;
  }
}

async function testPollinations() {
  if (!pollKey) return "Skip";
  try {
    const openai = new OpenAI({ apiKey: pollKey, baseURL: "https://gen.pollinations.ai" });
    const response = await openai.chat.completions.create({
      model: "openai",
      messages: [{ role: "user", content: "Say ok" }],
      max_tokens: 10
    });
    return response.choices[0]?.message?.content?.trim() || "Empty";
  } catch (err) {
    return "Error: " + err.message;
  }
}

async function testDeepseek() {
  if (!dsKey) return "Skip";
  try {
    const openai = new OpenAI({ apiKey: dsKey, baseURL: "https://api.deepseek.com" });
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Say ok" }],
      max_tokens: 10
    });
    return response.choices[0]?.message?.content?.trim() || "Empty";
  } catch (err) {
    return "Error: " + err.message;
  }
}

async function testOpenRouter() {
  if (!orKey) return "Skip";
  try {
    const openai = new OpenAI({ apiKey: orKey, baseURL: "https://openrouter.ai/api/v1" });
    const response = await openai.chat.completions.create({
      model: "liquid/lfm-2.5-1.2b-instruct:free",
      messages: [{ role: "user", content: "Say ok" }],
      max_tokens: 10
    });
    return response.choices[0]?.message?.content?.trim() || "Empty";
  } catch (err) {
    return "Error: " + err.message;
  }
}

console.log("\nStarting tests...");
console.log("Groq:", await testGroq());
console.log("Gemini:", await testGemini());
console.log("Pollinations:", await testPollinations());
console.log("DeepSeek:", await testDeepseek());
console.log("OpenRouter:", await testOpenRouter());

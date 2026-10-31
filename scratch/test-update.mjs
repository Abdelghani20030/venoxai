import pg from 'pg';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const r = await pool.query(`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active'`);
console.log('last_active column:', JSON.stringify(r.rows[0], null, 2));

// Try the exact same update that's failing
try {
  await pool.query('UPDATE users SET last_active = $1 WHERE id = $2', [new Date(), 3]);
  console.log('Direct SQL UPDATE succeeded!');
} catch (err) {
  console.error('Direct SQL UPDATE failed:', err.message);
}

// Now try with Drizzle to see if it fails
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Export it (or run from the repo root with a root .env) before using this script - never hard-code credentials here.');
  process.exit(1);
}

const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  username: text("username").default("New Learner").notNull(),
  avatar: text("avatar"),
  dob: text("dob"),
  gender: text("gender"),
  languages: jsonb("languages").$type().default(["English"]).notNull(),
  plan: text("plan").default("basic plan").notNull(),
  xp: integer("xp").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastActive: timestamp("last_active"),
  dailyGoalMins: integer("daily_goal_mins").default(15).notNull(),
  level: text("level").default("A1").notNull(),
  rank30Days: integer("rank_30_days").default(29336).notNull(),
  streakRank: integer("streak_rank").default(601).notNull(),
  completedCells: jsonb("completed_cells").$type().default({}).notNull(),
  usageTime: jsonb("usage_time").$type().default({}).notNull(),
  calendarDays: jsonb("calendar_days").$type().default([]).notNull(),
  achievements: jsonb("achievements").$type().default([]).notNull(),
  globalVocab: jsonb("global_vocab").$type().default([]).notNull(),
  phrasalVocab: jsonb("phrasal_vocab").$type().default([]).notNull(),
  idiomsVocab: jsonb("idioms_vocab").$type().default([]).notNull(),
  idiomsProperVocab: jsonb("idioms_proper_vocab").$type().default([]).notNull(),
  langeekVocab: jsonb("langeek_vocab").$type().default([]).notNull(),
  srsData: jsonb("srs_data").$type().default({}).notNull(),
  langeekSrsData: jsonb("langeek_srs_data").$type().default({}).notNull(),
  speakingHistory: jsonb("speaking_history").$type().default([]).notNull(),
  writingHistory: jsonb("writing_history").$type().default([]).notNull(),
  planConfig: jsonb("plan_config").$type().default({}).notNull(),
  studiedWords: jsonb("studied_words").$type().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const db = drizzle(pool, { schema: { usersTable } });

try {
  await db.update(usersTable).set({ lastActive: new Date() }).where(eq(usersTable.id, 3));
  console.log('Drizzle UPDATE succeeded!');
} catch (err) {
  console.error('Drizzle UPDATE failed:', err.message);
}

await pool.end();

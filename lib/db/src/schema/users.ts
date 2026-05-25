import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  
  // Profile settings
  username: text("username").default("New Learner").notNull(),
  avatar: text("avatar"), // Base64 or URL
  dob: text("dob"), // Date of Birth (e.g. "January 2003")
  gender: text("gender"), // Male, Female, etc.
  languages: jsonb("languages").$type<string[]>().default(["English"]).notNull(),
  plan: text("plan").default("basic plan").notNull(),
  
  // Progress & Stats
  xp: integer("xp").default(0).notNull(),
  streak: integer("streak").default(0).notNull(),
  lastActive: timestamp("last_active"),
  dailyGoalMins: integer("daily_goal_mins").default(15).notNull(),
  level: text("level").default("A1").notNull(),
  rank30Days: integer("rank_30_days").default(29336).notNull(),
  streakRank: integer("streak_rank").default(601).notNull(),
  
  // Complex tracking objects
  completedCells: jsonb("completed_cells").$type<Record<string, string>>().default({}).notNull(),
  usageTime: jsonb("usage_time").$type<Record<string, number>>().default({}).notNull(),
  calendarDays: jsonb("calendar_days").$type<string[]>().default([]).notNull(),
  achievements: jsonb("achievements").$type<string[]>().default([]).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

CREATE TABLE "achievements_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_interactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"interaction_type" text NOT NULL,
	"content_key" text NOT NULL,
	"interacted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"rule_key" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"history_json" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"passage_title" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"passage_title" text NOT NULL,
	"difficulty" text NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"reading_time_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"word" text NOT NULL,
	"category" text NOT NULL,
	"rating" text NOT NULL,
	"reviewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"word" text NOT NULL,
	"category" text NOT NULL,
	"next_review_date" timestamp NOT NULL,
	"prev_review_date" timestamp,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"ease_factor" integer DEFAULT 250 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speaking_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"scenario_name" text NOT NULL,
	"audio_url" text,
	"transcript_json" jsonb NOT NULL,
	"evaluation_json" jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"skill_type" text NOT NULL,
	"duration_seconds" integer NOT NULL,
	"ended_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tone_rewriter_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_text" text NOT NULL,
	"target_tone" text NOT NULL,
	"rewritten_text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"source_text" text NOT NULL,
	"target_text" text NOT NULL,
	"source_lang" text NOT NULL,
	"target_lang" text NOT NULL,
	"mode" text DEFAULT 'natural' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"preferred_language" text DEFAULT 'ar' NOT NULL,
	"preferred_voice_speed" text DEFAULT 'natural' NOT NULL,
	"preferred_voice_gender" text DEFAULT 'male' NOT NULL,
	"default_accent" text DEFAULT 'en-US' NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_statistics" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"total_study_seconds" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"rank_30_days" integer DEFAULT 29336 NOT NULL,
	"streak_rank" integer DEFAULT 601 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"salt" text NOT NULL,
	"username" text DEFAULT 'New Learner' NOT NULL,
	"avatar" text,
	"dob" text,
	"gender" text,
	"languages" jsonb DEFAULT '["English"]'::jsonb NOT NULL,
	"plan" text DEFAULT 'basic plan' NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"streak" integer DEFAULT 0 NOT NULL,
	"last_active" timestamp,
	"daily_goal_mins" integer DEFAULT 15 NOT NULL,
	"level" text DEFAULT 'A1' NOT NULL,
	"rank_30_days" integer DEFAULT 29336 NOT NULL,
	"streak_rank" integer DEFAULT 601 NOT NULL,
	"completed_cells" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"usage_time" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calendar_days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"achievements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"global_vocab" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"phrasal_vocab" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"idioms_vocab" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"idioms_proper_vocab" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"langeek_vocab" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"srs_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"langeek_srs_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"phrasal_srs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idioms_srs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idioms_proper_srs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"speaking_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"writing_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"plan_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"studied_words" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vocabulary_difficulty" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"word" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"word" text NOT NULL,
	"category" text NOT NULL,
	"state" text DEFAULT 'unseen' NOT NULL,
	"mastery_score" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" serial PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"category" text NOT NULL,
	"definition" text,
	"cefr_level" text DEFAULT 'B2',
	"meaning" text,
	"example" text,
	"synonyms" text
);
--> statement-breakpoint
CREATE TABLE "writing_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"original_text" text NOT NULL,
	"ai_response_text" text NOT NULL,
	"corrections_json" jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements_log" ADD CONSTRAINT "achievements_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_interactions" ADD CONSTRAINT "daily_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_progress" ADD CONSTRAINT "grammar_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_history" ADD CONSTRAINT "listening_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_history" ADD CONSTRAINT "reading_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_history" ADD CONSTRAINT "review_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_queue" ADD CONSTRAINT "review_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speaking_history" ADD CONSTRAINT "speaking_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tone_rewriter_history" ADD CONSTRAINT "tone_rewriter_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation_history" ADD CONSTRAINT "translation_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_statistics" ADD CONSTRAINT "user_statistics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_difficulty" ADD CONSTRAINT "vocabulary_difficulty_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocabulary_progress" ADD CONSTRAINT "vocabulary_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_history" ADD CONSTRAINT "writing_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievement_idx" ON "achievements_log" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "user_grammar_idx" ON "grammar_progress" USING btree ("user_id","rule_key");--> statement-breakpoint
CREATE UNIQUE INDEX "user_srs_word_idx" ON "review_queue" USING btree ("user_id","word","category");--> statement-breakpoint
CREATE INDEX "srs_review_date_idx" ON "review_queue" USING btree ("user_id","next_review_date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_word_diff_idx" ON "vocabulary_difficulty" USING btree ("user_id","word","category");--> statement-breakpoint
CREATE UNIQUE INDEX "user_word_idx" ON "vocabulary_progress" USING btree ("user_id","word","category");--> statement-breakpoint
CREATE INDEX "vocab_word_idx" ON "vocabulary" USING btree ("word");
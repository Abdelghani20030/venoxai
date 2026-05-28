-- Migration: Create tables for user progress tracking and set up Row Level Security (RLS)
-- File: nextjs-supabase-sync/supabase/migrations/20260527000000_schema.sql

-- 1. Create user_progress table (stores global stats and settings)
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_visited_lesson TEXT,
    settings JSONB NOT NULL DEFAULT '{"theme": "system", "daily_goal_xp": 50, "sound_effects": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for performance
CREATE INDEX IF NOT EXISTS user_progress_id_idx ON public.user_progress(id);

-- 2. Create user_completed_lessons table
CREATE TABLE IF NOT EXISTS public.user_completed_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id TEXT NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    score INTEGER,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS user_completed_lessons_user_id_idx ON public.user_completed_lessons(user_id);

-- 3. Create user_vocabulary table (for Spaced Repetition / learned words)
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'learning', -- 'learning', 'learned', 'review'
    srs_stage INTEGER NOT NULL DEFAULT 0,    -- 0 to 7
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, word)
);

CREATE INDEX IF NOT EXISTS user_vocabulary_user_id_idx ON public.user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS user_vocabulary_next_review_idx ON public.user_vocabulary(user_id, next_review_at);

-- 4. Create user_quiz_results table
CREATE TABLE IF NOT EXISTS public.user_quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS user_quiz_results_user_id_idx ON public.user_quiz_results(user_id);


-- 5. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_completed_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quiz_results ENABLE ROW LEVEL SECURITY;


-- 6. Define Row Level Security policies
-- Every user can only read and write their own data. auth.uid() is provided by Supabase.

-- Policies for user_progress
CREATE POLICY "Allow individual read access" ON public.user_progress
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow individual insert access" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow individual update access" ON public.user_progress
    FOR UPDATE USING (auth.uid() = id);

-- Policies for user_completed_lessons
CREATE POLICY "Allow individual read completed lessons" ON public.user_completed_lessons
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert completed lessons" ON public.user_completed_lessons
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual update completed lessons" ON public.user_completed_lessons
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow individual delete completed lessons" ON public.user_completed_lessons
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_vocabulary
CREATE POLICY "Allow individual read vocabulary" ON public.user_vocabulary
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert vocabulary" ON public.user_vocabulary
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow individual update vocabulary" ON public.user_vocabulary
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow individual delete vocabulary" ON public.user_vocabulary
    FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_quiz_results
CREATE POLICY "Allow individual read quiz results" ON public.user_quiz_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow individual insert quiz results" ON public.user_quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 7. Trigger to automatically initialize user_progress upon signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_progress (id, xp, streak, last_active_at, settings)
    VALUES (
        new.id,
        0,
        0,
        timezone('utc'::text, now()),
        '{"theme": "system", "daily_goal_xp": 50, "sound_effects": true}'::jsonb
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 8. Functions to update timestamps automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trigger_user_vocabulary_updated_at
    BEFORE UPDATE ON public.user_vocabulary
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  daily_goal_xp: number;
  sound_effects: boolean;
  [key: string]: any; // Allow other dynamic settings
}

export interface UserProgress {
  id: string;
  xp: number;
  streak: number;
  last_active_at: string;
  last_visited_lesson: string | null;
  settings: UserSettings;
  created_at?: string;
  updated_at?: string;
}

export interface CompletedLesson {
  id?: string;
  user_id?: string;
  lesson_id: string;
  completed_at?: string;
  score: number | null;
}

export interface VocabularyWord {
  id?: string;
  user_id?: string;
  word: string;
  status: 'learning' | 'learned' | 'review';
  srs_stage: number;
  next_review_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QuizResult {
  id?: string;
  user_id?: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  completed_at?: string;
}

/**
 * Unified progress payload used for syncing and client state.
 */
export interface SyncState {
  progress: UserProgress | null;
  completedLessons: CompletedLesson[];
  vocabulary: VocabularyWord[];
  quizResults: QuizResult[];
}

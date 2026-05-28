'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuth } from './useAuth';
import { SyncState, UserProgress, CompletedLesson, VocabularyWord, QuizResult } from '../types';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

/**
 * Custom hook managing local state and Supabase cloud synchronization.
 * Offline-first: handles local modifications when offline and automatically flushes
 * them to Supabase when the connection is restored.
 */
export function useSync() {
  const { user } = useAuth();
  const supabase = createClient();

  const [state, setState] = useState<SyncState>({
    progress: null,
    completedLessons: [],
    vocabulary: [],
    quizResults: [],
  });

  const [status, setStatus] = useState<SyncStatus>('synced');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // References to keep track of state for event listeners and timeouts
  const stateRef = useRef<SyncState>(state);
  const pendingSyncRef = useRef<{
    progressDirty: boolean;
    lessonsToSync: CompletedLesson[];
    vocabToSync: VocabularyWord[];
    quizzesToSync: QuizResult[];
  }>({
    progressDirty: false,
    lessonsToSync: [],
    vocabToSync: [],
    quizzesToSync: [],
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep stateRef updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load state from local storage or cloud on mount/auth state change
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setStatus('syncing');
    setError(null);

    try {
      // 1. Check if there is cached data in localStorage
      const cachedDataStr = localStorage.getItem(`user_state_${user.id}`);
      let localState: SyncState | null = null;
      if (cachedDataStr) {
        try {
          localState = JSON.parse(cachedDataStr);
          if (localState) {
            setState(localState);
          }
        } catch (e) {
          console.error('Failed to parse cached user state', e);
        }
      }

      // If we are offline, use local state and stop fetching
      if (!navigator.onLine) {
        setStatus('offline');
        setLoading(false);
        return;
      }

      // 2. Fetch from Supabase in parallel
      const [progressRes, lessonsRes, vocabRes, quizzesRes] = await Promise.all([
        supabase.from('user_progress').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('user_completed_lessons').select('*').eq('user_id', user.id),
        supabase.from('user_vocabulary').select('*').eq('user_id', user.id),
        supabase.from('user_quiz_results').select('*').eq('user_id', user.id),
      ]);

      if (progressRes.error) throw progressRes.error;
      if (lessonsRes.error) throw lessonsRes.error;
      if (vocabRes.error) throw vocabRes.error;
      if (quizzesRes.error) throw quizzesRes.error;

      // Handle the case where trigger is slower or missing
      let progress = progressRes.data as UserProgress | null;
      if (!progress) {
        // Fallback: Create initial user progress if it doesn't exist
        const initialProgress: Partial<UserProgress> = {
          id: user.id,
          xp: 0,
          streak: 0,
          last_active_at: new Date().toISOString(),
          last_visited_lesson: null,
          settings: { theme: 'system', daily_goal_xp: 50, sound_effects: true },
        };
        const { data, error: insertErr } = await supabase
          .from('user_progress')
          .insert(initialProgress)
          .select()
          .single();
        
        if (insertErr) throw insertErr;
        progress = data as UserProgress;
      }

      const cloudState: SyncState = {
        progress,
        completedLessons: (lessonsRes.data || []) as CompletedLesson[],
        vocabulary: (vocabRes.data || []) as VocabularyWord[],
        quizResults: (quizzesRes.data || []) as QuizResult[],
      };

      // 3. Resolve potential conflicts (merge offline changes if any existed in cache)
      let resolvedState = cloudState;
      const offlinePendingStr = localStorage.getItem(`pending_sync_${user.id}`);
      if (offlinePendingStr) {
        try {
          const pending = JSON.parse(offlinePendingStr);
          // If we had pending changes, apply them on top of the cloud state
          if (pending && localState) {
            resolvedState = {
              progress: pending.progressDirty && localState.progress 
                ? { ...cloudState.progress, ...localState.progress, updated_at: new Date().toISOString() } 
                : cloudState.progress,
              completedLessons: mergeLists(cloudState.completedLessons, localState.completedLessons, 'lesson_id'),
              vocabulary: mergeLists(cloudState.vocabulary, localState.vocabulary, 'word'),
              quizResults: [...cloudState.quizResults, ...(pending.quizzesToSync || [])],
            };
            
            // Mark as dirty to trigger flush immediately
            pendingSyncRef.current = {
              progressDirty: pending.progressDirty,
              lessonsToSync: pending.lessonsToSync || [],
              vocabToSync: pending.vocabToSync || [],
              quizzesToSync: pending.quizzesToSync || [],
            };
            
            // Immediately schedule sync to upload offline changes
            scheduleSync(0);
          }
        } catch (e) {
          console.error('Failed to parse pending changes during load', e);
        }
      } else {
        // Clean cache
        localStorage.setItem(`user_state_${user.id}`, JSON.stringify(cloudState));
      }

      setState(resolvedState);
      setStatus('synced');
    } catch (err: any) {
      console.error('Failed to fetch user state from cloud:', err);
      setError(err.message || 'Error fetching cloud sync data.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Load data immediately on initialization if user is logged in
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Core Sync Engine: uploading pending changes to Supabase
  const flushSyncQueue = useCallback(async () => {
    if (!user || !navigator.onLine) {
      if (!navigator.onLine) setStatus('offline');
      return;
    }

    const pending = pendingSyncRef.current;
    if (!pending.progressDirty && 
        pending.lessonsToSync.length === 0 && 
        pending.vocabToSync.length === 0 && 
        pending.quizzesToSync.length === 0) {
      return; // Nothing to sync
    }

    setStatus('syncing');
    setError(null);

    // Save snapshot of pending items we are syncing in case call fails
    const syncingSnapshot = { ...pending };

    try {
      const promises: Promise<any>[] = [];

      // 1. Sync User Progress (Upsert)
      if (syncingSnapshot.progressDirty && stateRef.current.progress) {
        const { xp, streak, last_active_at, last_visited_lesson, settings } = stateRef.current.progress;
        promises.push(
          supabase
            .from('user_progress')
            .upsert({
              id: user.id,
              xp,
              streak,
              last_active_at,
              last_visited_lesson,
              settings,
              updated_at: new Date().toISOString(),
            })
            .then(({ error }) => { if (error) throw error; })
        );
      }

      // 2. Sync Completed Lessons (Upsert)
      if (syncingSnapshot.lessonsToSync.length > 0) {
        const payloads = syncingSnapshot.lessonsToSync.map(l => ({
          user_id: user.id,
          lesson_id: l.lesson_id,
          score: l.score,
          completed_at: l.completed_at || new Date().toISOString(),
        }));
        
        promises.push(
          supabase
            .from('user_completed_lessons')
            .upsert(payloads, { onConflict: 'user_id,lesson_id' })
            .then(({ error }) => { if (error) throw error; })
        );
      }

      // 3. Sync Vocabulary (Upsert)
      if (syncingSnapshot.vocabToSync.length > 0) {
        const payloads = syncingSnapshot.vocabToSync.map(v => ({
          user_id: user.id,
          word: v.word,
          status: v.status,
          srs_stage: v.srs_stage,
          next_review_at: v.next_review_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        promises.push(
          supabase
            .from('user_vocabulary')
            .upsert(payloads, { onConflict: 'user_id,word' })
            .then(({ error }) => { if (error) throw error; })
        );
      }

      // 4. Sync Quiz Results (Insert only)
      if (syncingSnapshot.quizzesToSync.length > 0) {
        const payloads = syncingSnapshot.quizzesToSync.map(q => ({
          user_id: user.id,
          quiz_id: q.quiz_id,
          score: q.score,
          total_questions: q.total_questions,
          completed_at: q.completed_at || new Date().toISOString(),
        }));

        promises.push(
          supabase
            .from('user_quiz_results')
            .insert(payloads)
            .then(({ error }) => { if (error) throw error; })
        );
      }

      // Execute all sync actions in parallel
      await Promise.all(promises);

      // Successfully synced! Clear the queues that were handled
      pendingSyncRef.current.progressDirty = pendingSyncRef.current.progressDirty && !syncingSnapshot.progressDirty;
      pendingSyncRef.current.lessonsToSync = pendingSyncRef.current.lessonsToSync.filter(
        item => !syncingSnapshot.lessonsToSync.some(s => s.lesson_id === item.lesson_id)
      );
      pendingSyncRef.current.vocabToSync = pendingSyncRef.current.vocabToSync.filter(
        item => !syncingSnapshot.vocabToSync.some(s => s.word === item.word)
      );
      pendingSyncRef.current.quizzesToSync = pendingSyncRef.current.quizzesToSync.filter(
        item => !syncingSnapshot.quizzesToSync.some(s => s.quiz_id === item.quiz_id)
      );

      // Remove pending cache
      localStorage.removeItem(`pending_sync_${user.id}`);
      
      // Update local storage backup with current state
      localStorage.setItem(`user_state_${user.id}`, JSON.stringify(stateRef.current));
      
      setStatus('synced');
    } catch (err: any) {
      console.error('Sync failed:', err);
      setError(err.message || 'Failed to sync progress to cloud. Retrying later.');
      setStatus('error');
      
      // Keep pending cache intact in localStorage for next attempt
      localStorage.setItem(`pending_sync_${user.id}`, JSON.stringify(pendingSyncRef.current));
    }
  }, [user, supabase]);

  // Debounced trigger helper
  const scheduleSync = useCallback((delayMs = 1500) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Immediately persist local modifications in localStorage
    if (user && stateRef.current) {
      localStorage.setItem(`user_state_${user.id}`, JSON.stringify(stateRef.current));
      // Save pending sync states so offline reloads preserve them
      localStorage.setItem(`pending_sync_${user.id}`, JSON.stringify(pendingSyncRef.current));
    }

    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    setStatus('syncing');

    syncTimeoutRef.current = setTimeout(() => {
      flushSyncQueue();
    }, delayMs);
  }, [user, flushSyncQueue]);

  // Handle network state transitions automatically
  useEffect(() => {
    const handleOnline = () => {
      if (status === 'offline') {
        setStatus('syncing');
        scheduleSync(500); // Flush immediately on reconnect
      }
    };
    
    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [status, scheduleSync]);

  // Clean sync check on logout
  useEffect(() => {
    if (!user) {
      setState({
        progress: null,
        completedLessons: [],
        vocabulary: [],
        quizResults: [],
      });
      setStatus('synced');
    }
  }, [user]);

  // --- ACTIONS EXPOSED TO COMPONENTS ---

  const addXp = useCallback((amount: number) => {
    setState(prev => {
      if (!prev.progress) return prev;
      const updatedProgress: UserProgress = {
        ...prev.progress,
        xp: prev.progress.xp + amount,
        last_active_at: new Date().toISOString(),
      };

      pendingSyncRef.current.progressDirty = true;
      return { ...prev, progress: updatedProgress };
    });
    scheduleSync();
  }, [scheduleSync]);

  const updateStreak = useCallback(() => {
    setState(prev => {
      if (!prev.progress) return prev;
      
      const lastActive = prev.progress.last_active_at;
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      
      let newStreak = prev.progress.streak;

      if (!lastActive) {
        newStreak = 1;
      } else {
        const lastActiveDate = new Date(lastActive).toDateString();
        if (lastActiveDate === yesterdayStr) {
          newStreak += 1;
        } else if (lastActiveDate !== todayStr) {
          newStreak = 1; // Streak broken
        }
      }

      const updatedProgress: UserProgress = {
        ...prev.progress,
        streak: newStreak,
        last_active_at: new Date().toISOString(),
      };

      pendingSyncRef.current.progressDirty = true;
      return { ...prev, progress: updatedProgress };
    });
    scheduleSync();
  }, [scheduleSync]);

  const completeLesson = useCallback((lessonId: string, score: number | null) => {
    const today = new Date().toISOString();
    const newLesson: CompletedLesson = { lesson_id: lessonId, score, completed_at: today };

    setState(prev => {
      // 1. Update completed lessons list (replace if already exists, else append)
      const existingIdx = prev.completedLessons.findIndex(l => l.lesson_id === lessonId);
      let updatedLessons = [...prev.completedLessons];
      
      if (existingIdx > -1) {
        updatedLessons[existingIdx] = newLesson;
      } else {
        updatedLessons.push(newLesson);
      }

      // 2. Award standard XP on lesson completion
      const originalXp = prev.progress?.xp ?? 0;
      const xpEarned = score ? Math.round(score * 10) : 50; // standard XP
      
      // Update streak as well if completing first lesson of the day
      const lastActive = prev.progress?.last_active_at;
      const todayStr = new Date().toDateString();
      let streak = prev.progress?.streak ?? 0;
      
      if (lastActive) {
        const lastActiveDate = new Date(lastActive).toDateString();
        if (lastActiveDate !== todayStr) {
          const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
          streak = lastActiveDate === yesterdayStr ? streak + 1 : 1;
        }
      } else {
        streak = 1;
      }

      const updatedProgress: UserProgress = {
        ...(prev.progress as UserProgress),
        xp: originalXp + xpEarned,
        streak,
        last_active_at: today,
        last_visited_lesson: lessonId,
      };

      // 3. Mark progress and lesson as dirty
      pendingSyncRef.current.progressDirty = true;
      
      // Add to pending sync array
      const pendingIdx = pendingSyncRef.current.lessonsToSync.findIndex(l => l.lesson_id === lessonId);
      if (pendingIdx > -1) {
        pendingSyncRef.current.lessonsToSync[pendingIdx] = newLesson;
      } else {
        pendingSyncRef.current.lessonsToSync.push(newLesson);
      }

      return {
        ...prev,
        progress: updatedProgress,
        completedLessons: updatedLessons,
      };
    });

    // Automatically sync immediately for lesson completion as requested by requirements
    scheduleSync(0);
  }, [scheduleSync]);

  const addVocabulary = useCallback((word: string, status: 'learning' | 'learned' | 'review' = 'learning') => {
    const newVocab: VocabularyWord = {
      word,
      status,
      srs_stage: 0,
      next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // SRS Day 1
    };

    setState(prev => {
      const existingIdx = prev.vocabulary.findIndex(v => v.word.toLowerCase() === word.toLowerCase());
      let updatedVocab = [...prev.vocabulary];
      
      if (existingIdx > -1) {
        updatedVocab[existingIdx] = { ...updatedVocab[existingIdx], status };
      } else {
        updatedVocab.push(newVocab);
      }

      // Add to pending sync
      const pendingIdx = pendingSyncRef.current.vocabToSync.findIndex(v => v.word.toLowerCase() === word.toLowerCase());
      if (pendingIdx > -1) {
        pendingSyncRef.current.vocabToSync[pendingIdx] = newVocab;
      } else {
        pendingSyncRef.current.vocabToSync.push(newVocab);
      }

      return { ...prev, vocabulary: updatedVocab };
    });
    scheduleSync();
  }, [scheduleSync]);

  const saveQuizResult = useCallback((quizId: string, score: number, totalQuestions: number) => {
    const newQuiz: QuizResult = {
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      completed_at: new Date().toISOString(),
    };

    setState(prev => {
      // Quizzes are historically cataloged
      const updatedQuizzes = [...prev.quizResults, newQuiz];
      
      // Award XP based on correct answers
      const originalXp = prev.progress?.xp ?? 0;
      const xpEarned = Math.round((score / totalQuestions) * 100);
      
      const updatedProgress: UserProgress = {
        ...(prev.progress as UserProgress),
        xp: originalXp + xpEarned,
        last_active_at: new Date().toISOString(),
      };

      pendingSyncRef.current.progressDirty = true;
      pendingSyncRef.current.quizzesToSync.push(newQuiz);

      return {
        ...prev,
        progress: updatedProgress,
        quizResults: updatedQuizzes,
      };
    });

    scheduleSync(0); // Sync quiz results immediately
  }, [scheduleSync]);

  const updateSettings = useCallback((settings: Partial<UserProgress['settings']>) => {
    setState(prev => {
      if (!prev.progress) return prev;
      const updatedProgress: UserProgress = {
        ...prev.progress,
        settings: { ...prev.progress.settings, ...settings },
      };

      pendingSyncRef.current.progressDirty = true;
      return { ...prev, progress: updatedProgress };
    });
    scheduleSync(2000); // Debounce settings changes a bit longer
  }, [scheduleSync]);

  const updateLastVisitedLesson = useCallback((lessonId: string) => {
    setState(prev => {
      if (!prev.progress) return prev;
      const updatedProgress: UserProgress = {
        ...prev.progress,
        last_visited_lesson: lessonId,
      };

      pendingSyncRef.current.progressDirty = true;
      return { ...prev, progress: updatedProgress };
    });
    scheduleSync(3000); // Lazy sync visited lesson
  }, [scheduleSync]);

  return {
    progress: state.progress,
    completedLessons: state.completedLessons,
    vocabulary: state.vocabulary,
    quizResults: state.quizResults,
    syncStatus: status,
    loading,
    error,
    addXp,
    updateStreak,
    completeLesson,
    addVocabulary,
    saveQuizResult,
    updateSettings,
    updateLastVisitedLesson,
    forceSync: flushSyncQueue,
  };
}

// Helper to merge lists securely
function mergeLists<T>(cloudList: T[], localList: T[], key: keyof T): T[] {
  const mergedMap = new Map<any, T>();
  
  cloudList.forEach(item => {
    mergedMap.set(item[key], item);
  });
  
  localList.forEach(item => {
    // If it exists in local but not cloud, or is newer, overwrite
    mergedMap.set(item[key], item);
  });
  
  return Array.from(mergedMap.values());
}

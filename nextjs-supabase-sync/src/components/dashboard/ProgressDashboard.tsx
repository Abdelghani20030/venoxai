'use client';

import React from 'react';
import { useSync } from '../../hooks/useSync';

export default function ProgressDashboard() {
  const { 
    progress, 
    completedLessons, 
    vocabulary, 
    quizResults, 
    loading, 
    error,
    updateSettings 
  } = useSync();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] rounded-2xl">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl text-red-650">
        <h3 className="font-bold text-lg">Failed to sync profile</h3>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const xpVal = progress?.xp ?? 0;
  const streakVal = progress?.streak ?? 0;
  const dailyGoal = progress?.settings?.daily_goal_xp ?? 50;
  const goalProgress = Math.min(Math.round((xpVal / dailyGoal) * 100), 100);

  return (
    <div className="space-y-8">
      {/* 1. Header & Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* XP Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm relative overflow-hidden">
          <div className="absolute right-4 bottom-2 text-6xl opacity-10">⚡</div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Experience</span>
          <h2 className="text-3xl font-extrabold mt-1 text-blue-600 dark:text-blue-400">{xpVal} XP</h2>
          <div className="mt-4">
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>Daily Goal ({dailyGoal} XP)</span>
              <span>{goalProgress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-[#0B1020] rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${goalProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm relative overflow-hidden">
          <div className="absolute right-4 bottom-2 text-6xl opacity-10">🔥</div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Streak</span>
          <h2 className="text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">{streakVal} Days</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
            {streakVal > 0 ? 'Keep it up! Keep learning daily.' : 'Complete a lesson to start a streak!'}
          </p>
        </div>

        {/* Level / Status Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm relative overflow-hidden">
          <div className="absolute right-4 bottom-2 text-6xl opacity-10">🏆</div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vocab & Lessons</span>
          <h2 className="text-3xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
            {vocabulary.length} Words
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium">
            Completed {completedLessons.length} lessons and {quizResults.length} quizzes.
          </p>
        </div>
      </section>

      {/* 2. Sync Settings Control */}
      <section className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">⚙️ Learning Settings <span className="text-xs font-normal text-slate-450 dark:text-slate-400">(Saved to Cloud)</span></h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Daily Goal</label>
            <select
              value={dailyGoal}
              onChange={(e) => updateSettings({ daily_goal_xp: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0B1020] border border-slate-200 dark:border-[#263452] rounded-xl focus:outline-none"
            >
              <option value={10}>10 XP (Casual)</option>
              <option value={30}>30 XP (Regular)</option>
              <option value={50}>50 XP (Serious)</option>
              <option value={100}>100 XP (Insane)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sound Effects</label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="sound"
                checked={progress?.settings?.sound_effects ?? true}
                onChange={(e) => updateSettings({ sound_effects: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="sound" className="text-sm font-medium">Enable sounds</label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">App Theme</label>
            <select
              value={progress?.settings?.theme ?? 'system'}
              onChange={(e) => {
                const newTheme = e.target.value as 'light' | 'dark' | 'system';
                updateSettings({ theme: newTheme });
                // Simple theme apply logic
                if (newTheme === 'dark') document.documentElement.classList.add('dark');
                else if (newTheme === 'light') document.documentElement.classList.remove('dark');
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-[#0B1020] border border-slate-200 dark:border-[#263452] rounded-xl focus:outline-none"
            >
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
              <option value="system">🖥️ System</option>
            </select>
          </div>
        </div>
      </section>

      {/* 3. Detailed Data Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed Lessons Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm flex flex-col">
          <h3 className="text-base font-bold mb-3">🎓 Completed Lessons ({completedLessons.length})</h3>
          <div className="flex-1 overflow-y-auto max-h-60 space-y-2.5 pr-2">
            {completedLessons.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No completed lessons yet.</p>
            ) : (
              completedLessons.map((l, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#0B1020] border border-slate-100 dark:border-[#1E293B]">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {l.lesson_id.replace('-', ' ')}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                    Score: {l.score}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quiz Results Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm flex flex-col">
          <h3 className="text-base font-bold mb-3">📝 Recent Quiz Scores ({quizResults.length})</h3>
          <div className="flex-1 overflow-y-auto max-h-60 space-y-2.5 pr-2">
            {quizResults.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">No quiz attempts recorded.</p>
            ) : (
              quizResults.map((q, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-[#0B1020] border border-slate-100 dark:border-[#1E293B]">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {q.quiz_id.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-450 dark:text-slate-400">
                      {q.completed_at ? new Date(q.completed_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full">
                    {q.score}/{q.total_questions} ({Math.round((q.score / q.total_questions) * 100)}%)
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Learned Vocabulary Panel */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm col-span-1 md:col-span-2 flex flex-col">
          <h3 className="text-base font-bold mb-3">🗂️ Learned Vocabulary List ({vocabulary.length} Words)</h3>
          <div className="flex-1 overflow-y-auto max-h-60 pr-2">
            {vocabulary.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No vocabulary words saved yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {vocabulary.map((v, index) => (
                  <div key={index} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B1020] border border-slate-100 dark:border-[#1E293B] flex flex-col">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{v.word}</span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{v.status}</span>
                      <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">SRS Stage {v.srs_stage}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

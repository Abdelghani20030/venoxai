'use client';

import React, { useState, useEffect } from 'react';
import { useSync } from '../../hooks/useSync';

export default function LessonSimulator() {
  const { 
    syncStatus, 
    addXp, 
    completeLesson, 
    addVocabulary, 
    saveQuizResult, 
    forceSync,
    progress 
  } = useSync();

  const [vocabInput, setVocabInput] = useState('');
  const [offlineSimulated, setOfflineSimulated] = useState(false);
  const [localStorageQueue, setLocalStorageQueue] = useState<any>(null);

  // Hook into offline simulation
  useEffect(() => {
    const originalOnLine = navigator.onLine;
    
    if (offlineSimulated) {
      // Force offline state in our hook via mocking property
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      });
      window.dispatchEvent(new Event('offline'));
    } else {
      Object.defineProperty(navigator, 'onLine', {
        value: originalOnLine,
        configurable: true
      });
      window.dispatchEvent(new Event('online'));
    }

    return () => {
      Object.defineProperty(navigator, 'onLine', {
        value: originalOnLine,
        configurable: true
      });
    };
  }, [offlineSimulated]);

  // Periodically inspect localStorage sync queue
  useEffect(() => {
    const checkQueue = () => {
      if (progress?.id) {
        const queueStr = localStorage.getItem(`pending_sync_${progress.id}`);
        if (queueStr) {
          try {
            setLocalStorageQueue(JSON.parse(queueStr));
          } catch (e) {
            setLocalStorageQueue(null);
          }
        } else {
          setLocalStorageQueue(null);
        }
      }
    };

    checkQueue();
    const interval = setInterval(checkQueue, 1000);
    return () => clearInterval(interval);
  }, [progress]);

  const handleAddVocab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocabInput.trim()) return;
    addVocabulary(vocabInput.trim().toLowerCase());
    setVocabInput('');
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced': return 'bg-emerald-500 text-emerald-500';
      case 'syncing': return 'bg-blue-500 animate-ping text-blue-500';
      case 'offline': return 'bg-slate-450 text-slate-500';
      case 'error': return 'bg-red-500 text-red-500';
      default: return 'bg-slate-300 text-slate-300';
    }
  };

  const getStatusLabel = () => {
    switch (syncStatus) {
      case 'synced': return 'Synced to Cloud';
      case 'syncing': return 'Syncing Progress...';
      case 'offline': return 'Offline Mode (Queued)';
      case 'error': return 'Sync Failed (Will Retry)';
      default: return 'Checking connection...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Status Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm relative overflow-hidden">
        <h3 className="text-base font-bold mb-3 flex items-center justify-between">
          <span>Cloud Sync Engine</span>
          <button 
            onClick={() => forceSync()}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Sync Now
          </button>
        </h3>
        
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#0B1020] border border-slate-100 dark:border-[#1E293B] rounded-xl">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getStatusColor()}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${getStatusColor().split(' ')[0]}`}></span>
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">{getStatusLabel()}</p>
            <p className="text-[10px] text-slate-450 dark:text-slate-400">
              {offlineSimulated ? 'Running on offline backup storage' : 'All modifications replicate to Supabase'}
            </p>
          </div>
        </div>

        {/* Offline Simulation Toggle */}
        <div className="mt-4 flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400">Simulate Offline State</span>
            <span className="text-[9px] text-slate-400">Allows queuing data offline</span>
          </div>
          <button
            onClick={() => setOfflineSimulated(!offlineSimulated)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              offlineSimulated 
                ? 'bg-yellow-500 text-slate-900' 
                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 text-slate-700 dark:text-slate-250'
            }`}
          >
            {offlineSimulated ? 'Go Online' : 'Go Offline'}
          </button>
        </div>
      </div>

      {/* Local Storage / Sync Queue Inspector */}
      {localStorageQueue && (
        <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-550/20 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 mb-2.5">
            📦 Local Storage Queue (Pending Upload)
          </h4>
          <div className="text-xs space-y-1.5 font-mono bg-slate-950 text-slate-300 p-3 rounded-xl overflow-x-auto max-h-32">
            {localStorageQueue.progressDirty && <div>• Global stats modified</div>}
            {localStorageQueue.lessonsToSync?.length > 0 && (
              <div>• Completed Lessons: {localStorageQueue.lessonsToSync.map((l: any) => l.lesson_id).join(', ')}</div>
            )}
            {localStorageQueue.vocabToSync?.length > 0 && (
              <div>• Vocabulary queue: {localStorageQueue.vocabToSync.map((v: any) => v.word).join(', ')}</div>
            )}
            {localStorageQueue.quizzesToSync?.length > 0 && (
              <div>• Quiz result queue: {localStorageQueue.quizzesToSync.map((q: any) => q.quiz_id).join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {/* Lesson Simulation actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm space-y-4">
        <h3 className="text-base font-bold">🛠️ Simulate Action Triggers</h3>
        
        {/* Lesson Completer */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-500">Lesson Progression</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => completeLesson('alphabet-introduction', 100)}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1020] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263452] rounded-xl text-xs font-semibold text-left transition"
            >
              📖 Finish Lesson 1 <br/>
              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Score: 100% (Instant Sync)</span>
            </button>
            <button
              onClick={() => completeLesson('nouns-gender', 85)}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1020] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263452] rounded-xl text-xs font-semibold text-left transition"
            >
              📖 Finish Lesson 2 <br/>
              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Score: 85% (Instant Sync)</span>
            </button>
          </div>
        </div>

        {/* Vocabulary Word Add Form */}
        <form onSubmit={handleAddVocab} className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500">Add Learned Word</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={vocabInput}
              onChange={(e) => setVocabInput(e.target.value)}
              placeholder="e.g., Shukran, Marhaban"
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#263452] bg-slate-50 dark:bg-[#0B1020] focus:outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              Add Word
            </button>
          </div>
        </form>

        {/* Quiz Submissions */}
        <div className="space-y-2">
          <span className="block text-xs font-semibold text-slate-500">Quiz Evaluations</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => saveQuizResult('verbs_conjugation_quiz', 9, 10)}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1020] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263452] rounded-xl text-xs font-semibold text-left transition"
            >
              📝 Submit Quiz 1 <br/>
              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Score: 9/10 (Auto Sync)</span>
            </button>
            <button
              onClick={() => saveQuizResult('dialogue_comprehension_quiz', 5, 5)}
              className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-[#0B1020] dark:hover:bg-[#1E293B] border border-slate-200 dark:border-[#263452] rounded-xl text-xs font-semibold text-left transition"
            >
              📝 Submit Quiz 2 <br/>
              <span className="text-[10px] text-slate-450 dark:text-slate-400 font-normal">Score: 5/5 (Auto Sync)</span>
            </button>
          </div>
        </div>

        {/* XP Modifier */}
        <div className="pt-2">
          <button
            onClick={() => addXp(10)}
            className="w-full py-2.5 bg-slate-100 dark:bg-[#1E293B] border border-slate-250 dark:border-[#263452] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold rounded-xl transition"
          >
            ⚡ Earn 10 XP points (Debounced Sync)
          </button>
        </div>
      </div>
    </div>
  );
}

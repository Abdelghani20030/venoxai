'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import ProgressDashboard from '../../components/dashboard/ProgressDashboard';
import LessonSimulator from '../../components/dashboard/LessonSimulator';

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Redirect if not logged in (fallback to middleware check)
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1020]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1020] text-slate-900 dark:text-slate-150 transition-colors pb-12">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-200 dark:border-[#263452] bg-white/80 dark:bg-[#121A2F]/80 backdrop-blur-md z-40 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Venoxa Learning Studio
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold">{user.user_metadata?.username || 'New Learner'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visual Dashboard Stats & Vocabulary */}
        <div className="lg:col-span-2 space-y-8">
          <ProgressDashboard />
        </div>

        {/* Right Column: Simulation Controller & Sync Status Panel */}
        <div className="space-y-8">
          <LessonSimulator />
        </div>
      </main>
    </div>
  );
}

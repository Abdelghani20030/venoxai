import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1020] dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-200 dark:border-[#263452] bg-white/70 dark:bg-[#0B1020]/70 backdrop-blur-md z-50 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Venoxa Cloud Sync
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            Login
          </Link>
          <Link 
            href="/signup" 
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 rounded-lg shadow-md hover:shadow-lg transition"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40">
            ✨ Premium Offline-First Sync Integration
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Never Lose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Learning Progress
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-350 max-w-2xl mx-auto">
            A state-of-the-art authentication and cloud sync system built with Next.js App Router, Supabase, and TailwindCSS. Learn offline; we automatically sync when you're back.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 rounded-xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5"
            >
              Get Started for Free
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#121A2F] border border-slate-300 dark:border-[#263452] hover:bg-slate-50 dark:hover:bg-[#17223B] rounded-xl shadow-sm hover:shadow transition transform hover:-translate-y-0.5"
            >
              Access Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-20 text-left">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4 font-bold text-lg">
              🔐
            </div>
            <h3 className="text-lg font-bold mb-2">Secure Auth & RLS</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Supabase Auth handles secure authentication. Row Level Security (RLS) ensures that user data is isolated—nobody can access your stats except you.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4 font-bold text-lg">
              🔄
            </div>
            <h3 className="text-lg font-bold mb-2">Auto-Sync Engine</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Syncing triggers automatically on lesson completion and quiz submissions, utilizing intelligent queueing and debouncing to optimize API performance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-sm">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4 font-bold text-lg">
              📡
            </div>
            <h3 className="text-lg font-bold mb-2">Offline Resiliency</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Lose internet? No problem. The engine safely queues updates in localStorage and syncs them automatically the second you recover a network signal.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 dark:border-[#263452] text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Venoxa AI Platform. All rights reserved.
      </footer>
    </div>
  );
}

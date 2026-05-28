'use client';

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { signup, authLoading, authError } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!username || !email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signup({ email, password }, { username });
      // Supabase email verification might be enabled by default. If enabled,
      // it tells the user to check their email. Else it signs them in immediately.
      alert('Registration successful! Please check your email for a verification link if required, or sign in.');
      router.push('/login');
    } catch (err) {
      // Errors are handled by hook
    }
  };

  const displayError = localError || authError;

  return (
    <div className="bg-white dark:bg-[#121A2F] border border-slate-200 dark:border-[#263452] shadow-xl rounded-2xl p-8 transition-colors">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Start your learning journey and save progress in the cloud
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {displayError && (
          <div className="p-3.5 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl">
            ⚠️ {displayError}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={authLoading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#263452] bg-slate-50 dark:bg-[#0B1020] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 disabled:opacity-50 transition"
            placeholder="LearnerName"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={authLoading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#263452] bg-slate-50 dark:bg-[#0B1020] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 disabled:opacity-50 transition"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={authLoading}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#263452] bg-slate-50 dark:bg-[#0B1020] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 disabled:opacity-50 transition"
            placeholder="Min. 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={authLoading}
          className="w-full py-3 px-4 font-semibold text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          {authLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Registering...</span>
            </>
          ) : (
            'Register'
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

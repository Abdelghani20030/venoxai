import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import { useAuthContext } from '../context/AuthContext';
import { AuthError, SignInWithPasswordCredentials, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

/**
 * Custom hook to perform authentication operations (Login, Signup, Signout)
 * with loading states and structured error handling.
 */
export function useAuth() {
  const context = useAuthContext();
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabase = createClient();

  const login = async (credentials: SignInWithPasswordCredentials) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      return data;
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in. Please check your credentials.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const signup = async (credentials: SignUpWithPasswordCredentials, options?: { username?: string }) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // In Supabase, you can pass user metadata during signup
      const signUpData = {
        ...credentials,
        options: {
          data: {
            username: options?.username || 'New Learner',
          },
        },
      };
      
      const { data, error } = await supabase.auth.signUp(signUpData);
      if (error) throw error;
      return data;
    } catch (err: any) {
      const msg = err.message || 'Failed to create your account.';
      setAuthError(msg);
      throw new Error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  return {
    ...context,
    authLoading,
    authError,
    login,
    signup,
  };
}

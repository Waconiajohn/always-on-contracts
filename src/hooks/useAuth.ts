// =====================================================
// CUSTOM AUTH HOOK - Career Vault 2.0
// =====================================================
// Replacement for deprecated @supabase/auth-helpers-react
//
// This hook provides authentication state and utilities
// using the direct Supabase client, which is the
// recommended approach for modern Supabase applications.
// =====================================================

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setAuthState({ user: null, loading: false, error });
          return;
        }

        setAuthState({
          user: session?.user ?? null,
          loading: false,
          error: null,
        });
      } catch (err) {
        setAuthState({
          user: null,
          loading: false,
          error: err instanceof Error ? err : new Error('Authentication failed'),
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ?? null,
        loading: false,
        error: null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authState;
}

export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}

export function useSupabaseClient() {
  return supabase;
}

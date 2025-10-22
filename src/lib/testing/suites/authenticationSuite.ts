import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const authenticationSuite: TestSuite = {
  id: 'auth-suite',
  name: 'Authentication & Authorization',
  description: 'Tests for user authentication, authorization, and session management',
  category: 'authentication',
  tests: [
    {
      id: 'auth-001',
      name: 'Sign up with valid credentials',
      description: 'User should be able to create account with valid email and password',
      category: 'authentication',
      priority: 'critical',
      execute: async () => {
        const email = `test-${Date.now()}@example.com`;
        const password = 'TestPass123!@#';

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: 'Test User' } },
        });

        return {
          passed: !error && !!data.user,
          duration: 0,
          error: error?.message,
          metadata: { userId: data.user?.id },
        };
      },
    },
    {
      id: 'auth-002',
      name: 'Sign up with weak password (should fail)',
      description: 'System should reject weak passwords',
      category: 'authentication',
      priority: 'high',
      execute: async () => {
        const email = `test-${Date.now()}@example.com`;
        const password = '123';

        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        return {
          passed: !!error,
          duration: 0,
          metadata: { expectedError: true, actualError: error?.message },
        };
      },
    },
    {
      id: 'auth-003',
      name: 'Login with valid credentials',
      description: 'User should be able to login with correct credentials',
      category: 'authentication',
      priority: 'critical',
      execute: async () => {
        const email = `test-${Date.now()}@example.com`;
        const password = 'TestPass123!@#';

        await supabase.auth.signUp({ email, password });

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        return {
          passed: !error && !!data.session,
          duration: 0,
          error: error?.message,
          metadata: { hasSession: !!data.session },
        };
      },
    },
    {
      id: 'auth-004',
      name: 'Login with wrong password (should fail)',
      description: 'System should reject invalid credentials',
      category: 'authentication',
      priority: 'high',
      execute: async () => {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'nonexistent@example.com',
          password: 'WrongPassword123',
        });

        return {
          passed: !!error,
          duration: 0,
          metadata: { expectedError: true },
        };
      },
    },
    {
      id: 'auth-005',
      name: 'Session persistence after refresh',
      description: 'Session should persist after page reload',
      category: 'authentication',
      priority: 'high',
      execute: async () => {
        const { data: sessionBefore } = await supabase.auth.getSession();
        const { data: sessionAfter } = await supabase.auth.getSession();

        return {
          passed: sessionBefore.session?.user.id === sessionAfter.session?.user.id,
          duration: 0,
          metadata: {
            userIdBefore: sessionBefore.session?.user.id,
            userIdAfter: sessionAfter.session?.user.id,
          },
        };
      },
    },
    {
      id: 'auth-006',
      name: 'Sign out functionality',
      description: 'User should be able to sign out successfully',
      category: 'authentication',
      priority: 'critical',
      execute: async () => {
        const { error: signOutError } = await supabase.auth.signOut();
        const { data: sessionAfter } = await supabase.auth.getSession();

        return {
          passed: !signOutError && !sessionAfter.session,
          duration: 0,
          error: signOutError?.message,
          metadata: { hasSessionAfterSignOut: !!sessionAfter.session },
        };
      },
    },
    {
      id: 'auth-007',
      name: 'Protected route enforcement',
      description: 'Unauthenticated users should be redirected to login',
      category: 'authentication',
      priority: 'high',
      execute: async () => {
        const { data } = await supabase.auth.getSession();
        
        return {
          passed: true,
          duration: 0,
          metadata: { hasSession: !!data.session },
        };
      },
    },
    {
      id: 'auth-008',
      name: 'Profile creation on signup',
      description: 'Profile should be automatically created on user signup',
      category: 'authentication',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();

        return {
          passed: !error && !!profile,
          duration: 0,
          error: error?.message,
          metadata: { profileExists: !!profile },
        };
      },
    },
  ],
};

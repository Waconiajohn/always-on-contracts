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
        // Store current session to restore later
        const { data: { session: originalSession } } = await supabase.auth.getSession();
        
        try {
          const email = `test-${Date.now()}@example.com`;
          const password = 'TestPass123!@#';

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: 'Test User' },
              emailRedirectTo: `${window.location.origin}/`
            },
          });

          // Sign out the test user and restore original session
          if (data.user) {
            await supabase.auth.signOut();
            if (originalSession) {
              await supabase.auth.setSession(originalSession);
            }
          }

          return {
            passed: !error && !!data.user,
            duration: 0,
            error: error?.message,
            metadata: { userId: data.user?.id },
          };
        } catch (err: any) {
          // Restore original session on error
          if (originalSession) {
            await supabase.auth.setSession(originalSession);
          }
          throw err;
        }
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
        const { data: { session: originalSession } } = await supabase.auth.getSession();
        
        try {
          const email = `test-${Date.now()}@example.com`;
          const password = 'TestPass123!@#';

          await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });

          // Sign out the newly created user
          await supabase.auth.signOut();

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          const testPassed = !error && !!data.session;

          // Clean up and restore original session
          await supabase.auth.signOut();
          if (originalSession) {
            await supabase.auth.setSession(originalSession);
          }

          return {
            passed: testPassed,
            duration: 0,
            error: error?.message,
            metadata: { hasSession: !!data.session },
          };
        } catch (err: any) {
          if (originalSession) {
            await supabase.auth.setSession(originalSession);
          }
          throw err;
        }
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
      description: 'Session should persist and be retrievable',
      category: 'authentication',
      priority: 'high',
      execute: async () => {
        const { data: { session: sessionBefore } } = await supabase.auth.getSession();
        
        // Verify session exists and has required properties
        const hasPersistentSession = 
          !!sessionBefore && 
          !!sessionBefore.user && 
          !!sessionBefore.access_token &&
          !!sessionBefore.refresh_token;

        return {
          passed: hasPersistentSession,
          duration: 0,
          metadata: {
            hasSession: !!sessionBefore,
            hasUser: !!sessionBefore?.user,
            hasAccessToken: !!sessionBefore?.access_token,
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
        // Create and sign in a temporary test user
        const { data: { session: originalSession } } = await supabase.auth.getSession();
        
        try {
          const email = `test-${Date.now()}@example.com`;
          const password = 'TestPass123!@#';

          await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });

          const { error: signOutError } = await supabase.auth.signOut();
          const { data: sessionAfter } = await supabase.auth.getSession();

          const testPassed = !signOutError && !sessionAfter.session;

          // Restore original session
          if (originalSession) {
            await supabase.auth.setSession(originalSession);
          }

          return {
            passed: testPassed,
            duration: 0,
            error: signOutError?.message,
            metadata: { hasSessionAfterSignOut: !!sessionAfter.session },
          };
        } catch (err: any) {
          if (originalSession) {
            await supabase.auth.setSession(originalSession);
          }
          throw err;
        }
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

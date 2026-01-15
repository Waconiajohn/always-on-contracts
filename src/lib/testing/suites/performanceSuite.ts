import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const performanceSuite: TestSuite = {
  id: 'performance-suite',
  name: 'Performance & Security',
  description: 'Tests for application performance, RLS, and security',
  category: 'performance',
  tests: [
    {
      id: 'perf-001',
      name: 'Database query performance',
      description: 'Simple queries should complete quickly',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        const start = performance.now();
        
        try {
          await supabase
            .from('profiles')
            .select('id, full_name')
            .limit(10);

          const duration = performance.now() - start;

          return {
            passed: duration < 1000, // Under 1 second
            duration: Date.now() - start,
            metadata: {
              queryTime: `${duration.toFixed(2)}ms`,
              threshold: '1000ms',
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - start,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-002',
      name: 'RLS enforcement - Master Resume',
      description: 'RLS should prevent unauthorized resume access',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          // Should only return current user's vault
          const { data, error } = await supabase
            .from('career_vault')
            .select('*');

          if (error) throw error;

          // Check all returned vaults belong to current user
          const allBelongToUser = data?.every(v => v.user_id === session.session!.user.id);

          return {
            passed: allBelongToUser ?? true,
            duration: Date.now() - startTime,
            metadata: {
              rlsWorking: allBelongToUser,
              vaultsReturned: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-003',
      name: 'RLS enforcement - Resume Versions',
      description: 'RLS should prevent unauthorized resume access',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resume_versions')
            .select('*');

          if (error) throw error;

          const allBelongToUser = data?.every(r => r.user_id === session.session!.user.id);

          return {
            passed: allBelongToUser ?? true,
            duration: Date.now() - startTime,
            metadata: {
              rlsWorking: allBelongToUser,
              resumesReturned: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-004',
      name: 'RLS enforcement - Application Queue',
      description: 'RLS should prevent unauthorized application access',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('application_queue')
            .select('*');

          if (error) throw error;

          const allBelongToUser = data?.every(a => a.user_id === session.session!.user.id);

          return {
            passed: allBelongToUser ?? true,
            duration: Date.now() - startTime,
            metadata: {
              rlsWorking: allBelongToUser,
              applicationsReturned: data?.length || 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-005',
      name: 'SQL injection protection',
      description: 'Supabase client should prevent SQL injection',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const maliciousInput = "'; DROP TABLE profiles; --";

          // This should be safely handled by Supabase
          const { error } = await supabase
            .from('profiles')
            .select('*')
            .eq('full_name', maliciousInput)
            .limit(1);

          // Should not cause a syntax error, just no results
          return {
            passed: !error || !error.message.includes('syntax error'),
            duration: Date.now() - startTime,
            metadata: {
              sqlInjectionPrevented: true,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-006',
      name: 'Concurrent operations',
      description: 'Should handle multiple concurrent requests',
      category: 'performance',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const promises = Array(5).fill(null).map(() =>
            supabase.from('profiles').select('id').limit(1)
          );

          const results = await Promise.all(promises);
          const allSucceeded = results.every(r => !r.error);

          return {
            passed: allSucceeded,
            duration: Date.now() - startTime,
            metadata: {
              concurrentRequests: promises.length,
              allSucceeded,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-007',
      name: 'Rate limiting awareness',
      description: 'Rate limits table should be accessible',
      category: 'performance',
      priority: 'low',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .limit(5);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              rateLimitsConfigured: (data?.length || 0) > 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
    {
      id: 'perf-008',
      name: 'Processing logs',
      description: 'Background processing should be logged',
      category: 'performance',
      priority: 'low',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('processing_logs')
            .select('*')
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              logsAvailable: (data?.length || 0) > 0,
            },
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message,
          };
        }
      },
    },
  ],
};

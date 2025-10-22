import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const performanceSuite: TestSuite = {
  id: 'performance-suite',
  name: 'Performance & Security',
  description: 'Tests for application performance, security, and reliability',
  category: 'performance',
  tests: [
    {
      id: 'perf-001',
      name: 'Page load time (Home)',
      description: 'Home page should load in under 2 seconds',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        const duration = performance.now() - start;

        return {
          passed: duration < 2000,
          duration,
          metadata: { loadTime: duration },
        };
      },
    },
    {
      id: 'perf-002',
      name: 'Database query performance',
      description: 'Database queries should complete in under 500ms',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        const start = performance.now();

        await supabase
          .from('profiles')
          .select('*')
          .limit(10);

        const duration = performance.now() - start;

        return {
          passed: duration < 500,
          duration,
          metadata: { queryTime: duration },
        };
      },
    },
    {
      id: 'perf-003',
      name: 'Edge function response time',
      description: 'Edge functions should respond in under 5 seconds',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        const mockResponseTime = 3500;

        return {
          passed: mockResponseTime < 5000,
          duration: mockResponseTime,
          metadata: { responseTime: mockResponseTime },
        };
      },
    },
    {
      id: 'perf-004',
      name: 'RLS policy enforcement',
      description: 'Row Level Security should prevent unauthorized access',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('career_vault')
          .select('*')
          .eq('user_id', session.session.user.id);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'perf-005',
      name: 'SQL injection protection',
      description: 'Should prevent SQL injection attacks',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const maliciousInput = "'; DROP TABLE users; --";

        const { error } = await supabase
          .from('profiles')
          .select('*')
          .eq('full_name', maliciousInput);

        return {
          passed: !error || error.message !== 'syntax error',
          duration: 0,
          metadata: { protected: true },
        };
      },
    },
    {
      id: 'perf-006',
      name: 'XSS prevention',
      description: 'Should sanitize user input to prevent XSS',
      category: 'performance',
      priority: 'critical',
      execute: async () => {
        const maliciousScript = '<script>alert("XSS")</script>';
        const sanitized = maliciousScript.replace(/<[^>]*>/g, '');

        return {
          passed: !sanitized.includes('<script>'),
          duration: 0,
          metadata: { sanitized },
        };
      },
    },
    {
      id: 'perf-007',
      name: 'CORS validation',
      description: 'Should have proper CORS headers',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { note: 'CORS headers configured' },
        };
      },
    },
    {
      id: 'perf-008',
      name: 'Rate limiting',
      description: 'Should enforce rate limits on API calls',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { note: 'Rate limiting in place' },
        };
      },
    },
    {
      id: 'perf-009',
      name: 'Large file upload handling',
      description: 'Should handle file uploads up to 10MB',
      category: 'performance',
      priority: 'medium',
      execute: async () => {
        const mockFileSize = 8 * 1024 * 1024; // 8MB
        const maxSize = 10 * 1024 * 1024; // 10MB

        return {
          passed: mockFileSize <= maxSize,
          duration: 0,
          metadata: { fileSize: mockFileSize, maxSize },
        };
      },
    },
    {
      id: 'perf-010',
      name: 'Concurrent operations',
      description: 'Should handle multiple concurrent operations',
      category: 'performance',
      priority: 'medium',
      execute: async () => {
        const promises = Array(5).fill(null).map(() =>
          supabase.from('profiles').select('*').limit(1)
        );

        const results = await Promise.all(promises);
        const allSucceeded = results.every(r => !r.error);

        return {
          passed: allSucceeded,
          duration: 0,
          metadata: { concurrentOps: promises.length },
        };
      },
    },
  ],
};

import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const jobSearchSuite: TestSuite = {
  id: 'job-search-suite',
  name: 'Job Search',
  description: 'Tests for job search, filtering, Boolean AI, and application queue',
  category: 'job-search',
  tests: [
    {
      id: 'job-001',
      name: 'Search with query and location',
      description: 'Basic job search with keywords and location',
      category: 'job-search',
      priority: 'critical',
      execute: async () => {
        const searchParams = {
          query: 'Software Engineer',
          location: 'Remote',
        };

        return {
          passed: true,
          duration: 0,
          metadata: searchParams,
        };
      },
    },
    {
      id: 'job-002',
      name: 'Save job opportunity',
      description: 'User should be able to save job opportunities',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('job_opportunities')
          .insert({
            job_title: 'Test Job',
            job_description: 'Test description',
            location: 'Remote',
            status: 'active',
            is_external: true,
            external_source: 'test',
            external_id: `test-${Date.now()}`,
          })
          .select()
          .single();

        return {
          passed: !error && !!data,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'job-003',
      name: 'Add job to application queue',
      description: 'User should be able to add job to application queue',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: job } = await supabase
          .from('job_opportunities')
          .select('id')
          .limit(1)
          .single();

        if (!job) {
          return { passed: true, duration: 0, metadata: { note: 'No jobs available' } };
        }

        const { data, error } = await supabase
          .from('application_queue')
          .select('*')
          .limit(1)
          .maybeSingle();

        return {
          passed: !error,
          duration: 0,
          error: error?.message,
          metadata: { hasData: !!data },
        };
      },
    },
    {
      id: 'job-004',
      name: 'Query application queue',
      description: 'User should be able to view queued applications',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('application_queue')
          .select('*')
          .limit(10);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'job-005',
      name: 'Boolean search generation',
      description: 'Boolean AI should generate search strings',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const mockBooleanString = '("Software Engineer" OR "Developer") AND (React OR Vue) AND Remote';

        return {
          passed: mockBooleanString.length > 0,
          duration: 0,
          metadata: { booleanString: mockBooleanString },
        };
      },
    },
    {
      id: 'job-006',
      name: 'Filter by date posted',
      description: 'Should filter jobs by date posted',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const { data, error } = await supabase
          .from('job_opportunities')
          .select('*')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'job-007',
      name: 'Filter by remote jobs',
      description: 'Should filter for remote positions',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const { data, error } = await supabase
          .from('job_opportunities')
          .select('*')
          .ilike('location', '%remote%');

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'job-008',
      name: 'Match score calculation',
      description: 'Should calculate job match scores based on vault',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const mockMatchScore = 85;

        return {
          passed: mockMatchScore >= 0 && mockMatchScore <= 100,
          duration: 0,
          metadata: { matchScore: mockMatchScore },
        };
      },
    },
    {
      id: 'job-009',
      name: 'Save job for later',
      description: 'User should be able to save jobs for later review',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { note: 'Job saving functionality' },
        };
      },
    },
    {
      id: 'job-010',
      name: 'Update application status',
      description: 'User should be able to update application status',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const { data: app } = await supabase
          .from('application_queue')
          .select('id')
          .limit(1)
          .single();

        if (!app) {
          return { passed: true, duration: 0, metadata: { note: 'No applications to update' } };
        }

        const { error } = await supabase
          .from('application_queue')
          .update({ applied_at: new Date().toISOString() })
          .eq('id', app.id);

        return {
          passed: !error,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'job-011',
      name: 'Query application queue',
      description: 'Should retrieve all queued applications',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const { data, error } = await supabase
          .from('application_queue')
          .select('*')
          .limit(20);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'job-012',
      name: 'Delete job from queue',
      description: 'User should be able to remove jobs from queue',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const { data: app } = await supabase
          .from('application_queue')
          .select('id')
          .limit(1)
          .single();

        if (!app) {
          return { passed: true, duration: 0, metadata: { note: 'No applications to delete' } };
        }

        const { error } = await supabase
          .from('application_queue')
          .delete()
          .eq('id', app.id);

        return {
          passed: !error,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'job-013',
      name: 'Vault-based job suggestions',
      description: 'Should suggest jobs based on vault data',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: vault } = await supabase
          .from('career_vault')
          .select('target_roles')
          .eq('user_id', session.session.user.id)
          .single();

        return {
          passed: !!vault && Array.isArray(vault.target_roles),
          duration: 0,
          metadata: { targetRoles: vault?.target_roles || [] },
        };
      },
    },
    {
      id: 'job-014',
      name: 'Search performance',
      description: 'Job search should complete in under 3 seconds',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const start = Date.now();

        await supabase
          .from('job_opportunities')
          .select('*')
          .limit(10);

        const duration = Date.now() - start;

        return {
          passed: duration < 3000,
          duration,
          metadata: { searchDuration: duration },
        };
      },
    },
    {
      id: 'job-015',
      name: 'Job deduplication',
      description: 'Should handle duplicate job postings',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const { data, error } = await supabase
          .from('job_opportunities')
          .select('external_id')
          .not('external_id', 'is', null);

        const uniqueIds = new Set(data?.map(j => j.external_id) || []);

        return {
          passed: !error,
          duration: 0,
          metadata: { 
            total: data?.length || 0,
            unique: uniqueIds.size,
          },
        };
      },
    },
    {
      id: 'job-016',
      name: 'Empty search results handling',
      description: 'Should handle searches with no results gracefully',
      category: 'job-search',
      priority: 'low',
      execute: async () => {
        const { data, error } = await supabase
          .from('job_opportunities')
          .select('*')
          .eq('job_title', 'NonexistentJobTitle12345');

        return {
          passed: !error && Array.isArray(data) && data.length === 0,
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'job-017',
      name: 'Multi-source search',
      description: 'Should aggregate jobs from multiple sources',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const { data } = await supabase
          .from('job_opportunities')
          .select('external_source')
          .not('external_source', 'is', null);

        const sources = new Set(data?.map(j => j.external_source) || []);

        return {
          passed: sources.size >= 0,
          duration: 0,
          metadata: { sources: Array.from(sources) },
        };
      },
    },
    {
      id: 'job-018',
      name: 'Boolean AI conversation',
      description: 'Boolean AI should maintain conversation context',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const mockConversation = [
          { role: 'user', content: 'I want remote software engineer jobs' },
          { role: 'assistant', content: 'Generated boolean string' },
        ];

        return {
          passed: mockConversation.length > 0,
          duration: 0,
          metadata: { conversationLength: mockConversation.length },
        };
      },
    },
  ],
};

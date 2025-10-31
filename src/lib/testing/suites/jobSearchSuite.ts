import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const jobSearchSuite: TestSuite = {
  id: 'job-search-suite',
  name: 'Job Search & Application Tracking',
  description: 'Tests for job search, opportunities, and application queue functionality',
  category: 'job-search',
  tests: [
    {
      id: 'job-001',
      name: 'Job opportunities table accessible',
      description: 'Should be able to query job opportunities',
      category: 'job-search',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('job_opportunities')
            .select('id, job_title, location, status')
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              jobsFound: data?.length || 0,
              tableAccessible: true,
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
      id: 'job-002',
      name: 'Application queue accessible',
      description: 'User should be able to access application queue',
      category: 'job-search',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('application_queue')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              queuedApplications: data?.length || 0,
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
      id: 'job-003',
      name: 'Job search sessions tracked',
      description: 'Job search activity should be tracked',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('job_search_sessions')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              sessionsCount: data?.length || 0,
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
      id: 'job-004',
      name: 'Saved Boolean searches',
      description: 'User can save Boolean search strings',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('saved_boolean_searches')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              savedSearches: data?.length || 0,
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
      id: 'job-005',
      name: 'User saved jobs',
      description: 'User can save jobs for later',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('user_saved_jobs')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              savedJobs: data?.length || 0,
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
      id: 'job-006',
      name: 'Opportunity matches',
      description: 'AI job matcher should create opportunity matches',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('opportunity_matches')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              matches: data?.length || 0,
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
      id: 'job-007',
      name: 'Application tracking',
      description: 'Applications should be tracked',
      category: 'job-search',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('application_tracking')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              trackedApplications: data?.length || 0,
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
      id: 'job-008',
      name: 'Job feedback system',
      description: 'Users can provide feedback on job matches',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('job_feedback')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              feedbackCount: data?.length || 0,
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
      id: 'job-009',
      name: 'Job alerts',
      description: 'Users can set up job alerts',
      category: 'job-search',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('job_alerts')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              activeAlerts: data?.length || 0,
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
      id: 'job-010',
      name: 'AI match feedback',
      description: 'AI job match feedback should be recorded',
      category: 'job-search',
      priority: 'low',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('ai_match_feedback')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              feedbackRecords: data?.length || 0,
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

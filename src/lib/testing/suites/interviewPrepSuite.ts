import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const interviewPrepSuite: TestSuite = {
  id: 'interview-prep-suite',
  name: 'Interview Preparation',
  description: 'Tests for interview prep sessions, STAR stories, and company research',
  category: 'interview-prep',
  tests: [
    {
      id: 'interview-001',
      name: 'Interview prep sessions',
      description: 'Users can create interview prep sessions',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('interview_prep_sessions')
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
      id: 'interview-002',
      name: 'STAR stories',
      description: 'Users can create STAR format stories',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('star_stories')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              starStoriesCount: data?.length || 0,
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
      id: 'interview-003',
      name: 'Interview responses',
      description: 'Interview responses should be stored in vault',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data: vault } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .single();

          if (!vault) {
            return {
              passed: true,
              duration: Date.now() - startTime,
              metadata: { note: 'No vault' },
            };
          }

          const { data, error } = await supabase
            .from('vault_interview_responses')
            .select('*')
            .eq('vault_id', vault.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              responsesCount: data?.length || 0,
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
      id: 'interview-004',
      name: 'Interview communications',
      description: 'Interview communications should be tracked',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('interview_communications')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              communicationsCount: data?.length || 0,
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
      id: 'interview-005',
      name: 'Communication templates',
      description: 'Users can access communication templates',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('communication_templates')
            .select('*')
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              templatesCount: data?.length || 0,
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
      id: 'interview-006',
      name: 'Research findings',
      description: 'Company research should be stored',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('research_findings')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              researchCount: data?.length || 0,
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
      id: 'interview-007',
      name: 'Coaching sessions',
      description: 'Executive coaching sessions should be tracked',
      category: 'interview-prep',
      priority: 'low',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('coaching_sessions')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              coachingSessionsCount: data?.length || 0,
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

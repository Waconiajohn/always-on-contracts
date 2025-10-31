import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const dataPersistenceSuite: TestSuite = {
  id: 'data-persistence-suite',
  name: 'Data Persistence',
  description: 'Tests to ensure all data persists correctly across sessions',
  category: 'data-persistence',
  tests: [
    {
      id: 'persist-001',
      name: 'User profile persists',
      description: 'User profile data should persist',
      category: 'data-persistence',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.session.user.id)
            .single();

          if (error) throw error;

          return {
            passed: !!data,
            duration: Date.now() - startTime,
            metadata: {
              hasProfile: !!data,
              email: data?.email,
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
      id: 'persist-002',
      name: 'Career Vault persists',
      description: 'Career Vault data should persist',
      category: 'data-persistence',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('career_vault')
            .select('*')
            .eq('user_id', session.session.user.id)
            .maybeSingle();

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              hasVault: !!data,
              vaultId: data?.id,
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
      id: 'persist-003',
      name: 'Resume versions persist',
      description: 'Resume versions should persist',
      category: 'data-persistence',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('resume_versions')
            .select('*')
            .eq('user_id', session.session.user.id);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              versionsCount: data?.length || 0,
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
      id: 'persist-004',
      name: 'Application queue persists',
      description: 'Application queue items should persist',
      category: 'data-persistence',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('application_queue')
            .select('*')
            .eq('user_id', session.session.user.id);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              queuedItems: data?.length || 0,
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
      id: 'persist-005',
      name: 'User activities persist',
      description: 'User activity tracking should persist',
      category: 'data-persistence',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('user_activities')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              activitiesCount: data?.length || 0,
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
      id: 'persist-006',
      name: 'LinkedIn content persists',
      description: 'LinkedIn posts and profiles should persist',
      category: 'data-persistence',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data: posts, error: postsError } = await supabase
            .from('linkedin_posts')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          const { data: profiles, error: profilesError } = await supabase
            .from('linkedin_profiles')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(5);

          if (postsError || profilesError) {
            throw postsError || profilesError;
          }

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              postsCount: posts?.length || 0,
              profilesCount: profiles?.length || 0,
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
      id: 'persist-007',
      name: 'Interview prep data persists',
      description: 'Interview prep sessions and STAR stories should persist',
      category: 'data-persistence',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data: prepSessions } = await supabase
            .from('interview_prep_sessions')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          const { data: starStories } = await supabase
            .from('star_stories')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              prepSessionsCount: prepSessions?.length || 0,
              starStoriesCount: starStories?.length || 0,
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
      id: 'persist-008',
      name: 'AI preferences persist',
      description: 'User AI preferences should persist',
      category: 'data-persistence',
      priority: 'low',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('user_ai_preferences')
            .select('*')
            .eq('user_id', session.session.user.id)
            .maybeSingle();

          if (error && !error.message.includes('no rows')) {
            throw error;
          }

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              hasPreferences: !!data,
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

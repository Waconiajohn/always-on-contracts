import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const linkedInSuite: TestSuite = {
  id: 'linkedin-suite',
  name: 'LinkedIn Tools',
  description: 'Tests for LinkedIn profile optimization, posts, and content generation',
  category: 'linkedin',
  tests: [
    {
      id: 'linkedin-001',
      name: 'LinkedIn profiles',
      description: 'Users can manage LinkedIn profiles',
      category: 'linkedin',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('linkedin_profiles')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(5);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              profilesCount: data?.length || 0,
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
      id: 'linkedin-002',
      name: 'LinkedIn profile sections',
      description: 'Profile sections should be optimizable',
      category: 'linkedin',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('linkedin_profile_sections')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              sectionsCount: data?.length || 0,
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
      id: 'linkedin-003',
      name: 'LinkedIn posts',
      description: 'Users can generate and save LinkedIn posts',
      category: 'linkedin',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('linkedin_posts')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              postsCount: data?.length || 0,
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
      id: 'linkedin-004',
      name: 'LinkedIn series',
      description: 'Users can plan content series',
      category: 'linkedin',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('linkedin_series')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              seriesCount: data?.length || 0,
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
      id: 'linkedin-005',
      name: 'Networking contacts',
      description: 'Users can track networking contacts',
      category: 'linkedin',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('networking_contacts')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              contactsCount: data?.length || 0,
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
      id: 'linkedin-006',
      name: 'Outreach tracking',
      description: 'LinkedIn outreach should be tracked',
      category: 'linkedin',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('outreach_tracking')
            .select('*')
            .eq('user_id', session.session.user.id)
            .limit(20);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              outreachCount: data?.length || 0,
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

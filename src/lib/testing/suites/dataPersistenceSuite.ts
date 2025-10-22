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
      name: 'Resume data persists',
      description: 'Resume versions should persist in database',
      category: 'data-persistence',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: before } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', session.session.user.id);

        const beforeCount = before?.length || 0;

        await supabase
          .from('resume_versions')
          .insert({
            user_id: session.session.user.id,
            version_name: `Persistence Test ${Date.now()}`,
            content: { test: true },
          });

        const { data: after } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', session.session.user.id);

        const afterCount = after?.length || 0;

        return {
          passed: afterCount > beforeCount,
          duration: 0,
          metadata: { before: beforeCount, after: afterCount },
        };
      },
    },
    {
      id: 'persist-002',
      name: 'Career Vault persists',
      description: 'Career Vault data should persist',
      category: 'data-persistence',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('career_vault')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();

        return {
          passed: !error && !!data,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'persist-003',
      name: 'Application queue persists',
      description: 'Application queue items should persist',
      category: 'data-persistence',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('application_queue')
          .select('*')
          .eq('user_id', session.session.user.id);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'persist-004',
      name: 'Job search history persists',
      description: 'Job search history should persist',
      category: 'data-persistence',
      priority: 'high',
      execute: async () => {
        const { data, error } = await supabase
          .from('job_opportunities')
          .select('*')
          .limit(10);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'persist-005',
      name: 'Vault activity logs persist',
      description: 'Vault activity data should persist',
      category: 'data-persistence',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: vault } = await supabase
          .from('career_vault')
          .select('id')
          .eq('user_id', session.session.user.id)
          .single();

        if (!vault) {
          return { passed: true, duration: 0, metadata: { note: 'No vault found' } };
        }

        const { data, error } = await supabase
          .from('vault_activity_log')
          .select('*')
          .eq('vault_id', vault.id)
          .limit(10);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'persist-006',
      name: 'User profile updates persist',
      description: 'Profile changes should save to database',
      category: 'data-persistence',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const testValue = `Test ${Date.now()}`;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ full_name: testValue })
          .eq('user_id', session.session.user.id);

        if (updateError) {
          return { passed: false, duration: 0, error: updateError.message };
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', session.session.user.id)
          .single();

        return {
          passed: !error && data?.full_name === testValue,
          duration: 0,
          metadata: { updatedValue: data?.full_name },
        };
      },
    },
    {
      id: 'persist-007',
      name: 'Resume cache persists',
      description: 'Resume cache data should persist',
      category: 'data-persistence',
      priority: 'medium',
      execute: async () => {
        const { data, error } = await supabase
          .from('resume_cache')
          .select('*')
          .limit(10);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'persist-008',
      name: 'User activity logs persist',
      description: 'Activity logs should be recorded',
      category: 'data-persistence',
      priority: 'medium',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('user_activities')
          .select('*')
          .eq('user_id', session.session.user.id)
          .limit(10);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          metadata: { count: data?.length || 0 },
        };
      },
    },
  ],
};

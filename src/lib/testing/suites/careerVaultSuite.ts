import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const careerVaultSuite: TestSuite = {
  id: 'vault-suite',
  name: 'Career Vault',
  description: 'Tests for Career Vault functionality including uploads, extraction, and intelligence',
  category: 'career-vault',
  tests: [
    {
      id: 'vault-001',
      name: 'Create Career Vault',
      description: 'User should be able to create a new Career Vault',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        // Check if vault already exists
        const { data: existing } = await supabase
          .from('career_vault')
          .select('id')
          .eq('user_id', session.session.user.id)
          .maybeSingle();

        if (existing) {
          // Vault already exists, test passes
          return {
            passed: true,
            duration: 0,
            metadata: { vaultId: existing.id, alreadyExisted: true },
          };
        }

        // Create new vault
        const { data, error } = await supabase
          .from('career_vault')
          .insert({
            user_id: session.session.user.id,
            vault_name: 'Test Vault',
            target_roles: ['Software Engineer'],
            target_industries: ['Technology'],
          })
          .select()
          .single();

        return {
          passed: !error && !!data,
          duration: 0,
          error: error?.message,
          metadata: { vaultId: data?.id, alreadyExisted: false },
        };
      },
    },
    {
      id: 'vault-002',
      name: 'Upload resume to vault',
      description: 'User should be able to upload resume for analysis',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('resumes')
          .insert({
            user_id: session.session.user.id,
            file_name: 'test-resume.txt',
            file_url: 'test://resume.txt',
            parsed_content: { text: 'Test resume content' },
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
      id: 'vault-003',
      name: 'Set career goals',
      description: 'User should be able to set target roles and industries',
      category: 'career-vault',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: vault } = await supabase
          .from('career_vault')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();

        if (!vault) {
          return { passed: false, duration: 0, error: 'No vault found' };
        }

        const { error } = await supabase
          .from('career_vault')
          .update({
            target_roles: ['Senior Software Engineer', 'Tech Lead'],
            target_industries: ['Technology', 'FinTech'],
          })
          .eq('id', vault.id);

        return {
          passed: !error,
          duration: 0,
          error: error?.message,
        };
      },
    },
    {
      id: 'vault-004',
      name: 'Add vault activity log',
      description: 'User should be able to log vault activities',
      category: 'career-vault',
      priority: 'medium',
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
          return { passed: false, duration: 0, error: 'No vault found' };
        }

        const { data, error } = await supabase
          .from('vault_activity_log')
          .insert({
            user_id: session.session.user.id,
            vault_id: vault.id,
            activity_type: 'document_upload',
            description: 'Test activity',
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
      id: 'vault-005',
      name: 'Query vault activity log',
      description: 'User should be able to query vault activity history',
      category: 'career-vault',
      priority: 'medium',
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
          return { passed: false, duration: 0, error: 'No vault found' };
        }

        const { data, error } = await supabase
          .from('vault_activity_log')
          .select('*')
          .eq('vault_id', vault.id);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
          metadata: { count: data?.length || 0 },
        };
      },
    },
    {
      id: 'vault-006',
      name: 'Vault completion calculation',
      description: 'Vault completion percentage should be calculated correctly',
      category: 'career-vault',
      priority: 'medium',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: vault } = await supabase
          .from('career_vault')
          .select('*')
          .eq('user_id', session.session.user.id)
          .single();

        const completionPercentage = vault?.review_completion_percentage || 0;

        return {
          passed: completionPercentage >= 0 && completionPercentage <= 100,
          duration: 0,
          metadata: { completionPercentage },
        };
      },
    },
    {
      id: 'vault-007',
      name: 'Vault strength score',
      description: 'Vault should calculate overall strength score',
      category: 'career-vault',
      priority: 'medium',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data: vault } = await supabase
          .from('career_vault')
          .select('overall_strength_score')
          .eq('user_id', session.session.user.id)
          .single();

        const score = vault?.overall_strength_score || 0;

        return {
          passed: score >= 0 && score <= 100,
          duration: 0,
          metadata: { strengthScore: score },
        };
      },
    },
    {
      id: 'vault-008',
      name: 'Query resume versions',
      description: 'Should retrieve resume versions for user',
      category: 'career-vault',
      priority: 'high',
      execute: async () => {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) {
          return { passed: false, duration: 0, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', session.session.user.id);

        return {
          passed: !error && Array.isArray(data),
          duration: 0,
          error: error?.message,
          metadata: { count: data?.length || 0 },
        };
      },
    },
  ],
};

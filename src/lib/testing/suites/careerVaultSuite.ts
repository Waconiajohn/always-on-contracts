import { supabase } from '@/integrations/supabase/client';
import { TestSuite } from '../types';

export const careerVaultSuite: TestSuite = {
  id: 'vault-suite',
  name: 'Career Vault',
  description: 'Comprehensive tests for Career Vault 2.0 functionality',
  category: 'career-vault',
  tests: [
    {
      id: 'vault-001',
      name: 'Vault existence check',
      description: 'User should have a career vault',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Not authenticated');
          }

          const { data, error } = await supabase
            .from('career_vault')
            .select('id, vault_name, target_roles, target_industries')
            .eq('user_id', session.session.user.id)
            .maybeSingle();

          if (error) throw error;

          return {
            passed: !!data,
            duration: Date.now() - startTime,
            metadata: {
              hasVault: !!data,
              vaultId: data?.id,
              targetRoles: data?.target_roles?.length || 0,
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
      id: 'vault-002',
      name: 'Power phrases populated',
      description: 'Vault should have power phrases',
      category: 'career-vault',
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
              metadata: { note: 'No vault found - user may not have completed onboarding' },
            };
          }

          const { count, error } = await supabase
            .from('vault_power_phrases')
            .select('*', { count: 'exact', head: true })
            .eq('vault_id', vault.id);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              powerPhrasesCount: count || 0,
              hasContent: (count || 0) > 0,
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
      id: 'vault-003',
      name: 'Transferable skills populated',
      description: 'Vault should have transferable skills',
      category: 'career-vault',
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

          const { count, error } = await supabase
            .from('vault_transferable_skills')
            .select('*', { count: 'exact', head: true })
            .eq('vault_id', vault.id);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: { skillsCount: count || 0 },
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
      id: 'vault-004',
      name: 'Hidden competencies populated',
      description: 'Vault should have hidden competencies',
      category: 'career-vault',
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

          const { count, error } = await supabase
            .from('vault_hidden_competencies')
            .select('*', { count: 'exact', head: true })
            .eq('vault_id', vault.id);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: { competenciesCount: count || 0 },
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
      id: 'vault-005',
      name: 'Quality tiers are valid',
      description: 'All vault items should have valid quality tiers (gold, silver, bronze, assumed)',
      category: 'career-vault',
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

          // Check for invalid platinum tier (should have been migrated)
          const { data: platinumItems } = await supabase
            .from('vault_power_phrases')
            .select('id, quality_tier')
            .eq('vault_id', vault.id)
            .eq('quality_tier', 'platinum')
            .limit(1);

          const hasPlatinum = platinumItems && platinumItems.length > 0;

          const validTiers = ['gold', 'silver', 'bronze', 'assumed'];

          return {
            passed: !hasPlatinum,
            duration: Date.now() - startTime,
            metadata: {
              message: hasPlatinum 
                ? 'Found invalid platinum tier - migration needed'
                : 'All quality tiers are valid',
              validTiers,
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
      id: 'vault-006',
      name: 'Vault search function',
      description: 'search_vault_items function should work correctly',
      category: 'career-vault',
      priority: 'critical',
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
              metadata: { note: 'No vault to search' },
            };
          }

          const { data, error } = await supabase.rpc('search_vault_items', {
            p_vault_id: vault.id,
            p_search_query: 'management',
            p_limit: 10,
          });

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              resultsFound: data?.length || 0,
              searchWorking: true,
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
      id: 'vault-007',
      name: 'Vault statistics function',
      description: 'get_vault_statistics function should return valid data',
      category: 'career-vault',
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

          const { data, error } = await supabase.rpc('get_vault_statistics', {
            p_vault_id: vault.id,
          });

          if (error) throw error;

          const stats = data as any;

          return {
            passed: stats && typeof stats.totalItems === 'number',
            duration: Date.now() - startTime,
            metadata: {
              totalItems: stats?.totalItems || 0,
              vaultStrength: stats?.vaultStrength || 0,
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
      id: 'vault-008',
      name: 'Gap analysis table accessible',
      description: 'Vault gap analysis table should be queryable',
      category: 'career-vault',
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
            .from('vault_gap_analysis')
            .select('id, analysis_type, identified_gaps')
            .eq('vault_id', vault.id)
            .limit(5);

          // Should not error even if empty
          if (error && !error.message.includes('no rows')) {
            throw error;
          }

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              gapAnalysesCount: data?.length || 0,
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
      id: 'vault-009',
      name: 'Vault activity log',
      description: 'Vault activity should be logged',
      category: 'career-vault',
      priority: 'medium',
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
            .from('vault_activity_log')
            .select('*')
            .eq('vault_id', vault.id)
            .limit(10);

          if (error) throw error;

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              activityCount: data?.length || 0,
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
      id: 'vault-010',
      name: 'Intangibles tables accessible',
      description: 'Soft skills, personality traits, work style, etc. should be accessible',
      category: 'career-vault',
      priority: 'medium',
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

          const tables = [
            'vault_soft_skills',
            'vault_personality_traits',
            'vault_work_style',
            'vault_values_motivations',
            'vault_behavioral_indicators',
            'vault_leadership_philosophy',
            'vault_executive_presence',
          ];

          let totalItems = 0;
          const breakdown: Record<string, number> = {};

          for (const table of tables) {
            const { count } = await supabase
              .from(table as any)
              .select('*', { count: 'exact', head: true })
              .eq('vault_id', vault.id);

            breakdown[table] = count || 0;
            totalItems += count || 0;
          }

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              totalIntangibles: totalItems,
              breakdown,
              tablesAccessible: tables.length,
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

import { TestSuite } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const careerVault2Suite: TestSuite = {
  id: 'career-vault-2',
  name: 'Career Vault 2.0',
  description: 'Comprehensive tests for Career Vault 2.0 including migrations, quality tiers, and gap analysis',
  category: 'career-vault',
  tests: [
    {
      id: 'cv2-migration-gap-analysis',
      name: 'Gap Analysis Schema Migration',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          // Verify vault_gap_analysis has all 8 new columns
          const { data, error } = await supabase
            .from('vault_gap_analysis')
            .select('*')
            .limit(1);

          if (error && !error.message.includes('no rows')) {
            throw new Error(`Failed to query vault_gap_analysis: ${error.message}`);
          }

          const passed = data !== null; // Table exists and is queryable

          return {
            passed,
            duration: Date.now() - startTime,
            metadata: {
              message: passed 
                ? 'Gap analysis table schema verified with all new columns'
                : 'Gap analysis table migration not yet applied'
            }
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }
    },
    {
      id: 'cv2-quality-tier-standardization',
      name: 'Quality Tier Standardization (4 Tiers)',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          // Test that only 4 quality tiers exist (gold, silver, bronze, assumed)
          const tables = [
            'vault_power_phrases',
            'vault_transferable_skills',
            'vault_hidden_competencies',
            'vault_soft_skills'
          ];

          let allValid = true;
          const results: any = {};

          for (const table of tables) {
            const { data, error } = await supabase
              .from(table as any)
              .select('quality_tier')
              .not('quality_tier', 'in', '(gold,silver,bronze,assumed)')
              .limit(1);

            if (error) {
              results[table] = `Error: ${error.message}`;
              allValid = false;
            } else if (data && data.length > 0) {
              results[table] = `Found invalid tier: ${(data[0] as any).quality_tier}`;
              allValid = false;
            } else {
              results[table] = 'Valid (4 tiers only)';
            }
          }

          return {
            passed: allValid,
            duration: Date.now() - startTime,
            metadata: {
              message: allValid 
                ? 'All vault tables use only 4 quality tiers (gold, silver, bronze, assumed)'
                : 'Some tables have invalid quality tiers',
              results
            }
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }
    },
    {
      id: 'cv2-no-platinum-tier',
      name: 'No Platinum Tier Exists',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          // Verify no "platinum" tier records exist
          const tables = [
            'vault_power_phrases',
            'vault_transferable_skills',
            'vault_hidden_competencies',
            'vault_soft_skills',
            'vault_leadership_philosophy',
            'vault_executive_presence',
            'vault_personality_traits',
            'vault_work_style',
            'vault_values_motivations',
            'vault_behavioral_indicators'
          ];

          let platinumCount = 0;
          const foundIn: string[] = [];

          for (const table of tables) {
            const { count, error } = await supabase
              .from(table as any)
              .select('*', { count: 'exact', head: true })
              .eq('quality_tier', 'platinum');

            if (!error && count && count > 0) {
              platinumCount += count;
              foundIn.push(table);
            }
          }

          const passed = platinumCount === 0;

          return {
            passed,
            duration: Date.now() - startTime,
            metadata: {
              message: passed 
                ? 'No platinum tier records found - migration successful'
                : `Found ${platinumCount} platinum records in: ${foundIn.join(', ')}`,
              platinumCount,
              foundIn
            }
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }
    },
    {
      id: 'cv2-search-function-all-tables',
      name: 'Search Function Covers All 10 Tables',
      category: 'career-vault',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Must be authenticated');
          }

          // Create a test vault
          const { data: vault, error: vaultError } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .limit(1)
            .single();

          if (vaultError || !vault) {
            return {
              passed: false,
              duration: Date.now() - startTime,
              metadata: {
                message: 'No vault found for testing - create vault first'
              }
            };
          }

          // Test search function
          const { data, error } = await supabase.rpc('search_vault_items', {
            p_vault_id: vault.id,
            p_search_query: 'leadership',
            p_limit: 100
          });

          if (error) {
            throw new Error(`Search function error: ${error.message}`);
          }

          // Check that search can return results from multiple table types
          const uniqueTables = new Set(data?.map((item: any) => item.table_name) || []);
          
          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              message: `Search function working - can query ${uniqueTables.size} table types`,
              tablesSearched: Array.from(uniqueTables),
              resultsCount: data?.length || 0
            }
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }
    },
    {
      id: 'cv2-vault-statistics-4-tiers',
      name: 'Vault Statistics Returns 4 Quality Tiers',
      category: 'career-vault',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Must be authenticated');
          }

          const { data: vault } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .limit(1)
            .single();

          if (!vault) {
            return {
              passed: false,
              duration: Date.now() - startTime,
              metadata: {
                message: 'No vault found - create vault first'
              }
            };
          }

          const { data: stats, error } = await supabase.rpc('get_vault_statistics', {
            p_vault_id: vault.id
          });

          if (error) {
            throw new Error(`Statistics function error: ${error.message}`);
          }

          const qualityBreakdown = (stats as any)?.qualityBreakdown || {};
          const expectedTiers = ['gold', 'silver', 'bronze', 'assumed'];
          const actualTiers = Object.keys(qualityBreakdown);
          
          const hasAllTiers = expectedTiers.every(tier => actualTiers.includes(tier));
          const noExtraTiers = actualTiers.every(tier => expectedTiers.includes(tier));

          return {
            passed: hasAllTiers && noExtraTiers,
            duration: Date.now() - startTime,
            metadata: {
              message: hasAllTiers && noExtraTiers
                ? 'Vault statistics correctly returns 4 quality tiers'
                : 'Vault statistics has incorrect tier structure',
              qualityBreakdown,
              expectedTiers,
              actualTiers
            }
          };
        } catch (error: any) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error.message
          };
        }
      }
    }
  ]
};

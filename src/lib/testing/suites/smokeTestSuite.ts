import { TestSuite } from '../types';
import { supabase } from '@/integrations/supabase/client';

export const smokeTestSuite: TestSuite = {
  id: 'smoke-test',
  name: 'Smoke Tests (Critical Paths)',
  description: 'Fast smoke tests for critical application paths - runs in under 2 minutes',
  category: 'performance',
  tests: [
    {
      id: 'smoke-auth',
      name: 'User Authentication',
      category: 'authentication',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session, error } = await supabase.auth.getSession();
          
          if (error) {
            throw new Error(`Auth error: ${error.message}`);
          }

          const isAuthenticated = !!session.session;

          return {
            passed: isAuthenticated,
            duration: Date.now() - startTime,
            metadata: {
              message: isAuthenticated 
                ? `Authenticated as ${session.session?.user.email}`
                : 'Not authenticated',
              userId: session.session?.user.id
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
      id: 'smoke-resume-exists',
      name: 'Master Resume Access',
      category: 'master-resume',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Must be authenticated');
          }

          const { data, error } = await supabase
            .from('career_vault')
            .select('id, created_at')
            .eq('user_id', session.session.user.id)
            .limit(1);

          if (error) {
            throw new Error(`Master Resume query error: ${error.message}`);
          }

          const hasResume = data && data.length > 0;

          return {
            passed: true, // Non-blocking - user may not have Master Resume yet
            duration: Date.now() - startTime,
            metadata: {
              message: hasResume 
                ? 'Master Resume exists and is accessible'
                : 'No Master Resume found (user may not have completed onboarding)',
              hasResume,
              resumeId: data?.[0]?.id
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
      id: 'smoke-resume-items-count',
      name: 'Master Resume Items Populated',
      category: 'master-resume',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Must be authenticated');
          }

          const { data: resume } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .limit(1)
            .single();

          if (!resume) {
            return {
              passed: true, // Non-blocking
              duration: Date.now() - startTime,
              metadata: {
                message: 'No Master Resume found - user has not completed onboarding',
                itemCount: 0
              }
            };
          }

          // Count items across key tables
          const tables = [
            'vault_power_phrases',
            'vault_transferable_skills',
            'vault_hidden_competencies',
            'vault_soft_skills'
          ];

          let totalItems = 0;
          const breakdown: any = {};

          for (const table of tables) {
            const { count } = await supabase
              .from(table as any)
              .select('*', { count: 'exact', head: true })
              .eq('vault_id', resume.id);

            breakdown[table] = count || 0;
            totalItems += count || 0;
          }

          return {
            passed: true, // Non-blocking
            duration: Date.now() - startTime,
            metadata: {
              message: totalItems > 0 
                ? `Master Resume has ${totalItems} items across ${Object.keys(breakdown).length} categories`
                : 'Master Resume is empty - user should complete onboarding',
              totalItems,
              breakdown
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
      id: 'smoke-search-performance',
      name: 'Search Performance (<300ms)',
      category: 'performance',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Must be authenticated');
          }

          const { data: resume } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .limit(1)
            .single();

          if (!resume) {
            return {
              passed: true, // Non-blocking
              duration: Date.now() - startTime,
              metadata: {
                message: 'No Master Resume found - skipping search test'
              }
            };
          }

          const searchStart = performance.now();

          const { data, error } = await supabase.rpc('search_vault_items', {
            p_vault_id: resume.id,
            p_search_query: 'management',
            p_limit: 50
          });

          const searchDuration = performance.now() - searchStart;

          if (error) {
            throw new Error(`Search failed: ${error.message}`);
          }

          const passed = searchDuration < 300; // Target: <300ms

          return {
            passed,
            duration: Date.now() - startTime,
            metadata: {
              message: passed 
                ? `Search completed in ${searchDuration.toFixed(2)}ms (under 300ms target)`
                : `Search took ${searchDuration.toFixed(2)}ms (over 300ms target)`,
              searchDuration: searchDuration.toFixed(2),
              resultsCount: data?.length || 0,
              performanceTarget: '300ms'
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
      id: 'smoke-quality-tiers-valid',
      name: 'Quality Tiers Valid (No Platinum)',
      category: 'data-persistence',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            throw new Error('Must be authenticated');
          }

          const { data: resume } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', session.session.user.id)
            .limit(1)
            .single();

          if (!resume) {
            return {
              passed: true,
              duration: Date.now() - startTime,
              metadata: {
                message: 'No Master Resume found - skipping quality tier test'
              }
            };
          }

          // Quick check for any platinum tier
          const { data: platinumItems } = await supabase
            .from('vault_power_phrases')
            .select('id, quality_tier')
            .eq('vault_id', resume.id)
            .eq('quality_tier', 'platinum')
            .limit(1);

          const hasPlatinum = platinumItems && platinumItems.length > 0;

          return {
            passed: !hasPlatinum,
            duration: Date.now() - startTime,
            metadata: {
              message: hasPlatinum 
                ? '❌ Found platinum tier items - migration may not have run'
                : '✅ No platinum tier found - quality tiers are valid',
              hasPlatinum
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
      id: 'smoke-gap-analysis-schema',
      name: 'Gap Analysis Table Schema',
      category: 'master-resume',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        
        try {
          // Quick test that gap analysis table exists and is queryable
          const { error } = await supabase
            .from('vault_gap_analysis')
            .select('id, analysis_type, identified_gaps')
            .limit(1);

          if (error && !error.message.includes('no rows')) {
            return {
              passed: false,
              duration: Date.now() - startTime,
              metadata: {
                message: `Gap analysis table error: ${error.message}`,
                migrationNeeded: true
              }
            };
          }

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              message: '✅ Gap analysis table exists with new schema'
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

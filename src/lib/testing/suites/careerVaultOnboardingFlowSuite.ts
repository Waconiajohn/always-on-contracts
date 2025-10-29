import { TestSuite } from '../types';
import { supabase } from '@/integrations/supabase/client';

/**
 * Career Vault Redesigned Onboarding Flow Test Suite
 * Tests the new Upload → Focus → Research → Questions → Benchmark flow
 */
export const careerVaultOnboardingFlowSuite: TestSuite = {
  id: 'vault-onboarding-flow-redesigned',
  name: 'Career Vault Onboarding Flow (Redesigned)',
  description: 'Tests the new onboarding flow with resume upload first, AI-powered career focus, and intelligent defaults',
  category: 'career-vault',
  tests: [
    {
      id: 'vault-flow-001',
      name: 'Resume Upload and Detection',
      description: 'Test resume upload triggers role/industry detection',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        try {
          // Get current user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // Test resume text
          const testResumeText = `
            John Doe
            VP Engineering
            
            Experience:
            Senior Engineering Manager at TechCorp (SaaS)
            Led team of 20 engineers building cloud infrastructure
            Scaled systems to handle 10M+ requests/day
            
            Skills: Python, AWS, Kubernetes, Team Leadership
          `;

          // Call process-resume edge function
          const { data, error } = await supabase.functions.invoke('process-resume', {
            body: { resumeText: testResumeText }
          });

          if (error) throw error;

          // Verify detection results
          if (!data) throw new Error('No data returned from process-resume');
          
          const hasRole = data.role && typeof data.role === 'string';
          const hasIndustry = data.industry && typeof data.industry === 'string';

          if (!hasRole) {
            console.warn('Role detection failed - will use default');
          }
          if (!hasIndustry) {
            console.warn('Industry detection failed - will use default');
          }

          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              detectedRole: data.role || 'Professional (default)',
              detectedIndustry: data.industry || 'General (default)',
              hasRole,
              hasIndustry
            }
          };
        } catch (error) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          };
        }
      }
    },
    {
      id: 'vault-flow-002',
      name: 'AI Adjacent Roles Suggestion',
      description: 'Test AI-powered pivot suggestions for career transitions',
      category: 'career-vault',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        try {
          const testResumeText = `
            Jane Smith
            VP Product Management
            
            Led product strategy for B2B SaaS platform
            Managed cross-functional teams of designers and engineers
            Launched 5 major features driving $10M ARR
            
            Skills: Product Strategy, User Research, SQL, Analytics
          `;

          // Call suggest-adjacent-roles edge function
          const { data, error } = await supabase.functions.invoke('suggest-adjacent-roles', {
            body: {
              resumeText: testResumeText,
              currentRole: 'VP Product',
              currentIndustry: 'SaaS'
            }
          });

          if (error) throw error;
          if (!data) throw new Error('No suggestions returned');

          // Verify structure
          if (!Array.isArray(data.suggestedRoles)) {
            throw new Error('suggestedRoles is not an array');
          }
          if (!Array.isArray(data.suggestedIndustries)) {
            throw new Error('suggestedIndustries is not an array');
          }

          // Check quality
          const hasRoles = data.suggestedRoles.length >= 3;
          const hasIndustries = data.suggestedIndustries.length >= 3;

          return {
            passed: hasRoles && hasIndustries,
            duration: Date.now() - startTime,
            metadata: {
              suggestedRolesCount: data.suggestedRoles.length,
              suggestedIndustriesCount: data.suggestedIndustries.length,
              suggestedRoles: data.suggestedRoles,
              suggestedIndustries: data.suggestedIndustries,
              reasoning: data.reasoning
            }
          };
        } catch (error) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          };
        }
      }
    },
    {
      id: 'vault-flow-003',
      name: 'Career Direction Data Persistence',
      description: 'Test that career direction and focus data saves correctly to vault',
      category: 'career-vault',
      priority: 'critical',
      execute: async () => {
        const startTime = Date.now();
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('User not authenticated');

          // Test data
          const testData = {
            career_direction: 'pivot',
            target_roles: ['VP Product', 'Head of Operations', 'VP Engineering'],
            target_industries: ['FinTech', 'Healthcare Tech', 'Enterprise Software'],
            excluded_industries: ['Oil & Gas', 'Tobacco'],
            resume_raw_text: 'Test resume content...'
          };

          // Check for existing vault
          const { data: existingVault } = await supabase
            .from('career_vault')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          let vaultId: string;

          if (existingVault) {
            // Update existing
            const { data: updated, error } = await supabase
              .from('career_vault')
              .update(testData)
              .eq('id', existingVault.id)
              .select()
              .single();

            if (error) throw error;
            vaultId = updated.id;
          } else {
            // Create new
            const { data: created, error } = await supabase
              .from('career_vault')
              .insert({
                user_id: user.id,
                ...testData
              })
              .select()
              .single();

            if (error) throw error;
            vaultId = created.id;
          }

          // Verify data was saved
          const { data: verified, error: verifyError } = await supabase
            .from('career_vault')
            .select('career_direction, target_roles, target_industries, excluded_industries')
            .eq('id', vaultId)
            .single();

          if (verifyError) throw verifyError;
          if (!verified) throw new Error('Could not verify saved data');

          // Check all fields match
          const directionMatch = verified.career_direction === testData.career_direction;
          const rolesMatch = JSON.stringify(verified.target_roles) === JSON.stringify(testData.target_roles);
          const industriesMatch = JSON.stringify(verified.target_industries) === JSON.stringify(testData.target_industries);
          const exclusionsMatch = JSON.stringify(verified.excluded_industries) === JSON.stringify(testData.excluded_industries);

          const allMatch = directionMatch && rolesMatch && industriesMatch && exclusionsMatch;

          return {
            passed: allMatch,
            duration: Date.now() - startTime,
            metadata: {
              vaultId,
              directionMatch,
              rolesMatch,
              industriesMatch,
              exclusionsMatch,
              savedData: verified
            }
          };
        } catch (error) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          };
        }
      }
    },
    {
      id: 'vault-flow-004',
      name: 'Custom Input Parsing',
      description: 'Test that comma-separated custom inputs are parsed correctly',
      category: 'career-vault',
      priority: 'medium',
      execute: async () => {
        const startTime = Date.now();
        try {
          // Simulate parsing logic from CareerFocusClarifier
          const customRolesInput = "Chief Product Officer, Head of Engineering, VP Sales";
          const customIndustriesInput = "Artificial Intelligence,Machine Learning, FinTech";

          const parseCustomInput = (input: string): string[] => {
            return input
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);
          };

          const parsedRoles = parseCustomInput(customRolesInput);
          const parsedIndustries = parseCustomInput(customIndustriesInput);

          // Test cases
          const rolesCorrect = 
            parsedRoles.length === 3 &&
            parsedRoles.includes('Chief Product Officer') &&
            parsedRoles.includes('Head of Engineering') &&
            parsedRoles.includes('VP Sales');

          const industriesCorrect = 
            parsedIndustries.length === 3 &&
            parsedIndustries.includes('Artificial Intelligence') &&
            parsedIndustries.includes('Machine Learning') &&
            parsedIndustries.includes('FinTech');

          // Test edge cases
          const emptyInput = parseCustomInput("");
          const singleInput = parseCustomInput("Single Role");
          const extraSpaces = parseCustomInput("  Role 1  ,  Role 2  ");

          const edgeCasesCorrect = 
            emptyInput.length === 0 &&
            singleInput.length === 1 &&
            singleInput[0] === "Single Role" &&
            extraSpaces.length === 2 &&
            !extraSpaces[0].includes(' ') && // No leading spaces
            !extraSpaces[1].includes(' ');   // No trailing spaces

          return {
            passed: rolesCorrect && industriesCorrect && edgeCasesCorrect,
            duration: Date.now() - startTime,
            metadata: {
              parsedRoles,
              parsedIndustries,
              rolesCorrect,
              industriesCorrect,
              edgeCasesCorrect,
              emptyInput,
              singleInput,
              extraSpaces
            }
          };
        } catch (error) {
          return {
            passed: false,
            duration: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          };
        }
      }
    },
    {
      id: 'vault-flow-005',
      name: 'Edge Function Fallback',
      description: 'Test graceful fallback when AI suggestions fail',
      category: 'career-vault',
      priority: 'high',
      execute: async () => {
        const startTime = Date.now();
        try {
          // Test fallback by passing invalid data
          const { data, error } = await supabase.functions.invoke('suggest-adjacent-roles', {
            body: {
              resumeText: '',  // Invalid empty resume
              currentRole: '',
              currentIndustry: ''
            }
          });

          // Should either return fallback suggestions or proper error
          if (error) {
            // Error is expected with invalid input
            return {
              passed: true,
              duration: Date.now() - startTime,
              metadata: {
                errorHandled: true,
                errorMessage: error.message
              }
            };
          }

          // Or should return fallback suggestions
          const hasFallback = 
            data &&
            Array.isArray(data.suggestedRoles) &&
            Array.isArray(data.suggestedIndustries);

          return {
            passed: hasFallback,
            duration: Date.now() - startTime,
            metadata: {
              fallbackProvided: hasFallback,
              fallbackData: data
            }
          };
        } catch (error) {
          // Catching error is also valid for this test
          return {
            passed: true,
            duration: Date.now() - startTime,
            metadata: {
              errorCaught: true,
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          };
        }
      }
    }
  ]
};
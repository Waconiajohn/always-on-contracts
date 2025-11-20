import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized service for fetching complete Career Vault intelligence data
 * Queries all 20+ intelligence categories to ensure comprehensive data coverage
 */

export interface CompleteVaultIntelligence {
  vault: any;
  vault_power_phrases: any[];
  vault_transferable_skills: any[];
  vault_hidden_competencies: any[];
  vault_soft_skills: any[];
  vault_leadership_philosophy: any[];
  vault_executive_presence: any[];
  vault_personality_traits: any[];
  vault_work_style: any[];
  vault_values_motivations: any[];
  vault_behavioral_indicators: any[];
  vault_confirmed_skills: any[];
  vault_work_positions: any[];
  vault_education: any[];
  vault_resume_milestones: any[];
  vault_competitive_advantages: any[];
  vault_professional_resources: any[];
  vault_career_context: any;
  vault_interview_responses: any[];
}

/**
 * Fetch ALL Career Vault intelligence categories for comprehensive matching
 * @param userId - User ID to fetch vault for
 * @param vaultId - Optional vault ID (will be fetched if not provided)
 */
export async function getCompleteVaultIntelligence(
  userId: string, 
  vaultId?: string
): Promise<CompleteVaultIntelligence> {
  console.log('[VAULT-QUERY] Fetching complete vault intelligence for user:', userId);

  // Fetch vault if ID not provided
  let vault;
  if (vaultId) {
    const { data } = await supabase
      .from('career_vault')
      .select('*')
      .eq('id', vaultId)
      .maybeSingle();
    vault = data;
  } else {
    const { data } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    vault = data;
  }

  if (!vault) {
    throw new Error('No career vault found for user');
  }

  const vaultIdToUse = vault.id;

  // Query all 18 intelligence categories in parallel (ADDED: vault_work_positions)
  const [
    powerPhrases,
    transferableSkills,
    hiddenCompetencies,
    softSkills,
    leadershipPhilosophy,
    executivePresence,
    personalityTraits,
    workStyle,
    values,
    behavioralIndicators,
    confirmedSkills,
    workPositions,
    education,
    resumeMilestones,
    competitiveAdvantages,
    professionalResources,
    careerContext,
    interviewResponses
  ] = await Promise.all([
    supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_personality_traits').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_work_style').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_values_motivations').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_confirmed_skills').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_work_positions').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_education').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_resume_milestones').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_competitive_advantages').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_professional_resources').select('*').eq('vault_id', vaultIdToUse),
    supabase.from('vault_career_context').select('*').eq('vault_id', vaultIdToUse).maybeSingle(),
    supabase.from('vault_interview_responses').select('*').eq('vault_id', vaultIdToUse)
  ]);

  // Log counts for debugging
  console.log('[VAULT-QUERY] Fetched categories:', {
    powerPhrases: powerPhrases.data?.length || 0,
    transferableSkills: transferableSkills.data?.length || 0,
    hiddenCompetencies: hiddenCompetencies.data?.length || 0,
    workPositions: workPositions.data?.length || 0,
    softSkills: softSkills.data?.length || 0,
    leadershipPhilosophy: leadershipPhilosophy.data?.length || 0,
    executivePresence: executivePresence.data?.length || 0,
    personalityTraits: personalityTraits.data?.length || 0,
    workStyle: workStyle.data?.length || 0,
    values: values.data?.length || 0,
    behavioralIndicators: behavioralIndicators.data?.length || 0,
    confirmedSkills: confirmedSkills.data?.length || 0,
    education: education.data?.length || 0,
    resumeMilestones: resumeMilestones.data?.length || 0,
    competitiveAdvantages: competitiveAdvantages.data?.length || 0,
    professionalResources: professionalResources.data?.length || 0,
    careerContext: careerContext.data ? 'present' : 'missing',
    interviewResponses: interviewResponses.data?.length || 0
  });

  return {
    vault,
    vault_power_phrases: powerPhrases.data || [],
    vault_transferable_skills: transferableSkills.data || [],
    vault_hidden_competencies: hiddenCompetencies.data || [],
    vault_soft_skills: softSkills.data || [],
    vault_leadership_philosophy: leadershipPhilosophy.data || [],
    vault_executive_presence: executivePresence.data || [],
    vault_personality_traits: personalityTraits.data || [],
    vault_work_style: workStyle.data || [],
    vault_values_motivations: values.data || [],
    vault_behavioral_indicators: behavioralIndicators.data || [],
    vault_confirmed_skills: confirmedSkills.data || [],
    vault_work_positions: workPositions.data || [],
    vault_education: education.data || [],
    vault_resume_milestones: resumeMilestones.data || [],
    vault_competitive_advantages: competitiveAdvantages.data || [],
    vault_professional_resources: professionalResources.data || [],
    vault_career_context: careerContext.data || null,
    vault_interview_responses: interviewResponses.data || []
  };
}

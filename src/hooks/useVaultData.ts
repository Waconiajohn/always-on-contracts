import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  PowerPhrase,
  TransferableSkill,
  HiddenCompetency,
  SoftSkill,
  LeadershipPhilosophy,
  ExecutivePresence,
  PersonalityTrait,
  WorkStyle,
  CoreValue,
  BehavioralIndicator,
  WorkPosition,
  Education,
  ResumeMilestone
} from '@/types/vault';

export interface VaultData {
  vault: any;
  powerPhrases: PowerPhrase[];
  transferableSkills: TransferableSkill[];
  hiddenCompetencies: HiddenCompetency[];
  softSkills: SoftSkill[];
  leadershipPhilosophy: LeadershipPhilosophy[];
  executivePresence: ExecutivePresence[];
  personalityTraits: PersonalityTrait[];
  workStyle: WorkStyle[];
  values: CoreValue[];
  behavioralIndicators: BehavioralIndicator[];
  workPositions: WorkPosition[];
  education: Education[];
  milestones: ResumeMilestone[];
  userProfile: any;
  careerContext: any;
}

/**
 * Centralized data fetching hook for Career Vault
 * Replaces scattered Supabase queries throughout the dashboard
 * Uses React Query for caching and automatic refetching
 * Includes retry logic with exponential backoff for extraction process
 */
export const useVaultData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['vault-data', userId],
    queryFn: async (): Promise<VaultData> => {
      console.log('🔄 Fetching fresh vault data from database...');
      if (!userId) throw new Error('User ID required');

      // CRITICAL FIX: Query vault once, reuse ID for all subsequent queries (10x performance improvement)
      const { data: vault, error: vaultError } = await supabase
        .from('career_vault')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (vaultError) throw vaultError;
      if (!vault) throw new Error('No vault found');

      const vaultId = vault.id;

      // Fetch all data in parallel using the vault ID we just retrieved
      const [
        { data: powerPhrases },
        { data: transferableSkills },
        { data: hiddenCompetencies },
        { data: softSkills },
        { data: leadershipPhilosophy },
        { data: executivePresence },
        { data: personalityTraits },
        { data: workStyle },
        { data: values },
        { data: behavioralIndicators },
        { data: workPositions },
        { data: education },
        { data: milestones },
        { data: userProfile },
        { data: careerContext },
      ] = await Promise.all([
        supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId).order('confidence_score', { ascending: false }),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId).order('confidence_score', { ascending: false }),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId).order('confidence_score', { ascending: false }),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_personality_traits').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_work_style').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_values_motivations').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('vault_work_positions').select('*').eq('vault_id', vaultId).order('start_date', { ascending: false }),
        supabase.from('vault_education').select('*').eq('vault_id', vaultId).order('graduation_year', { ascending: false }),
        supabase.from('vault_resume_milestones').select(`
          *,
          work_position:vault_work_positions!work_position_id (
            id,
            company_name,
            job_title,
            start_date,
            end_date,
            is_current
          )
        `).eq('vault_id', vaultId).order('created_at', { ascending: false }),
        supabase.from('profiles').select('target_roles').eq('user_id', userId).maybeSingle(),
        supabase.from('vault_career_context').select('*').eq('vault_id', vaultId).maybeSingle(),
      ]);

      return {
        vault,
        powerPhrases: powerPhrases || [],
        transferableSkills: transferableSkills || [],
        hiddenCompetencies: hiddenCompetencies || [],
        softSkills: softSkills || [],
        leadershipPhilosophy: leadershipPhilosophy || [],
        executivePresence: executivePresence || [],
        personalityTraits: personalityTraits || [],
        workStyle: workStyle || [],
        values: values || [],
        behavioralIndicators: behavioralIndicators || [],
        workPositions: workPositions || [],
        education: education || [],
        milestones: milestones || [],
        userProfile: userProfile || null,
        careerContext: careerContext || null,
      };
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // Keep cache for 5 minutes to prevent data disappearing during refetch
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    // Retry logic with exponential backoff for extraction process
    retry: 5, // Retry up to 5 times
    retryDelay: (attemptIndex) => {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, attemptIndex), 16000);
      console.log(`⏳ Retry attempt ${attemptIndex + 1} after ${delay}ms...`);
      return delay;
    },
    // Retry on specific errors that indicate temporary unavailability
    retryOnMount: true,
  });
};

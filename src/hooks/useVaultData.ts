import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VaultData {
  vault: any;
  powerPhrases: any[];
  transferableSkills: any[];
  hiddenCompetencies: any[];
  softSkills: any[];
  leadershipPhilosophy: any[];
  executivePresence: any[];
  personalityTraits: any[];
  workStyle: any[];
  values: any[];
  behavioralIndicators: any[];
  userProfile: any;
  careerContext: any;
}

/**
 * Centralized data fetching hook for Career Vault
 * Replaces scattered Supabase queries throughout the dashboard
 * Uses React Query for caching and automatic refetching
 */
export const useVaultData = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['vault-data', userId],
    queryFn: async (): Promise<VaultData> => {
      if (!userId) throw new Error('User ID required');

      // Fetch vault and all data in parallel for maximum performance
      const [
        { data: vault, error: vaultError },
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
        { data: userProfile },
        { data: careerContext },
      ] = await Promise.all([
        supabase.from('career_vault').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('vault_power_phrases').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('confidence_score', { ascending: false }),
        supabase.from('vault_transferable_skills').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('confidence_score', { ascending: false }),
        supabase.from('vault_hidden_competencies').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('confidence_score', { ascending: false }),
        supabase.from('vault_soft_skills').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('vault_executive_presence').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('vault_personality_traits').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('vault_work_style').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('vault_values_motivations').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').order('created_at', { ascending: false }),
        supabase.from('profiles').select('target_roles').eq('user_id', userId).maybeSingle(),
        supabase.from('vault_career_context').select('*').eq('vault_id', (await supabase.from('career_vault').select('id').eq('user_id', userId).single()).data?.id || '').maybeSingle(),
      ]);

      if (vaultError) throw vaultError;
      if (!vault) throw new Error('No vault found');

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
        userProfile: userProfile || null,
        careerContext: careerContext || null,
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
  });
};

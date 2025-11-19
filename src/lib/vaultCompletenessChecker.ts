import { supabase } from '@/integrations/supabase/client';

export interface VaultCompletenessResult {
  completeness: number; // 0-100 score
  missingCategories: Array<{
    name: string;
    current: number;
    recommended: number;
  }>;
  weakCategories: Array<{
    name: string;
    current: number;
    recommended: number;
  }>;
  isReady: boolean;
}

/**
 * Check Career Vault completeness to warn users about insufficient data
 * @param userId - User ID to check vault for
 */
export async function checkVaultCompleteness(userId: string): Promise<VaultCompletenessResult> {
  const { data: vault, error } = await supabase
    .from('career_vault')
    .select(`
      id,
      total_power_phrases,
      total_transferable_skills,
      total_hidden_competencies,
      total_soft_skills,
      total_leadership_philosophy,
      total_executive_presence,
      total_personality_traits,
      total_work_style,
      total_values,
      total_behavioral_indicators
    `)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !vault) {
    return {
      completeness: 0,
      missingCategories: [],
      weakCategories: [],
      isReady: false
    };
  }

  const missingCategories: VaultCompletenessResult['missingCategories'] = [];
  const weakCategories: VaultCompletenessResult['weakCategories'] = [];

  // Check each category against recommended minimums
  const checks = [
    { name: 'Power Phrases', field: 'total_power_phrases', min: 5, recommended: 15 },
    { name: 'Transferable Skills', field: 'total_transferable_skills', min: 3, recommended: 10 },
    { name: 'Hidden Competencies', field: 'total_hidden_competencies', min: 2, recommended: 8 },
    { name: 'Soft Skills', field: 'total_soft_skills', min: 3, recommended: 8 },
    { name: 'Leadership Philosophy', field: 'total_leadership_philosophy', min: 1, recommended: 3 },
    { name: 'Executive Presence', field: 'total_executive_presence', min: 1, recommended: 3 },
    { name: 'Work Style', field: 'total_work_style', min: 1, recommended: 3 },
    { name: 'Values', field: 'total_values', min: 2, recommended: 5 }
  ];

  let totalScore = 0;

  checks.forEach(check => {
    const current = vault[check.field as keyof typeof vault] as number || 0;
    
    if (current < check.min) {
      missingCategories.push({
        name: check.name,
        current,
        recommended: check.min
      });
      totalScore += 0;
    } else if (current < check.recommended) {
      weakCategories.push({
        name: check.name,
        current,
        recommended: check.recommended
      });
      totalScore += (current / check.recommended) * 100;
    } else {
      totalScore += 100;
    }
  });

  const completeness = Math.round(totalScore / checks.length);
  const isReady = completeness >= 60 && missingCategories.length === 0;

  return {
    completeness,
    missingCategories,
    weakCategories,
    isReady
  };
}

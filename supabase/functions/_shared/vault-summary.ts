export interface ShortVaultSummary {
  roleTitle: string;
  yearsExperience: number;
  seniorityLevel: string;
  topAchievements: string[]; // 3-5 power phrases
  coreCompetencies: string[]; // 5-7 skills
  industryContext: string;
  wordCount: number;
}

export async function generateShortVaultSummary(
  supabase: any,
  userId: string
): Promise<ShortVaultSummary> {
  // Fetch vault metadata first
  const { data: vault } = await supabase
    .from('career_vault')
    .select('id, initial_analysis, target_industries')
    .eq('user_id', userId)
    .single();

  if (!vault) {
    throw new Error('Career Vault not found');
  }

  // Fetch only what's needed for LinkedIn content
  const [phrasesResult, skillsResult] = await Promise.all([
    supabase
      .from('vault_power_phrases')
      .select('power_phrase')
      .eq('vault_id', vault.id)
      .order('confidence_score', { ascending: false })
      .limit(5),
    
    supabase
      .from('vault_transferable_skills')
      .select('stated_skill')
      .eq('vault_id', vault.id)
      .order('confidence_score', { ascending: false })
      .limit(7)
  ]);

  const analysis = vault.initial_analysis as any;
  
  const summary: ShortVaultSummary = {
    roleTitle: analysis?.current_role || 'Professional',
    yearsExperience: analysis?.years_of_experience || 5,
    seniorityLevel: analysis?.seniority_level || 'Mid-Level',
    topAchievements: phrasesResult.data?.map((p: any) => p.power_phrase) || [],
    coreCompetencies: skillsResult.data?.map((s: any) => s.stated_skill) || [],
    industryContext: vault.target_industries?.[0] || analysis?.industry || 'General',
    wordCount: 0 // Will calculate
  };

  // Calculate approximate word count
  const textContent = [
    summary.roleTitle,
    summary.seniorityLevel,
    ...summary.topAchievements,
    ...summary.coreCompetencies,
    summary.industryContext
  ].join(' ');
  
  summary.wordCount = textContent.split(/\s+/).length;
  
  console.log(`[Vault Summary] Generated ${summary.wordCount}-word summary for LinkedIn content`);
  
  return summary;
}

export function formatSummaryForPrompt(summary: ShortVaultSummary): string {
  return `CANDIDATE PROFILE:
Role: ${summary.roleTitle} (${summary.seniorityLevel}, ${summary.yearsExperience} years)
Industry: ${summary.industryContext}

TOP ACHIEVEMENTS:
${summary.topAchievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

CORE COMPETENCIES:
${summary.coreCompetencies.join(', ')}

Use these achievements and competencies to add credibility to the content. Cite specific examples.`;
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logger = createLogger('match-vault-to-requirements');

interface VaultMatch {
  vaultItemId: string;
  vaultCategory: string; // Which of the 20 intelligence categories
  content: any;
  matchScore: number; // 0-100
  matchReasons: string[];
  suggestedPlacement: 'summary' | 'experience' | 'skills' | 'achievements' | 'leadership' | 'projects';
  enhancedLanguage?: string; // AI-improved version for this specific job
  satisfiesRequirements: string[]; // Which requirements this addresses
  atsKeywords: string[]; // Keywords this content contains
  differentiatorScore: number; // How much this sets candidate apart (0-100)
  qualityTier?: 'gold' | 'silver' | 'bronze' | 'assumed'; // Quality verification level
  freshnessScore?: number; // Recency score (100 = recent, 20 = outdated)
}

interface MatchingResult {
  success: boolean;
  totalVaultItems: number;
  matchedItems: VaultMatch[];
  unmatchedRequirements: string[];
  coverageScore: number; // % of requirements covered
  differentiatorStrength: number; // How well positioned as benchmark candidate
  recommendations: {
    mustInclude: VaultMatch[]; // 90-100 match score
    stronglyRecommended: VaultMatch[]; // 70-89 match score
    consider: VaultMatch[]; // 50-69 match score
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      userId,
      jobRequirements,
      industryStandards,
      professionBenchmarks,
      atsKeywords
    } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Matching vault to requirements for user:', userId);

    // Combine all requirements for matching first (needed for early returns)
    const allRequirements = [
      ...(jobRequirements?.required || []),
      ...(jobRequirements?.preferred || []),
      ...(jobRequirements?.niceToHave || []),
      ...(industryStandards || []).map((s: any) => ({
        requirement: s.standard,
        keywords: [s.category],
        importance: s.commonInTopPerformers ? 8 : 6,
        source: 'industry_standard'
      })),
      ...(professionBenchmarks || []).map((b: any) => ({
        requirement: b.competency,
        keywords: [b.competencyArea],
        importance: b.importanceForRole >= 8 ? 9 : 7,
        source: 'profession_benchmark'
      }))
    ];

    // Create requirement index for matching - store both text and normalized version
    const requirementTexts = allRequirements.map((r: any) => r.requirement);
    console.log('[MATCH] Total requirements to match:', requirementTexts.length);

    // Fetch vault
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (vaultError) {
      console.error('Error fetching vault:', vaultError);
      throw new Error('Could not fetch career vault data');
    }

    if (!vault) {
      console.log('No vault found for user');
      return new Response(JSON.stringify({
        success: false,
        error: 'No career vault found',
        totalVaultItems: 0,
        matchedItems: [],
        unmatchedRequirements: allRequirements,
        coverageScore: 0,
        differentiatorStrength: 0,
        recommendations: {
          mustInclude: [],
          stronglyRecommended: [],
          consider: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch ALL vault intelligence categories in parallel (17 total)
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
      education,
      resumeMilestones,
      competitiveAdvantages,
      professionalResources,
      careerContext,
      interviewResponses
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vault.id),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vault.id),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vault.id),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vault.id),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vault.id),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vault.id),
      supabase.from('vault_personality_traits').select('*').eq('vault_id', vault.id),
      supabase.from('vault_work_style').select('*').eq('vault_id', vault.id),
      supabase.from('vault_values_motivations').select('*').eq('vault_id', vault.id),
      supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vault.id),
      supabase.from('vault_confirmed_skills').select('*').eq('vault_id', vault.id),
      supabase.from('vault_education').select('*').eq('vault_id', vault.id),
      supabase.from('vault_resume_milestones').select(`
        *,
        work_position:vault_work_positions!work_position_id (
          id,
          company_name,
          job_title,
          start_date,
          end_date,
          is_current,
          description
        )
      `).eq('vault_id', vault.id),
      supabase.from('vault_competitive_advantages').select('*').eq('vault_id', vault.id),
      supabase.from('vault_professional_resources').select('*').eq('vault_id', vault.id),
      supabase.from('vault_career_context').select('*').eq('vault_id', vault.id).maybeSingle(),
      supabase.from('vault_interview_responses').select('*').eq('vault_id', vault.id)
    ]);

    // Log comprehensive vault data counts for debugging
    console.log('[VAULT-QUERY] Fetched categories:', {
      powerPhrases: powerPhrases.data?.length || 0,
      transferableSkills: transferableSkills.data?.length || 0,
      hiddenCompetencies: hiddenCompetencies.data?.length || 0,
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

    const vaultData = {
      ...vault,
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
      vault_education: education.data || [],
      vault_resume_milestones: resumeMilestones.data || [],
      vault_competitive_advantages: competitiveAdvantages.data || [],
      vault_professional_resources: professionalResources.data || [],
      vault_career_context: careerContext.data || null,
      vault_interview_responses: interviewResponses.data || []
    };

    console.log('Vault data fetched successfully');

    const matches: VaultMatch[] = [];

    // Process ALL vault categories (17 total - comprehensive coverage)
    const vaultCategories = [
      { name: 'power_phrases', data: vaultData.vault_power_phrases, type: 'achievement' },
      { name: 'transferable_skills', data: vaultData.vault_transferable_skills, type: 'skill' },
      { name: 'hidden_competencies', data: vaultData.vault_hidden_competencies, type: 'differentiator' },
      { name: 'soft_skills', data: vaultData.vault_soft_skills, type: 'soft-skill' },
      { name: 'leadership_philosophy', data: vaultData.vault_leadership_philosophy, type: 'leadership' },
      { name: 'executive_presence', data: vaultData.vault_executive_presence, type: 'leadership' },
      { name: 'personality_traits', data: vaultData.vault_personality_traits, type: 'cultural-fit' },
      { name: 'work_style', data: vaultData.vault_work_style, type: 'cultural-fit' },
      { name: 'values_motivations', data: vaultData.vault_values_motivations, type: 'cultural-fit' },
      { name: 'behavioral_indicators', data: vaultData.vault_behavioral_indicators, type: 'evidence' },
      { name: 'confirmed_skills', data: vaultData.vault_confirmed_skills, type: 'technical-skill' },
      { name: 'education', data: vaultData.vault_education, type: 'credential' },
      { name: 'resume_milestones', data: vaultData.vault_resume_milestones, type: 'experience' },
      { name: 'competitive_advantages', data: vaultData.vault_competitive_advantages, type: 'differentiator' },
      { name: 'professional_resources', data: vaultData.vault_professional_resources, type: 'resource' },
      { name: 'career_context', data: vaultData.vault_career_context ? [vaultData.vault_career_context] : [], type: 'context' },
      { name: 'interview_responses', data: vaultData.vault_interview_responses, type: 'expanded' }
    ];

    // Helper: Production-grade JSON extraction
    const safeJSONParse = (text: string) => {
      const result = extractJSON(text);
      if (!result.success) {
        logger.error('JSON parsing failed', {
          error: result.error,
          content: text.substring(0, 500)
        });
        return null;
      }
      return result.data;
    };

    // Use Perplexity AI to intelligently match vault items to requirements
    try {
      // Compact vault data to prevent token overflow
      const compactVault = vaultCategories.map(cat => ({
        category: cat.name,
        type: cat.type,
        items: (Array.isArray(cat.data) ? cat.data : [cat.data])
          .filter(Boolean)
          // Prioritize by quality tier: Gold > Silver > Bronze > Assumed
          .sort((a: any, b: any) => {
            const tierPriority = { gold: 4, silver: 3, bronze: 2, assumed: 1 };
            const aTier = tierPriority[a.quality_tier as keyof typeof tierPriority] || 0;
            const bTier = tierPriority[b.quality_tier as keyof typeof tierPriority] || 0;
            if (aTier !== bTier) return bTier - aTier; // Higher tier first
            // If same tier, prioritize by freshness
            return (b.freshness_score || 0) - (a.freshness_score || 0);
          })
          .slice(0, 15) // Increased limit to get more high-quality items
          .map((item: any) => ({
            id: item.id,
            quality_tier: item.quality_tier || 'assumed',
            freshness_score: item.freshness_score || 50,
            // Only include essential fields to reduce payload
            ...(item.phrase && { phrase: item.phrase }),
            ...(item.skill && { skill: item.skill }),
            ...(item.competency && { competency: item.competency }),
            ...(item.trait && { trait: item.trait }),
            ...(item.question && { question: item.question }),
            ...(item.answer && { answer: item.answer.substring(0, 200) }), // Truncate long answers
          }))
      }));

      const matchingPrompt = `You are an expert resume strategist. Match career vault items to job requirements to create a BENCHMARK CANDIDATE.

REQUIREMENTS TO SATISFY:
${JSON.stringify(allRequirements.slice(0, 20), null, 2)}

ATS KEYWORDS NEEDED:
Critical: ${(atsKeywords?.critical || []).slice(0, 15).join(', ')}
Important: ${(atsKeywords?.important || []).slice(0, 15).join(', ')}

CAREER VAULT DATA (sorted by quality tier - gold is most trusted):
${JSON.stringify(compactVault, null, 2)}

QUALITY TIERS EXPLAINED:
- GOLD: Quiz-verified competencies (highest trust - use preferentially)
- SILVER: Evidence-based from resume/interviews (high trust)
- BRONZE: AI-inferred from behavior/patterns (medium trust)
- ASSUMED: AI assumptions (lowest trust - use only if needed)

For each vault item, determine:
1. Match score (0-100) - how well it addresses requirements
   IMPORTANT: Boost match score by +10 for gold tier, +5 for silver tier
2. Which specific requirements it satisfies
3. Suggested resume placement (summary/experience/skills/achievements/leadership/projects)
4. Enhanced language - rewrite the vault item to perfectly match THIS job's language and keywords
5. ATS keywords present in this content
6. Differentiator score (0-100) - how much this sets candidate apart from others

CRITICAL INSTRUCTIONS:
1. You MUST use the EXACT vaultCategory name from the CAREER VAULT DATA above.
   Valid categories are: power_phrases, transferable_skills, hidden_competencies, soft_skills,
   leadership_philosophy, executive_presence, personality_traits, work_style, values_motivations,
   behavioral_indicators, confirmed_skills, education, resume_milestones, competitive_advantages,
   professional_resources, career_context, interview_responses
   
   DO NOT make up category names. DO NOT use generic names like "achievement" or "skill".
   USE THE EXACT CATEGORY NAME from the vault data (e.g., "power_phrases", NOT "phrases").

2. For "satisfiesRequirements", you MUST use the EXACT requirement text from the list below.
   DO NOT paraphrase or summarize. Copy the exact text even if it's long.
   
   EXACT REQUIREMENTS TO MATCH:
   ${requirementTexts.map((r: string, i: number) => `${i + 1}. "${r}"`).join('\n   ')}

Prioritize:
1. GOLD tier items (quiz-verified) - use these first
2. Items that address multiple requirements
3. Content with ATS-critical keywords
4. Differentiators that make candidate stand out
5. Quantified achievements and specific examples
6. SILVER tier items (evidence-based) over bronze/assumed

Return ONLY valid JSON:
{
  "matches": [
    {
      "vaultItemId": "uuid-or-index",
      "vaultCategory": "power_phrases",
      "content": {...original vault item...},
      "matchScore": 95,
      "matchReasons": ["Addresses leadership requirement", "Contains ATS keyword 'agile'", "Gold tier - quiz verified"],
      "suggestedPlacement": "experience",
      "enhancedLanguage": "Led cross-functional agile teams of 15+ engineers...",
      "satisfiesRequirements": ["EXACT text from requirements list above - e.g., '5+ years of leadership experience managing engineering teams'"],
      "atsKeywords": ["leadership", "agile", "cross-functional"],
      "differentiatorScore": 85,
      "qualityTier": "gold",
      "freshnessScore": 100
    }
  ]
}

NOTE: The "unmatchedRequirements" field will be calculated automatically - DO NOT include it in your response.`;

      const { response, metrics } = await callLovableAI(
        {
          messages: [{ role: 'user', content: matchingPrompt }],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.4,
          max_tokens: 4096,
          response_format: { type: 'json_object' }
        },
        'match-vault-to-requirements',
        userId
      );

      await logAIUsage(metrics);

      const rawContent = response.choices?.[0]?.message?.content || '{}';
      console.log('[match-vault-to-requirements] Raw AI response:', rawContent.substring(0, 500));
      const parsed = safeJSONParse(rawContent);

      if (parsed?.matches && Array.isArray(parsed.matches)) {
        matches.push(...parsed.matches.slice(0, 50));
        console.log(`[match-vault-to-requirements] AI matched ${parsed.matches.length} vault items`);

        // Validate match fields
        if (parsed.matches.length > 0) {
          const firstMatch = parsed.matches[0];
          if (!firstMatch.matchScore || typeof firstMatch.matchScore !== 'number') {
            console.warn('[match-vault-to-requirements] Matches missing matchScore field');
          }
        }
      } else {
        console.warn('[match-vault-to-requirements] AI response missing matches array, using fallback');
      }
    } catch (error) {
      console.error('Error in AI matching:', error);
    }

    // Fallback: Basic keyword matching if AI fails
    if (matches.length === 0) {
      console.log('Using fallback keyword matching');
      // Simple keyword-based matching as fallback
      vaultCategories.forEach(category => {
        if (!category.data) return;

        const items = Array.isArray(category.data) ? category.data : [category.data];

        items.forEach((item: any, index: number) => {
          const itemText = JSON.stringify(item).toLowerCase();
          let matchScore = 0;
          const satisfiesReqs: string[] = [];
          const foundKeywords: string[] = [];

          allRequirements.forEach((req: any) => {
            if (req.keywords && Array.isArray(req.keywords)) {
              req.keywords.forEach((keyword: string) => {
                // Safety check: ensure keyword exists and is a valid string
                if (keyword && typeof keyword === 'string' && itemText.includes(keyword.toLowerCase())) {
                  matchScore += req.importance || 5;
                  satisfiesReqs.push(req.requirement);
                  foundKeywords.push(keyword);
                }
              });
            }
          });

          if (matchScore > 0) {
            // Boost score based on quality tier
            const qualityTier = item.quality_tier || 'assumed';
            const tierBonus = qualityTier === 'gold' ? 10 : qualityTier === 'silver' ? 5 : 0;
            const adjustedScore = Math.min(matchScore + tierBonus, 100);

            matches.push({
              vaultItemId: item.id || `${category.name}-${index}`,
              vaultCategory: category.name,
              content: item,
              matchScore: adjustedScore,
              matchReasons: [
                `Matches ${foundKeywords.length} keywords`,
                ...(qualityTier === 'gold' ? ['Gold tier - quiz verified'] :
                    qualityTier === 'silver' ? ['Silver tier - evidence based'] : [])
              ],
              suggestedPlacement: category.type === 'achievement' ? 'achievements' :
                                  category.type === 'skill' ? 'skills' :
                                  category.type === 'experience' ? 'experience' : 'summary',
              satisfiesRequirements: [...new Set(satisfiesReqs)],
              atsKeywords: foundKeywords,
              differentiatorScore: category.type === 'differentiator' ? 80 : 50,
              qualityTier: qualityTier,
              freshnessScore: item.freshness_score || 50
            });
          }
        });
      });
    }

    // Sort matches by quality tier first, then score
    matches.sort((a, b) => {
      const tierPriority = { gold: 4, silver: 3, bronze: 2, assumed: 1 };
      const aTier = tierPriority[a.qualityTier as keyof typeof tierPriority] || 0;
      const bTier = tierPriority[b.qualityTier as keyof typeof tierPriority] || 0;

      // If same quality tier, sort by match score
      if (aTier === bTier) {
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // If same score, sort by freshness
        return (b.freshnessScore || 0) - (a.freshnessScore || 0);
      }

      // Higher quality tier first
      return bTier - aTier;
    });

    // Calculate which requirements were satisfied by matches (with threshold)
    const uniqueRequirementsCovered = new Set<string>();
    matches.forEach(m => {
      if (m.matchScore >= 70) {
        m.satisfiesRequirements.forEach(req => uniqueRequirementsCovered.add(req));
      }
    });

    // Also track ALL satisfied requirements regardless of score (for unmatched calculation)
    const allSatisfiedRequirements = new Set<string>();
    matches.forEach(match => {
      if (match.satisfiesRequirements && Array.isArray(match.satisfiesRequirements)) {
        match.satisfiesRequirements.forEach((satisfied: string) => {
          allSatisfiedRequirements.add(satisfied);
        });
      }
    });

    // Find unmatched requirements
    const unmatchedReqs = requirementTexts.filter((req: string) => !allSatisfiedRequirements.has(req));
    
    console.log('[MATCH] Satisfied requirements (score >= 70):', uniqueRequirementsCovered.size);
    console.log('[MATCH] All satisfied requirements:', allSatisfiedRequirements.size);
    console.log('[MATCH] Unmatched requirements count:', unmatchedReqs.length);
    if (unmatchedReqs.length > 0 && unmatchedReqs.length <= 5) {
      console.log('[MATCH] All unmatched requirements:', unmatchedReqs);
    } else if (unmatchedReqs.length > 5) {
      console.log('[MATCH] Sample unmatched requirements:', unmatchedReqs.slice(0, 5));
    }

    const result: MatchingResult = {
      success: true,
      totalVaultItems: vaultCategories.reduce((sum, cat) =>
        sum + (Array.isArray(cat.data) ? cat.data.length : (cat.data ? 1 : 0)), 0
      ),
      matchedItems: matches,
      unmatchedRequirements: unmatchedReqs,
      coverageScore: Math.round(
        (requirementTexts.length > 0 ?
          allSatisfiedRequirements.size / requirementTexts.length : 0
        ) * 100
      ),
      differentiatorStrength: Math.round(
        matches.reduce((sum, m) => sum + m.differentiatorScore, 0) /
        Math.max(matches.length, 1)
      ),
      recommendations: {
        mustInclude: matches.filter(m => m.matchScore >= 90),
        stronglyRecommended: matches.filter(m => m.matchScore >= 70 && m.matchScore < 90),
        consider: matches.filter(m => m.matchScore >= 50 && m.matchScore < 70)
      }
    };

    console.log('Matching complete:', {
      totalMatches: matches.length,
      mustInclude: result.recommendations.mustInclude.length,
      stronglyRecommended: result.recommendations.stronglyRecommended.length,
      coverageScore: result.coverageScore
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in match-vault-to-requirements:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        totalVaultItems: 0,
        matchedItems: [],
        unmatchedRequirements: [],
        coverageScore: 0,
        differentiatorStrength: 0,
        recommendations: { mustInclude: [], stronglyRecommended: [], consider: [] }
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
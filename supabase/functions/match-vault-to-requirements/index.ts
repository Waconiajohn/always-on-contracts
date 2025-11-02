import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Fetch ALL vault intelligence using centralized function (ensures all 10 tables)
    const { data: vaultResponse, error: vaultError } = await supabase.functions.invoke('get-vault-data', {
      body: { userId }
    });

    if (vaultError || !vaultResponse?.data) {
      throw new Error('Could not fetch career vault data');
    }

    const vaultData = {
      ...vaultResponse.data.vault,
      vault_power_phrases: vaultResponse.data.intelligence.powerPhrases,
      vault_transferable_skills: vaultResponse.data.intelligence.transferableSkills,
      vault_hidden_competencies: vaultResponse.data.intelligence.hiddenCompetencies,
      vault_soft_skills: vaultResponse.data.intelligence.softSkills,
      vault_leadership_philosophy: vaultResponse.data.intelligence.leadershipPhilosophy,
      vault_executive_presence: vaultResponse.data.intelligence.executivePresence,
      vault_personality_traits: vaultResponse.data.intelligence.personalityTraits,
      vault_work_style: vaultResponse.data.intelligence.workStyle,
      vault_values_motivations: vaultResponse.data.intelligence.values,
      vault_behavioral_indicators: vaultResponse.data.intelligence.behavioralIndicators
    };

    if (vaultError || !vaultData) {
      throw new Error('Could not fetch career vault data');
    }

    console.log('Vault data fetched successfully');

    // Combine all requirements for matching
    const allRequirements = [
      ...(jobRequirements?.required || []),
      ...(jobRequirements?.preferred || []),
      ...(jobRequirements?.niceToHave || []),
      ...(industryStandards || []).map((s: any) => ({
        requirement: s.standard,
        keywords: [s.category],
        importance: s.commonInTopPerformers ? 8 : 6,
        type: s.category
      })),
      ...(professionBenchmarks || []).map((b: any) => ({
        requirement: b.standard,
        keywords: [b.category],
        importance: 9,
        type: b.category,
        isDifferentiator: true
      }))
    ];

    const matches: VaultMatch[] = [];

    // Process each vault category
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
      { name: 'resume_milestones', data: vaultData.vault_resume_milestones, type: 'experience' },
      { name: 'interview_responses', data: vaultData.vault_interview_responses, type: 'expanded' }
    ];

    // Helper: Safe JSON parse with fallback
    const safeJSONParse = (text: string) => {
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(cleaned);
      } catch (e) {
        console.error('JSON parse error:', e);
        return null;
      }
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

CRITICAL INSTRUCTION: You MUST use the EXACT vaultCategory name from the CAREER VAULT DATA above.
Valid categories are: power_phrases, transferable_skills, hidden_competencies, soft_skills,
leadership_philosophy, executive_presence, personality_traits, work_style, values_motivations,
behavioral_indicators, resume_milestones, interview_responses

DO NOT make up category names. DO NOT use generic names like "achievement" or "skill".
USE THE EXACT CATEGORY NAME from the vault data (e.g., "power_phrases", NOT "phrases").

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
      "satisfiesRequirements": ["5+ years leadership", "Agile methodology"],
      "atsKeywords": ["leadership", "agile", "cross-functional"],
      "differentiatorScore": 85,
      "qualityTier": "gold",
      "freshnessScore": 100
    }
  ],
  "unmatchedRequirements": ["Requirements with no vault coverage"]
}`;

      const { response, metrics } = await callPerplexity(
        {
          messages: [{ role: 'user', content: matchingPrompt }],
          model: PERPLEXITY_MODELS.DEFAULT,
          temperature: 0.4,
          max_tokens: 4096
        },
        'match-vault-to-requirements',
        userId
      );

      await logAIUsage(metrics);

      const textContent = response.choices?.[0]?.message?.content || '{}';
      const parsed = safeJSONParse(textContent);

      if (parsed?.matches && Array.isArray(parsed.matches)) {
        matches.push(...parsed.matches.slice(0, 50));
        console.log(`AI matched ${parsed.matches.length} vault items`);
      } else {
        console.warn('AI response missing matches array, using fallback');
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
                if (itemText.includes(keyword.toLowerCase())) {
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

    // Calculate coverage score based on UNIQUE requirements satisfied
    const uniqueRequirementsCovered = new Set<string>();
    matches.forEach(m => {
      if (m.matchScore >= 70) {
        m.satisfiesRequirements.forEach(req => uniqueRequirementsCovered.add(req));
      }
    });

    const result: MatchingResult = {
      success: true,
      totalVaultItems: vaultCategories.reduce((sum, cat) =>
        sum + (Array.isArray(cat.data) ? cat.data.length : (cat.data ? 1 : 0)), 0
      ),
      matchedItems: matches,
      unmatchedRequirements: allRequirements
        .map((r: any) => r.requirement)
        .filter((req: string) =>
          !matches.some(m => m.satisfiesRequirements.includes(req))
        ),
      coverageScore: Math.round(
        (allRequirements.length > 0 ?
          uniqueRequirementsCovered.size / allRequirements.length : 0
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
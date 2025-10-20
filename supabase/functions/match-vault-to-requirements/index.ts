import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

    // Fetch ALL 20 intelligence categories from Career Vault
    const { data: vaultData, error: vaultError } = await supabase
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(*),
        vault_transferable_skills(*),
        vault_hidden_competencies(*),
        vault_soft_skills(*),
        vault_leadership_philosophy(*),
        vault_executive_presence(*),
        vault_personality_traits(*),
        vault_work_style(*),
        vault_values_motivations(*),
        vault_behavioral_indicators(*),
        vault_resume_milestones(*),
        vault_interview_responses(*)
      `)
      .eq('user_id', userId)
      .single();

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

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
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

    // Use Lovable AI to intelligently match vault items to requirements
    if (lovableKey) {
      // Compact vault data to prevent token overflow
      const compactVault = vaultCategories.map(cat => ({
        category: cat.name,
        type: cat.type,
        items: (Array.isArray(cat.data) ? cat.data : [cat.data])
          .filter(Boolean)
          .slice(0, 10) // Limit to top 10 items per category
          .map((item: any) => ({
            id: item.id,
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

CAREER VAULT DATA:
${JSON.stringify(compactVault, null, 2)}

For each vault item, determine:
1. Match score (0-100) - how well it addresses requirements
2. Which specific requirements it satisfies
3. Suggested resume placement (summary/experience/skills/achievements/leadership/projects)
4. Enhanced language - rewrite the vault item to perfectly match THIS job's language and keywords
5. ATS keywords present in this content
6. Differentiator score (0-100) - how much this sets candidate apart from others

Prioritize:
- Items that address multiple requirements
- Content with ATS-critical keywords
- Differentiators that make candidate stand out
- Quantified achievements and specific examples

Return ONLY valid JSON:
{
  "matches": [
    {
      "vaultItemId": "uuid-or-index",
      "vaultCategory": "power_phrases",
      "content": {...original vault item...},
      "matchScore": 95,
      "matchReasons": ["Addresses leadership requirement", "Contains ATS keyword 'agile'"],
      "suggestedPlacement": "experience",
      "enhancedLanguage": "Led cross-functional agile teams of 15+ engineers...",
      "satisfiesRequirements": ["5+ years leadership", "Agile methodology"],
      "atsKeywords": ["leadership", "agile", "cross-functional"],
      "differentiatorScore": 85
    }
  ],
  "unmatchedRequirements": ["Requirements with no vault coverage"]
}`;

      try {
        const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: matchingPrompt }],
            temperature: 0.4,
            max_tokens: 4096 // Reduced to prevent truncation
          })
        });

        if (lovableResponse.ok) {
          const lovableData = await lovableResponse.json();
          const textContent = lovableData.choices?.[0]?.message?.content || '{}';
          const parsed = safeJSONParse(textContent);

          if (parsed?.matches && Array.isArray(parsed.matches)) {
            matches.push(...parsed.matches.slice(0, 50)); // Limit results
            console.log(`AI matched ${parsed.matches.length} vault items`);
          } else {
            console.warn('AI response missing matches array, using fallback');
          }
        } else {
          console.error('AI API error:', lovableResponse.status, await lovableResponse.text());
        }
      } catch (error) {
        console.error('Error in AI matching:', error);
      }
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
            matches.push({
              vaultItemId: item.id || `${category.name}-${index}`,
              vaultCategory: category.name,
              content: item,
              matchScore: Math.min(matchScore, 100),
              matchReasons: [`Matches ${foundKeywords.length} keywords`],
              suggestedPlacement: category.type === 'achievement' ? 'achievements' :
                                  category.type === 'skill' ? 'skills' :
                                  category.type === 'experience' ? 'experience' : 'summary',
              satisfiesRequirements: [...new Set(satisfiesReqs)],
              atsKeywords: foundKeywords,
              differentiatorScore: category.type === 'differentiator' ? 80 : 50
            });
          }
        });
      });
    }

    // Sort matches by score and categorize
    matches.sort((a, b) => b.matchScore - a.matchScore);

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
        (1 - (allRequirements.length > 0 ?
          matches.filter(m => m.matchScore >= 70).length / allRequirements.length : 0)
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
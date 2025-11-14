import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentHeadline, currentAbout, targetRole, industry, skills } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let vaultContext = '';
    let userId = undefined;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );

      if (user) {
        userId = user.id;
        // Fetch ALL Career Vault data (10 intelligence categories)
        const { data: vault } = await supabase
          .from('career_vault')
          .select(`
            *,
            vault_power_phrases(power_phrase, impact_metrics, category),
            vault_transferable_skills(stated_skill, evidence, proficiency_level),
            vault_hidden_competencies(competency_area, inferred_capability),
            vault_soft_skills(skill_category, specific_skill),
            vault_leadership_philosophy(philosophy_statement, leadership_style, core_principles),
            vault_executive_presence(indicator_type, specific_behavior, context),
            vault_personality_traits(trait_name, behavioral_evidence),
            vault_work_style(style_category, specific_preference),
            vault_values_motivations(value_name, manifestation, importance_level),
            vault_behavioral_indicators(indicator_type, specific_behavior, outcome_pattern)
          `)
          .eq('user_id', user.id)
          .single();

        if (vault) {
          vaultContext = `

CAREER VAULT INTELLIGENCE:

TOP ACHIEVEMENTS (use these specific metrics in profile):
${vault.vault_power_phrases?.slice(0, 10).map((p: any) => 
  `- ${p.power_phrase} (Metrics: ${p.impact_metrics})`
).join('\n') || 'None available'}

CORE COMPETENCIES (highlight these skills):
${vault.vault_transferable_skills?.slice(0, 5).map((s: any) => 
  `- ${s.stated_skill}: ${s.evidence} (${s.proficiency_level})`
).join('\n') || 'None available'}

SOFT SKILLS & INTERPERSONAL:
${vault.vault_soft_skills?.slice(0, 5).map((s: any) => 
  `- ${s.skill_category}: ${s.specific_skill}`
).join('\n') || 'None available'}

LEADERSHIP PHILOSOPHY:
${vault.vault_leadership_philosophy?.slice(0, 2).map((l: any) => 
  `- ${l.philosophy_statement} (Style: ${l.leadership_style})`
).join('\n') || 'None available'}

EXECUTIVE PRESENCE INDICATORS:
${vault.vault_executive_presence?.slice(0, 3).map((e: any) => 
  `- ${e.indicator_type}: ${e.specific_behavior}`
).join('\n') || 'None available'}

PERSONALITY TRAITS (authentic humanization):
${vault.vault_personality_traits?.slice(0, 3).map((p: any) => 
  `- ${p.trait_name}: ${p.behavioral_evidence}`
).join('\n') || 'None available'}

WORK STYLE PREFERENCES:
${vault.vault_work_style?.slice(0, 2).map((w: any) => 
  `- ${w.style_category}: ${w.specific_preference}`
).join('\n') || 'None available'}

VALUES & MOTIVATIONS:
${vault.vault_values_motivations?.slice(0, 3).map((v: any) => 
  `- ${v.value_name}: ${v.manifestation} (${v.importance_level})`
).join('\n') || 'None available'}

DIFFERENTIATORS (unique selling points):
${vault.vault_hidden_competencies?.slice(0, 3).map((c: any) => 
  `- ${c.competency_area}: ${c.inferred_capability}`
).join('\n') || 'None available'}`;
        }
      }
    }

    const systemPrompt = `You are an elite LinkedIn profile optimization expert specializing in executive branding and recruiter psychology.

PROFILE OPTIMIZATION FRAMEWORK:

HEADLINE OPTIMIZATION (120 characters):
- Formula: [Role/Identity] | [Value Proposition] | [Unique Differentiator]
- Include searchable keywords (avoid buzzwords)
- Lead with impact, not job title
- Example: "VP Product → 3 SaaS Unicorns | Building AI-First Teams | Ex-Google, Stanford MBA"

ABOUT SECTION OPTIMIZATION (2600 characters max):
Structure:
1. HOOK (First 2 lines - visible without "see more"):
   - Provocative statement or compelling question
   - Pattern interruption for profile visitors

2. CREDIBILITY STACK (Lines 3-6):
   - Quantified achievements
   - Brand-name experience
   - Unique expertise intersection

3. VALUE NARRATIVE (Main body):
   - Problem you solve
   - Approach/methodology
   - Results delivered (with numbers)
   - Client/company types you serve

4. PERSONAL TOUCH:
   - Authentic detail (hobby, passion, quirk)
   - Humanizes expertise

5. CALL-TO-ACTION:
   - How to connect
   - What collaboration looks like
   - Contact preference

KEYWORD OPTIMIZATION:
- Identify top 15 recruiter search terms for target role
- Natural integration (no keyword stuffing)
- Front-load important terms
- Include role variations and synonyms

SKILLS PRIORITIZATION:
- Top 3 skills weighted heavily by algorithm
- Balance hard skills + leadership skills
- Endorsement magnets (clear, specific)
- Industry-standard terminology

SCORING DIMENSIONS (0-100):
- Keyword density and placement
- Headline impact and clarity
- About section storytelling
- Skills relevance and endorsability
- Overall recruiter appeal

Return JSON:
{
  "optimizedHeadline": "New headline",
  "optimizedAbout": "Full about section with line breaks",
  "prioritizedSkills": ["Skill 1", "Skill 2", ...],
  "keywordStrategy": {
    "primary": ["keyword1", "keyword2"],
    "secondary": ["keyword3", "keyword4"],
    "placement": "Where to emphasize keywords"
  },
  "optimizationScore": 0-100,
  "improvements": [
    { "area": "headline|about|skills", "change": "What changed", "impact": "Why it matters" }
  ],
  "recruiterAppeal": "Score with reasoning",
  "beforeAfterComparison": {
    "searchability": "Before: X/10, After: Y/10",
    "clarity": "Assessment",
    "memorability": "Assessment"
  }
}`;

    const userPrompt = `Optimize this LinkedIn profile:

CURRENT HEADLINE: ${currentHeadline || 'Not provided'}
CURRENT ABOUT: ${currentAbout || 'Not provided'}
TARGET ROLE: ${targetRole}
INDUSTRY: ${industry}
CURRENT SKILLS: ${Array.isArray(skills) ? skills.join(', ') : 'Not provided'}
${vaultContext}

Use the Career Vault achievements and metrics to create an EVIDENCE-BASED profile. Every claim should tie back to specific accomplishments.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'medium',
          requiresReasoning: true
        }),
        temperature: 0.7,
        max_tokens: 2000,
        return_citations: false,
      },
      'optimize-linkedin-profile',
      userId
    );

    await logAIUsage(metrics);

    const optimizationResult = cleanCitations(response.choices[0].message.content);

    let parsedResult;
    try {
      const jsonMatch = optimizationResult.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : optimizationResult);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        optimizedHeadline: currentHeadline,
        optimizedAbout: currentAbout,
        prioritizedSkills: skills || [],
        keywordStrategy: { primary: [], secondary: [], placement: "" },
        optimizationScore: 50,
        improvements: [],
        recruiterAppeal: "Analysis unavailable"
      };
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in optimize-linkedin-profile:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TopicSuggestion {
  topic: string;
  hook: string;
  angle: 'how-to' | 'lessons-learned' | 'case-study' | 'counterintuitive' | 'list';
  estimatedEngagement: 'low' | 'medium' | 'high';
  vaultItemsUsed: string[];
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating LinkedIn topic suggestions from vault for user:', user.id);

    // Fetch top vault items (power phrases with metrics, transferable skills)
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(id, power_phrase, category, impact_metrics, confidence_score, quality_tier),
        vault_transferable_skills(id, stated_skill, evidence, confidence_score, quality_tier),
        vault_hidden_competencies(id, competency_area, inferred_capability, confidence_score, quality_tier)
      `)
      .eq('user_id', user.id)
      .single();

    if (vaultError || !vault) {
      throw new Error('Could not fetch vault data');
    }

    // Filter and sort power phrases (prioritize Gold/Silver, high confidence, with metrics)
    const topPowerPhrases = (vault.vault_power_phrases || [])
      .filter((p: any) => {
        // Must have actual content
        if (!p.power_phrase || p.power_phrase.trim().length < 10) return false;

        // Prioritize items with metrics or high quality
        const hasMetrics = p.impact_metrics && Object.keys(p.impact_metrics).length > 0;
        const isHighQuality = p.quality_tier === 'gold' || p.quality_tier === 'silver';
        const isHighConfidence = (p.confidence_score || 0) >= 0.7;

        return hasMetrics || isHighQuality || isHighConfidence;
      })
      .sort((a: any, b: any) => {
        // Sort by quality tier, then confidence
        const tierPriority: any = { gold: 4, silver: 3, bronze: 2, assumed: 1 };
        const aTier = tierPriority[a.quality_tier] || 0;
        const bTier = tierPriority[b.quality_tier] || 0;

        if (aTier !== bTier) return bTier - aTier;
        return (b.confidence_score || 0) - (a.confidence_score || 0);
      })
      .slice(0, 10); // Top 10 power phrases

    // Get top transferable skills
    const topSkills = (vault.vault_transferable_skills || [])
      .filter((s: any) => s.stated_skill && s.evidence)
      .sort((a: any, b: any) => (b.confidence_score || 0) - (a.confidence_score || 0))
      .slice(0, 5);

    // Get top hidden competencies (differentiators)
    const topCompetencies = (vault.vault_hidden_competencies || [])
      .filter((c: any) => c.competency_area && c.inferred_capability)
      .sort((a: any, b: any) => (b.confidence_score || 0) - (a.confidence_score || 0))
      .slice(0, 5);

    if (topPowerPhrases.length === 0 && topSkills.length === 0 && topCompetencies.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          topics: [],
          message: 'No vault items available yet. Complete your Career Vault to get topic suggestions.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI
    const vaultContext = {
      powerPhrases: topPowerPhrases.map((p: any) => ({
        id: p.id,
        phrase: p.power_phrase,
        category: p.category,
        metrics: p.impact_metrics
      })),
      skills: topSkills.map((s: any) => ({
        id: s.id,
        skill: s.stated_skill,
        evidence: s.evidence
      })),
      competencies: topCompetencies.map((c: any) => ({
        id: c.id,
        area: c.competency_area,
        capability: c.inferred_capability
      }))
    };

    // Generate topic suggestions using AI
    const prompt = `You are a LinkedIn content strategist. Based on this professional's career achievements, suggest 5 engaging LinkedIn post topics.

CAREER ACHIEVEMENTS:

Power Phrases (Key Accomplishments):
${vaultContext.powerPhrases.map((p: any) => `- ${p.phrase} ${p.metrics ? `(Metrics: ${JSON.stringify(p.metrics)})` : ''}`).join('\n')}

Transferable Skills:
${vaultContext.skills.map((s: any) => `- ${s.skill}: ${s.evidence}`).join('\n')}

Hidden Competencies (Differentiators):
${vaultContext.competencies.map((c: any) => `- ${c.area}: ${c.capability}`).join('\n')}

GUIDELINES:
1. Create topics that showcase specific achievements (not generic advice)
2. Use "hook" psychology - make readers want to click "see more"
3. Mix content angles: how-to, lessons learned, case studies, counterintuitive insights, numbered lists
4. Estimate engagement based on:
   - Specificity (numbers = high engagement)
   - Relatability (common problems = high engagement)
   - Controversy or surprise (counterintuitive = high engagement)
5. Each topic should reference specific vault items

TOPIC ANGLES:
- how-to: "How I [achieved specific result]"
- lessons-learned: "3 lessons from [specific project]"
- case-study: "How we [solved problem] at [company]"
- counterintuitive: "Why [common belief] is wrong"
- list: "5 ways to [achieve outcome]"

Return 5 topics as JSON array:
[
  {
    "topic": "Post title (engaging, specific, 60-80 characters)",
    "hook": "Opening line that creates curiosity (10-15 words)",
    "angle": "how-to|lessons-learned|case-study|counterintuitive|list",
    "estimatedEngagement": "low|medium|high",
    "vaultItemsUsed": ["item_id_1", "item_id_2"],
    "reasoning": "Why this topic will perform well (1 sentence)"
  }
]

EXAMPLES OF GOOD TOPICS:
✅ "5 lessons from reducing cart abandonment by 33%" (specific metric, list format)
✅ "Why we stopped using Scrum (and what we did instead)" (counterintuitive)
✅ "How I scaled a team from 5 to 45 engineers in 2 years" (specific achievement, how-to)

EXAMPLES OF BAD TOPICS:
❌ "Tips for better leadership" (too generic, no specifics)
❌ "My thoughts on remote work" (no achievement, opinion piece)
❌ "10 productivity hacks" (not tied to their experience)`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    // Parse AI response
    const parsedResponse = JSON.parse(aiContent);
    const topics: TopicSuggestion[] = Array.isArray(parsedResponse)
      ? parsedResponse
      : parsedResponse.topics || [];

    console.log(`✅ Generated ${topics.length} topic suggestions`);

    return new Response(
      JSON.stringify({
        success: true,
        topics,
        totalVaultItems: {
          powerPhrases: vaultContext.powerPhrases.length,
          skills: vaultContext.skills.length,
          competencies: vaultContext.competencies.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error generating topic suggestions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

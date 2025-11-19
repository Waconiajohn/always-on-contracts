import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualityAssessment {
  overall_score: number;
  competitive_percentile: number;
  critical_gaps: Array<{
    category: string;
    severity: 'critical' | 'important' | 'nice_to_have';
    description: string;
    impact: string;
  }>;
  quick_wins: Array<{
    action: string;
    time_estimate: string;
    impact_score: number;
    description: string;
  }>;
  enhancement_suggestions: Array<{
    item_id: string;
    item_type: string;
    current_text: string;
    suggestion: string;
    improvement_type: 'add_metrics' | 'add_context' | 'strengthen_impact' | 'clarify_role';
  }>;
  next_best_action: {
    title: string;
    description: string;
    why_now: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId } = await req.json();
    
    if (!vaultId) {
      throw new Error('vaultId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch vault and benchmark
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('*, benchmark_standard')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Vault not found');
    }

    // Fetch all vault items
    const [
      { data: powerPhrases },
      { data: transferableSkills },
      { data: leadership },
      { data: executivePresence },
      { data: professionalResources },
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId).order('confidence_score', { ascending: false }).limit(10),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId).limit(15),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
      supabase.from('vault_professional_resources').select('*').eq('vault_id', vaultId),
    ]);

    const benchmark = vault.benchmark_standard as any;
    const targetRole = vault.target_roles?.[0] || 'Professional';
    const targetLevel = vault.benchmark_role_level || 'Mid-Level';

    const systemPrompt = `You are an expert career coach analyzing Career Vaults against industry benchmarks. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "overall_score": "number (0-100)",
  "competitive_percentile": "number (0-100)",
  "critical_gaps": [
    {
      "category": "string",
      "severity": "critical" | "important" | "nice_to_have",
      "description": "string",
      "impact": "string"
    }
  ],
  "quick_wins": [
    {
      "action": "string",
      "time_estimate": "string",
      "impact_score": "number (1-10)",
      "description": "string"
    }
  ],
  "enhancement_suggestions": [
    {
      "item_id": "string",
      "item_type": "string",
      "current_text": "string",
      "suggestion": "string",
      "improvement_type": "add_metrics" | "add_context" | "strengthen_impact" | "clarify_role"
    }
  ],
  "next_best_action": {
    "title": "string",
    "description": "string",
    "why_now": "string"
  }
}`;

    const userPrompt = `Analyze this Career Vault against industry benchmarks.

TARGET PROFILE:
- Role: ${targetRole}
- Level: ${targetLevel}
- Industries: ${vault.target_industries?.join(', ') || 'Not specified'}

CURRENT VAULT DATA:
Power Phrases (Achievements): ${powerPhrases?.length || 0} items
${powerPhrases?.slice(0, 5).map((p: any) => `- ${p.power_phrase}`).join('\n') || 'None'}

Skills: ${transferableSkills?.length || 0} items
${transferableSkills?.slice(0, 10).map((s: any) => s.stated_skill).join(', ') || 'None'}

Leadership Examples: ${leadership?.length || 0} items
${leadership?.map((l: any) => `- ${l.leadership_example}`).join('\n') || 'None'}

Executive Presence: ${executivePresence?.length || 0} items
Professional Resources: ${professionalResources?.length || 0} items

BENCHMARK STANDARDS:
${benchmark ? JSON.stringify(benchmark, null, 2) : 'No benchmark generated yet'}

YOUR TASK:
1. Assess how competitive this vault is for their target role/level
2. Identify critical gaps that make them look under-qualified
3. Find quick wins (easy additions that boost competitiveness)
4. Suggest specific improvements to existing items (add metrics, context, impact)
5. Determine the single most important action they should take RIGHT NOW

Focus on QUALITY over QUANTITY. 1 strong achievement with metrics > 3 vague statements.
Compare against REAL industry standards, not arbitrary thresholds.

Return your assessment in this EXACT JSON structure:
{
  "overall_score": <0-100>,
  "competitive_percentile": <0-100, where they rank vs peers>,
  "critical_gaps": [
    {
      "category": "string (e.g., 'quantified_achievements', 'leadership_evidence', 'technical_depth')",
      "severity": "critical|important|nice_to_have",
      "description": "What's missing and why it matters",
      "impact": "How this gap affects their competitiveness"
    }
  ],
  "quick_wins": [
    {
      "action": "Specific thing to add/fix",
      "time_estimate": "5 min|20 min|1 hour",
      "impact_score": <1-10>,
      "description": "Why this is worth doing"
    }
  ],
  "enhancement_suggestions": [
    {
      "item_id": "UUID of existing item",
      "item_type": "power_phrase|skill|leadership",
      "current_text": "Current version",
      "suggestion": "Improved version with specific changes",
      "improvement_type": "add_metrics|add_context|strengthen_impact|clarify_role"
    }
  ],
  "next_best_action": {
    "title": "Clear, actionable title",
    "description": "What to do",
    "why_now": "Why this is the priority"
  }
}`;

    console.log('🤖 Calling AI for quality assessment...');
    
    console.log('🤖 Calling AI for quality assessment...');
    
    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.4,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      },
      'assess-vault-quality',
      vault.user_id
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('[assess-vault-quality] Raw AI response:', rawContent.substring(0, 500));

    const result = extractJSON(rawContent);

    if (!result.success || !result.data) {
      console.error('[assess-vault-quality] JSON parse failed:', result.error);
      console.error('[assess-vault-quality] Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${result.error}`);
    }

    const assessment: QualityAssessment = result.data;

    // Validate required fields
    if (typeof assessment.overall_score !== 'number' || 
        typeof assessment.competitive_percentile !== 'number' ||
        !Array.isArray(assessment.critical_gaps) ||
        !Array.isArray(assessment.quick_wins)) {
      console.error('[assess-vault-quality] Missing required fields:', assessment);
      throw new Error('AI response missing required fields');
    }

    console.log('[assess-vault-quality] Assessment complete:', {
      score: assessment.overall_score,
      percentile: assessment.competitive_percentile,
      gaps: assessment.critical_gaps.length
    });

    // Cache the assessment in the vault
    await supabase
      .from('career_vault')
      .update({
        gap_analysis: {
          ...vault.gap_analysis,
          last_assessment: new Date().toISOString(),
          competitive_percentile: assessment.competitive_percentile,
          critical_gaps: assessment.critical_gaps,
          quick_wins: assessment.quick_wins,
        }
      })
      .eq('id', vaultId);

    console.log('✅ Assessment cached in vault');

    return new Response(
      JSON.stringify({
        success: true,
        assessment,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in assess-vault-quality:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

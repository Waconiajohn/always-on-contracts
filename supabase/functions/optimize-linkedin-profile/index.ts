import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { currentHeadline, currentAbout, targetRole, industry, seedKeywords, researchContext } = await req.json();

    if (!targetRole || !industry) {
      throw new Error('Target role and industry are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Fetch Career Vault context
    const { data: vault } = await supabase
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(power_phrase, impact_metrics, category)
      `)
      .eq('user_id', user.id)
      .single();

    // Fetch employment history from vault_resume_milestones
    const { data: milestones } = await supabase
      .from('vault_resume_milestones')
      .select('company_name, job_title, start_date, end_date, milestone_type')
      .eq('user_id', user.id)
      .eq('milestone_type', 'employment')
      .order('start_date', { ascending: false });

    const knownEmployers = Array.from(new Set(
      milestones?.map(m => m.company_name).filter(Boolean) || []
    ));

    const knownRoles = Array.from(new Set(
      milestones?.map(m => m.job_title).filter(Boolean) || []
    ));

    console.log(`[Profile Optimizer] Known employers: ${knownEmployers.join(', ')}`);
    console.log(`[Profile Optimizer] Known roles: ${knownRoles.join(', ')}`);

    const powerPhrases = vault?.vault_power_phrases?.slice(0, 8) || [];
    const powerPhraseLines = powerPhrases
      .map((p: any, idx: number) => 
        `${idx + 1}. ${p.power_phrase ?? ""} ${p.impact_metrics ? `(${p.impact_metrics})` : ""}`
      )
      .join('\n');

    const factCheckBlock = `
KNOWN EMPLOYERS (only use these):
${knownEmployers.length ? "- " + knownEmployers.join("\n- ") : "None listed"}

KNOWN ROLES (only use these):
${knownRoles.length ? "- " + knownRoles.join("\n- ") : "None listed"}

CRITICAL: You MUST NOT invent employers or roles beyond this list.
If you suggest content about employers/roles NOT in these lists, add a warning in the "warnings" field.
`;

    const atsKeywordBlock = seedKeywords?.length
      ? `Suggested seed keywords: ${seedKeywords.join(", ")}`
      : "Infer ATS keywords from role and industry.";

    const researchBlock = researchContext
      ? `\n\nEXTERNAL RESEARCH CONTEXT:\n${researchContext}\n`
      : "";

    const systemPrompt = `You are an expert LinkedIn profile optimizer with deep ATS (Applicant Tracking System) awareness.

YOUR CORE JOB:
- Rewrite the user's LinkedIn headline and About section
- Make them compelling for recruiters AND optimized for search/ATS
- Ground everything in the user's actual history from Career Vault (no fabrication)

${factCheckBlock}

TOP POWER PHRASES / ACHIEVEMENTS:
${powerPhraseLines || "None provided."}

ATS / KEYWORD GUIDANCE:
- Target role: ${targetRole}
- Industry: ${industry}
${atsKeywordBlock}
${researchBlock}

RULES:
- Do NOT invent employers, job titles, dates, companies, or certifications.
- Use quantified outcomes when clearly provided by vault; otherwise stay qualitative.
- Avoid hype words: "rockstar", "guru", "world-class", "cutting-edge", "game-changing".
- Headline must be <= 220 characters. About ideally 800–1800 characters (max 2600).

OUTPUT (strict JSON):
{
  "headline": {
    "current": "user's current headline or null",
    "suggested": "new optimized headline with ATS keywords",
    "rationale": "why this headline is better",
    "atsKeywords": ["keyword1", "keyword2"],
    "warnings": ["optional warning about unverified claims"]
  },
  "about": {
    "current": "user's current about or null",
    "suggested": "new optimized About section",
    "rationale": "why this is improved",
    "atsKeywords": ["keyword1", "keyword2"],
    "warnings": ["optional warning about unverified claims"]
  },
  "topKeywords": [
    {
      "keyword": "example keyword",
      "priority": "critical | important | recommended",
      "currentUsage": 0
    }
  ]
}`;

    const userPrompt = `
CURRENT LINKEDIN PROFILE TEXT:

Headline:
${currentHeadline || "None provided."}

About:
${currentAbout || "None provided."}
`;

    console.log('[Profile Optimizer] Calling AI');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      'optimize-linkedin-profile',
      user.id
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const extracted = extractJSON(content);

    if (!extracted.success) {
      console.error('[Profile Optimizer] JSON parse failed');
      throw new Error('Failed to parse AI response');
    }

    const result = {
      ...extracted.data,
      metadata: {
        usedVaultSummary: !!vault,
        employerCount: knownEmployers.length,
        roleCount: knownRoles.length,
      },
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Profile Optimizer] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

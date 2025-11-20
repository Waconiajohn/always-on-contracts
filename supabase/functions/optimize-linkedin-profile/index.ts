// supabase/functions/optimize-linkedin-profile/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---- Request & Response Schemas (runtime validation) ----

// Matches your front-end OptimizeLinkedInProfileParams
const OptimizeProfileRequestSchema = z.object({
  currentHeadline: z.string().optional(),
  currentAbout: z.string().optional(),
  targetRole: z.string().min(1, "Target role is required"),
  industry: z.string().min(1, "Industry is required"),
  seedKeywords: z.array(z.string()).optional(),
  researchContext: z.string().optional(),
});

// Matches LinkedInProfileSection/LinkedInProfileDraft from frontend
const ProfileSectionSchema = z.object({
  current: z.string().nullable().optional(),
  suggested: z.string().min(1),
  rationale: z.string().optional(),
  warnings: z.array(z.string()).optional(),
  atsKeywords: z.array(z.string()).optional(),
});

const TopKeywordSchema = z.object({
  keyword: z.string(),
  priority: z.enum(["critical", "important", "recommended"]),
  currentUsage: z.number(),
});

const LinkedInProfileDraftSchema = z.object({
  headline: ProfileSectionSchema,
  about: ProfileSectionSchema,
  summaryHighlights: z.array(z.string()).optional(),
  experience: z
    .array(
      z.object({
        roleId: z.string().optional(),
        title: ProfileSectionSchema,
        company: ProfileSectionSchema,
        location: ProfileSectionSchema.optional(),
        descriptionBullets: z.array(ProfileSectionSchema),
        dates: z
          .object({
            start: z.string().optional(),
            end: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
  skills: z.array(z.string()).optional(),
  topKeywords: z.array(TopKeywordSchema).optional(),
  // server-side extra: we allow a top-level warnings field
  warnings: z.array(z.string()).optional(),
});

type LinkedInProfileDraft = z.infer<typeof LinkedInProfileDraftSchema>;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization")! },
      },
    });

    // ---- Auth ----
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Parse & validate request ----
    const body = await req.json();
    const parsed = OptimizeProfileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      currentHeadline,
      currentAbout,
      targetRole,
      industry,
      seedKeywords = [],
      researchContext = "",
    } = parsed.data;

    // ---- Build Career Vault / Resume fact-check context ----

    // 1) Career Vault: power phrases, key achievements, etc.
    const { data: vaultData } = await supabase
      .from("career_vault")
      .select(
        `
        id,
        analysis_summary,
        vault_power_phrases ( power_phrase, impact_metrics ),
        vault_work_positions ( company_name, job_title, start_date, end_date, is_current, description ),
        vault_education ( institution_name, degree_type, field_of_study, graduation_year ),
        target_role,
        target_industry
      `,
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const vaultSummary = vaultData?.analysis_summary ?? "";
    const powerPhrases: string[] =
      vaultData?.vault_power_phrases?.map((p: any) => p.power_phrase) ?? [];

    // 2) CRITICAL FIX: Use actual work positions from vault
    const workPositions = vaultData?.vault_work_positions || [];
    const educationRecords = vaultData?.vault_education || [];

    const knownEmployers: string[] = workPositions.map((wp: any) => wp.company_name).filter(Boolean);
    const knownRoles: string[] = workPositions.map((wp: any) => wp.job_title).filter(Boolean);
    const knownDegrees: string[] = educationRecords.map((ed: any) => 
      `${ed.degree_type} in ${ed.field_of_study || 'N/A'} from ${ed.institution_name}`
    ).filter(Boolean);

    // 3) Milestones for additional achievements
    const { data: milestones } = await supabase
      .from("vault_resume_milestones")
      .select("milestone_title, description, metric_value")
      .eq("vault_id", vaultData?.id)
      .limit(20);

    // Work positions and education already provide employers/roles/degrees
    console.log('[OPTIMIZE-LINKEDIN] Fact check data loaded:', {
      employers: knownEmployers.length,
      roles: knownRoles.length,
      degrees: knownDegrees.length,
      milestones: milestones?.length || 0
    });

    const factCheckContext = `
FACT-CHECK AGAINST CAREER VAULT & RESUME
Known Employers: ${knownEmployers.join(", ") || "None on record"}
Known Roles: ${knownRoles.join(", ") || "None on record"}

CRITICAL FACTUALITY RULES:
- Only reference employers, roles, and achievements that appear in:
  • Known Employers / Known Roles above, OR
  • Explicit text inside the Career Vault power phrases or analysis summary.
- If you introduce a company or role that is NOT in those lists or texts, you MUST:
  • Add a warning to that section: "⚠️ Verify: [Company/Role] not found in your career vault."
`;

    const vaultContext = `
CAREER VAULT SUMMARY:
${vaultSummary || "(No extended summary on record)"}

TOP POWER PHRASES / ACHIEVEMENTS:
${powerPhrases.map((p, i) => `${i + 1}. ${p}`).join("\n") || "(None on record)"}
`;

    const keywordContext =
      seedKeywords.length > 0
        ? `ATS / KEYWORD PRIORITIES THE USER CARES ABOUT:
${seedKeywords.join(", ")}`
        : "ATS / KEYWORD PRIORITIES: Use your own judgment based on the target role and industry.";

    const researchSection = researchContext
      ? `\nEXTERNAL RESEARCH CONTEXT (industry/company/role patterns):

${researchContext}`
      : "";

    // ---- System prompt for the model ----
    const systemPrompt = `You are an expert LinkedIn profile optimizer with deep ATS (Applicant Tracking System) awareness.

Your goal:
- Rewrite the user's LinkedIn headline and About section
- Make them highly relevant for the TARGET ROLE in the TARGET INDUSTRY
- Use verified facts from the user's Career Vault and canonical resume
- Surface explicit ATS keywords and avoid hallucinations.

TARGET ROLE: ${targetRole}
TARGET INDUSTRY: ${industry}

${keywordContext}

${vaultContext}

${factCheckContext}
${researchSection}

WRITING RULES:
- Tone: confident, professional, executive-level.
- Max headline length: ~220 characters.
- About section: 3–6 short paragraphs; 2–3 lines each.
- Prioritize quantified outcomes and specific impact.
- Avoid generic buzzwords like "world-class", "synergy", "paradigm shift", "rockstar".
- Use clear, concrete language that a recruiter will immediately understand.

OUTPUT FORMAT:
Return a single JSON object with this EXACT structure (no extra keys):

{
  "headline": {
    "current": "the current headline (or null)",
    "suggested": "the new optimized headline string",
    "rationale": "why this headline is stronger",
    "atsKeywords": ["keyword1", "..."],
    "warnings": ["optional warning messages, esp. for fact-check issues"]
  },
  "about": {
    "current": "the current about / summary (or null)",
    "suggested": "the full new About section text",
    "rationale": "why this About is stronger",
    "atsKeywords": ["keyword1", "..."],
    "warnings": ["optional warning messages, esp. for fact-check issues"]
  },
  "summaryHighlights": [
    "1–3 concise bullet highlights that summarize the value prop"
  ],
  "experience": [],
  "skills": [],
  "topKeywords": [
    {
      "keyword": "Enterprise SaaS",
      "priority": "critical",
      "currentUsage": 1
    }
  ],
  "warnings": []
}

NOTES:
- "experience" and "skills" can be empty arrays for now; we focus on headline + About.
- "topKeywords" should list 5–12 important keywords for ATS / recruiter search.
- "warnings" must include any suspected hallucinated employer/role with a clear "⚠️ Verify: ..." message.
`;

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
        usedVaultSummary: !!vaultSummary,
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

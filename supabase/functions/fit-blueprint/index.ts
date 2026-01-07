import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription } = await req.json();
    
    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a senior hiring manager + executive recruiter + resume architect. You evaluate candidates like a panel: CEO, VP, and functional leader. You are rigorous about truthfulness and evidence.

Your task is to produce a structured "Fit Blueprint" that can be used to write a benchmark resume.

MANDATORY STEPS (DO NOT SKIP):

STEP A — NORMALIZE THE RESUME INTO EVIDENCE UNITS
Extract and list:
- Roles (title, company, dates)
- Scope indicators (team size, budget, customers, geographies, scale)
- Outcomes (metrics, deltas, KPIs)
- Tools/platforms
- Domain contexts (industry, customer type, buyer persona)

Create an Evidence Inventory of short, referenceable items (E1, E2, E3…).

Rules:
- Do not paraphrase into new claims
- If a metric isn't present, don't invent it
- If something is implied but not explicit, mark it "inference" and treat as weak evidence

STEP B — DECOMPOSE THE JOB INTO ATOMIC REQUIREMENTS
Turn the JD into a numbered list (R1…Rn) of atomic requirements.
Each requirement must be one expectation only (no bundling).

Tag each requirement with:
- Type: {Leadership, Domain, Execution, Metrics, Tooling, Communication, Strategy}
- Seniority signal: {Director-level, Manager-level, IC-level}
- Business outcome target: {Retention, Expansion, Adoption, Quality, Revenue, Risk, Efficiency}

STEP C — REQUIREMENT-BY-REQUIREMENT FIT CLASSIFICATION
For every requirement R#, assign exactly one:
- HIGHLY QUALIFIED
- PARTIALLY QUALIFIED
- EXPERIENCE GAP

For each requirement include:
- Fit category
- Why (explicit comparison of JD expectation vs resume evidence)
- Evidence citations (E# list)
- Gap taxonomy (if partial/gap): {Domain / Scope / Ownership / Metric / Tooling / Recency}
- Risk level if unaddressed: {Low / Medium / High}
- Confidence: {very-high / high / moderate / low}

STEP D — "BENCHMARK CANDIDATE" NARRATIVE THEMES
Extract 3–6 themes that would make this candidate the reference standard, e.g.:
- "Operationalizes onboarding at scale"
- "Builds support tiers that reduce time-to-resolution"
- "Cross-functional lifecycle leadership"
Each theme must be supported by evidence IDs.

STEP E — BULLET BANK + MISSING BULLET PLAN
Create:
- Bullet Bank: 12–20 resume bullets written in strong resume style, each tagged to requirement(s) R# and supported by evidence E#.
- Missing Bullet Plan: identify 6–10 bullets the resume should have to match the JD better.

For each missing bullet:
- What evidence is needed (what to ask candidate)
- Where it would fit (which role)
- Suggested wording template with placeholders (NO fabrication)

STEP F — KEYWORD + ATS ALIGNMENT (CONTROLLED)
Provide:
- Top JD keywords/phrases (15–30)
- Which are already covered (with evidence)
- Which are missing but can be added truthfully (where to place)
- Which are missing and require real experience (flag)`;

    const userPrompt = `Analyze this resume against the job description and produce a complete Fit Blueprint.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return valid JSON only, no markdown, no commentary. Use this exact schema:

{
  "evidence_inventory": [{"id":"E1","source_role":"...","text":"...","strength":"strong|moderate|weak|inference"}],
  "requirements": [{"id":"R1","requirement":"...","type":"Leadership|Domain|Execution|Metrics|Tooling|Communication|Strategy","seniority_signal":"Director-level|Manager-level|IC-level","outcome_target":"Retention|Expansion|Adoption|Quality|Revenue|Risk|Efficiency"}],
  "fit_map": [{
    "requirement_id":"R1",
    "category":"HIGHLY QUALIFIED|PARTIALLY QUALIFIED|EXPERIENCE GAP",
    "rationale":"...",
    "evidence_ids":["E1","E4"],
    "gap_taxonomy":["Domain","Metric"],
    "risk_level":"Low|Medium|High",
    "confidence":"very-high|high|moderate|low"
  }],
  "benchmark_themes": [{"theme":"...","evidence_ids":["E2","E7"],"requirement_ids":["R3","R9"]}],
  "bullet_bank": [{"bullet":"...","evidence_ids":["E3"],"requirement_ids":["R2","R5"]}],
  "missing_bullet_plan": [{
    "id":"mb1",
    "target_requirement_ids":["R6"],
    "what_to_ask_candidate":"...",
    "where_to_place":"Role / section",
    "template_bullet":"..."
  }],
  "ats_alignment": {
    "top_keywords":["..."],
    "covered":[{"keyword":"...","evidence_ids":["E1"]}],
    "missing_but_addable":[{"keyword":"...","where_to_add":"...","template":"..."}],
    "missing_requires_experience":[{"keyword":"...","why_gap":"..."}]
  },
  "executive_summary": {
    "hire_signal":"...",
    "likely_objections":["..."],
    "mitigation_strategy":["..."],
    "best_positioning_angle":"..."
  },
  "overall_fit_score": 75
}`;

    console.log('Calling Lovable AI for Fit Blueprint analysis...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, parsing...');

    // Parse the JSON response
    let blueprint;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      const rawBlueprint = JSON.parse(jsonStr.trim());
      
      // Transform to camelCase for frontend
      blueprint = {
        evidenceInventory: (rawBlueprint.evidence_inventory || []).map((e: any) => ({
          id: e.id,
          sourceRole: e.source_role,
          text: e.text,
          strength: e.strength
        })),
        requirements: (rawBlueprint.requirements || []).map((r: any) => ({
          id: r.id,
          requirement: r.requirement,
          type: r.type,
          senioritySignal: r.seniority_signal,
          outcomeTarget: r.outcome_target
        })),
        fitMap: (rawBlueprint.fit_map || []).map((f: any) => ({
          requirementId: f.requirement_id,
          category: f.category,
          rationale: f.rationale,
          evidenceIds: f.evidence_ids || [],
          gapTaxonomy: f.gap_taxonomy || [],
          riskLevel: f.risk_level,
          confidence: f.confidence
        })),
        benchmarkThemes: (rawBlueprint.benchmark_themes || []).map((t: any) => ({
          theme: t.theme,
          evidenceIds: t.evidence_ids || [],
          requirementIds: t.requirement_ids || []
        })),
        bulletBank: (rawBlueprint.bullet_bank || []).map((b: any) => ({
          bullet: b.bullet,
          evidenceIds: b.evidence_ids || [],
          requirementIds: b.requirement_ids || []
        })),
        missingBulletPlan: (rawBlueprint.missing_bullet_plan || []).map((m: any, idx: number) => ({
          id: m.id || `mb${idx + 1}`,
          targetRequirementIds: m.target_requirement_ids || [],
          whatToAskCandidate: m.what_to_ask_candidate,
          whereToPlace: m.where_to_place,
          templateBullet: m.template_bullet
        })),
        atsAlignment: {
          topKeywords: rawBlueprint.ats_alignment?.top_keywords || [],
          covered: (rawBlueprint.ats_alignment?.covered || []).map((c: any) => ({
            keyword: c.keyword,
            evidenceIds: c.evidence_ids || []
          })),
          missingButAddable: (rawBlueprint.ats_alignment?.missing_but_addable || []).map((m: any) => ({
            keyword: m.keyword,
            whereToAdd: m.where_to_add,
            template: m.template
          })),
          missingRequiresExperience: (rawBlueprint.ats_alignment?.missing_requires_experience || []).map((m: any) => ({
            keyword: m.keyword,
            whyGap: m.why_gap
          }))
        },
        executiveSummary: {
          hireSignal: rawBlueprint.executive_summary?.hire_signal || '',
          likelyObjections: rawBlueprint.executive_summary?.likely_objections || [],
          mitigationStrategy: rawBlueprint.executive_summary?.mitigation_strategy || [],
          bestPositioningAngle: rawBlueprint.executive_summary?.best_positioning_angle || ''
        },
        overallFitScore: rawBlueprint.overall_fit_score || 70
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse fit blueprint result');
    }

    console.log('Fit Blueprint generated successfully');

    return new Response(JSON.stringify(blueprint), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Fit Blueprint error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

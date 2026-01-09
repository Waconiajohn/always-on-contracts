import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { extractJSON } from "../_shared/json-parser.ts";
import { 
  EXECUTIVE_RUBRICS, 
  findExecutiveRubric, 
  detectRoleArchetype, 
  getDefaultResumePattern 
} from "../_shared/executive-rubrics.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authedUser }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !authedUser) {
      console.error('Auth error:', authError?.message || 'No user returned');
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', authedUser.id);

    const { resumeText, jobDescription } = await req.json();
    
    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    // STEP 0: Detect role archetype and get matching rubric
    const detectedArchetype = detectRoleArchetype(jobDescription);
    const matchedRubric = findExecutiveRubric(detectedArchetype);
    const resumePattern = getDefaultResumePattern();
    
    console.log('Detected role archetype:', detectedArchetype, '| Matched rubric:', matchedRubric?.roleArchetype || 'none');

    // Build rubric context for the AI
    const rubricContext = matchedRubric ? `
ROLE SUCCESS RUBRIC (Use this as your evaluation framework):
Role Archetype: ${matchedRubric.roleArchetype}
Industry Context: ${matchedRubric.industryContext}

Core Outcomes Expected:
${matchedRubric.coreOutcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Top Competencies to Evaluate:
${matchedRubric.topCompetencies.map(c => `- ${c.name}: ${c.definition}
  Proof Examples: ${c.proofExamples.join('; ')}
  Anti-Patterns to Avoid: ${c.antiPatterns.join('; ')}`).join('\n\n')}

Benchmark Proof Points (What "best-in-class" looks like):
${matchedRubric.benchmarkProofPoints.map(p => `• ${p}`).join('\n')}

Metrics Norms for This Role:
${matchedRubric.metricsNorms.map(m => `- ${m.metric} (${m.typicalRange}) - Sources: ${m.sources.join(', ')}`).join('\n')}

Common Pitfalls (Mistakes candidates make):
${matchedRubric.commonPitfalls.map(p => `• ${p}`).join('\n')}

Executive Signals (What hiring managers look for):
${matchedRubric.executiveSignals.map(s => `• ${s}`).join('\n')}
` : '';

    const systemPrompt = `You are a senior hiring manager + executive recruiter + resume architect. You evaluate candidates like a panel: CEO, VP, and functional leader. You are rigorous about truthfulness and evidence.

Your task is to produce a structured "Fit Blueprint" that can be used to write a benchmark resume.
${rubricContext}

MANDATORY STEPS (DO NOT SKIP):

STEP 0 — ROLE ARCHETYPE DETECTION
Identify the role archetype from the JD (e.g., Customer Success Leader, IT Leader, Program Manager).
Note the industry context and seniority level.

STEP A — NORMALIZE THE RESUME INTO EVIDENCE UNITS
Extract and list:
- Roles (title, company, dates)
- Scope indicators (team size, budget, customers, geographies, scale)
- Outcomes (metrics, deltas, KPIs)
- Tools/platforms
- Domain contexts (industry, customer type, buyer persona)

Create an Evidence Inventory of short, referenceable items (E1, E2, E3…).
For each evidence item, also classify:
- proof_type: {Metric, Story, Artifact, Credential, Inference}

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
- competency_id: Link to a rubric competency if applicable

STEP C — REQUIREMENT-BY-REQUIREMENT FIT CLASSIFICATION (CONVERSATIONAL ANALYSIS)
For every requirement R#, assign exactly one category:
- HIGHLY QUALIFIED
- PARTIALLY QUALIFIED  
- EXPERIENCE GAP

CRITICAL - For each requirement you MUST provide:
1. "why_qualified": A conversational explanation (2-3 sentences) explaining WHY the candidate fits or partially fits this requirement.

2. "resume_language": A MANDATORY ready-to-paste resume bullet. INSPIRED by evidence but CREATIVELY REWRITTEN.

3. "gap_explanation" (for PARTIALLY QUALIFIED and EXPERIENCE GAP only): What specific experience or skill is missing?

4. "bridging_strategy" (for EXPERIENCE GAP only): How can the candidate address this gap?

Also include:
- Evidence citations (E# list)
- Gap taxonomy (if partial/gap): {Domain / Scope / Ownership / Metric / Tooling / Recency}
- Risk level if unaddressed: {Low / Medium / High}
- Confidence: {very-high / high / moderate / low}

STEP D — INFERENCE MAP (NEW - CRITICAL FOR EVIDENCE SAFETY)
For each requirement, identify:
- verified_claims: Claims backed by direct evidence (cite E# IDs)
- plausible_inferences: Things we could reasonably infer BUT are NOT proven. Include:
  - inference: What we might claim
  - constraint: What must be true for this to be valid
  - risk_of_overreach: Low/Medium/High
- validation_questions: Questions to ask the candidate to confirm inferences. Include:
  - question: The question text
  - field_key: A short snake_case key for the answer (e.g., "team_size", "budget_managed")
  - field_type: text/number/range/select
  - example_answer: An example of what a good answer looks like
- draft_bullets_placeholders: Resume bullets that NEED CONFIRMATION before using. Mark status as "NEEDS_CONFIRMATION".

STEP E — "BENCHMARK CANDIDATE" NARRATIVE THEMES
Extract 3–6 themes that would make this candidate the reference standard.
Each theme must be supported by evidence IDs.

STEP F — BULLET BANK (VERIFIED ONLY) + PROOF COLLECTOR FIELDS
Create:
- Bullet Bank Verified: 12–20 resume bullets using ONLY verified evidence (E# citations required)
- Bullet Bank Inferred Placeholders: Bullets that require confirmation (all marked NEEDS_CONFIRMATION)
- Proof Collector Fields: Structured fields to collect missing facts from the candidate

Proof Collector Fields must include:
- field_key: Unique snake_case identifier
- label: Human-readable field name
- description: What we're asking for and why
- field_type: text/number/range/select/multi
- category: Scope/Leadership/Outcomes/Stakeholders/Tools/Timeline
- priority: high/medium/low
- examples: Example answers

STEP G — KEYWORD + ATS ALIGNMENT (CONTROLLED)
Provide:
- Top JD keywords/phrases (15–30)
- Which are already covered (with evidence)
- Which are missing but can be added truthfully (where to place)
- Which are missing and require real experience (flag)`;

    const userPrompt = `Analyze this resume against the job description and produce a complete Fit Blueprint with the NEW inference safety layer.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return valid JSON only, no markdown, no commentary. Use this exact schema:

{
  "role_success_rubric": {
    "role_archetype": "detected role type",
    "industry_context": "industry and market context",
    "core_outcomes": ["outcome1", "outcome2"],
    "top_competencies": [{"id": "comp1", "name": "...", "definition": "...", "proof_examples": ["..."], "anti_patterns": ["..."]}],
    "benchmark_proof_points": ["..."],
    "metrics_norms": [{"metric": "...", "typical_range": "...", "sources": ["..."]}],
    "common_pitfalls": ["..."],
    "executive_signals": ["..."]
  },
  "benchmark_resume_pattern": {
    "target_title_rules": ["..."],
    "section_order": ["Summary", "Signature Wins", "Experience", "Skills", "Education"],
    "signature_wins_pattern": {"description": "...", "bullet_formula": "...", "examples": ["..."]},
    "summary_pattern": {"description": "...", "required_elements": ["..."]},
    "bullet_formula": "Action + Scope + Outcome + Method",
    "executive_50plus_rules": ["Hide graduation years", "Emphasize last 10-15 years", "Condense early career"]
  },
  "evidence_inventory": [{"id":"E1","source_role":"...","text":"...","type":"Metric|Story|Artifact|Credential","proof_type":"strong|moderate|weak|inference","strength":"strong|moderate|weak|inference"}],
  "requirements": [{"id":"R1","requirement":"...","type":"Leadership|Domain|Execution|Metrics|Tooling|Communication|Strategy","seniority_signal":"Director-level|Manager-level|IC-level","outcome_target":"Retention|Expansion|Adoption|Quality|Revenue|Risk|Efficiency","competency_id":"comp1"}],
  "fit_map": [{
    "requirement_id":"R1",
    "category":"HIGHLY QUALIFIED|PARTIALLY QUALIFIED|EXPERIENCE GAP",
    "why_qualified":"Conversational 2-3 sentence explanation...",
    "resume_language":"Ready-to-paste resume bullet...",
    "gap_explanation":"What specific experience is missing...",
    "bridging_strategy":"How to address the gap...",
    "rationale":"Brief technical rationale",
    "evidence_ids":["E1","E4"],
    "gap_taxonomy":["Domain","Metric"],
    "risk_level":"Low|Medium|High",
    "confidence":"very-high|high|moderate|low"
  }],
  "inference_map": [{
    "requirement_id": "R1",
    "verified_claims": [{"claim": "...", "evidence_ids": ["E1"]}],
    "plausible_inferences": [{"inference": "...", "constraint": "...", "risk_of_overreach": "Low|Medium|High"}],
    "validation_questions": [{"question": "...", "field_key": "team_size", "field_type": "number", "example_answer": "15"}],
    "draft_bullets_placeholders": [{"status": "NEEDS_CONFIRMATION", "bullet": "...", "required_fields": ["team_size"]}]
  }],
  "benchmark_themes": [{"theme":"...","evidence_ids":["E2","E7"],"requirement_ids":["R3","R9"]}],
  "bullet_bank_verified": [{"bullet":"...","evidence_ids":["E3"],"requirement_ids":["R2","R5"]}],
  "bullet_bank_inferred_placeholders": [{"status": "NEEDS_CONFIRMATION", "bullet":"...","required_fields":["field_key"],"target_requirements":["R6"]}],
  "proof_collector_fields": [{
    "field_key": "team_size",
    "label": "Team Size",
    "description": "How many people did you directly manage?",
    "field_type": "number",
    "category": "Scope",
    "priority": "high",
    "examples": ["5", "15", "50+"]
  }],
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

    console.log('Calling Lovable AI for Fit Blueprint analysis...', { userId: authedUser.id });

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.2,
        max_tokens: 10000, // Increased for new schema
        response_mime_type: "application/json"
      },
      'fit-blueprint',
      authedUser.id,
      120000 // 2 minute timeout for complex analysis
    );

    console.log('AI response received, usage:', metrics);

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('Raw AI response preview:', content.substring(0, 500));

    const parseResult = extractJSON(content);
    if (!parseResult.success || !parseResult.data) {
      console.error('JSON parse failed. Error:', parseResult.error);
      throw new Error('Failed to parse fit blueprint result');
    }

    const rawBlueprint = parseResult.data;
    
    // Transform to camelCase for frontend with new fields
    const blueprint = {
      // NEW: Role Success Rubric
      roleSuccessRubric: rawBlueprint.role_success_rubric ? {
        roleArchetype: rawBlueprint.role_success_rubric.role_archetype || detectedArchetype,
        industryContext: rawBlueprint.role_success_rubric.industry_context || '',
        coreOutcomes: rawBlueprint.role_success_rubric.core_outcomes || [],
        topCompetencies: (rawBlueprint.role_success_rubric.top_competencies || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          definition: c.definition,
          proofExamples: c.proof_examples || [],
          antiPatterns: c.anti_patterns || []
        })),
        benchmarkProofPoints: rawBlueprint.role_success_rubric.benchmark_proof_points || [],
        metricsNorms: (rawBlueprint.role_success_rubric.metrics_norms || []).map((m: any) => ({
          metric: m.metric,
          typicalRange: m.typical_range,
          sources: m.sources || []
        })),
        commonPitfalls: rawBlueprint.role_success_rubric.common_pitfalls || [],
        executiveSignals: rawBlueprint.role_success_rubric.executive_signals || []
      } : null,
      
      // NEW: Benchmark Resume Pattern
      benchmarkResumePattern: rawBlueprint.benchmark_resume_pattern ? {
        targetTitleRules: rawBlueprint.benchmark_resume_pattern.target_title_rules || [],
        sectionOrder: rawBlueprint.benchmark_resume_pattern.section_order || resumePattern.sectionOrder,
        signatureWinsPattern: rawBlueprint.benchmark_resume_pattern.signature_wins_pattern || null,
        summaryPattern: rawBlueprint.benchmark_resume_pattern.summary_pattern || null,
        bulletFormula: rawBlueprint.benchmark_resume_pattern.bullet_formula || resumePattern.bulletFormula,
        executive50PlusRules: rawBlueprint.benchmark_resume_pattern.executive_50plus_rules || resumePattern.executive50PlusRules
      } : resumePattern,
      
      evidenceInventory: (rawBlueprint.evidence_inventory || []).map((e: any) => ({
        id: e.id,
        sourceRole: e.source_role,
        text: e.text,
        type: e.type || 'Story',
        proofType: e.proof_type || e.strength,
        strength: e.strength
      })),
      
      requirements: (rawBlueprint.requirements || []).map((r: any) => ({
        id: r.id,
        requirement: r.requirement,
        type: r.type,
        senioritySignal: r.seniority_signal,
        outcomeTarget: r.outcome_target,
        competencyId: r.competency_id
      })),
      
      fitMap: (rawBlueprint.fit_map || []).map((f: any) => {
        let resumeLanguage = f.resume_language || '';
        if (!resumeLanguage && f.rationale) {
          resumeLanguage = f.rationale;
          console.warn(`Missing resume_language for requirement ${f.requirement_id}, using rationale as fallback`);
        }
        
        return {
          requirementId: f.requirement_id,
          category: f.category,
          whyQualified: f.why_qualified || '',
          resumeLanguage,
          gapExplanation: f.gap_explanation || '',
          bridgingStrategy: f.bridging_strategy || '',
          rationale: f.rationale,
          evidenceIds: f.evidence_ids || [],
          gapTaxonomy: f.gap_taxonomy || [],
          riskLevel: f.risk_level,
          confidence: f.confidence
        };
      }),
      
      // NEW: Inference Map
      inferenceMap: (rawBlueprint.inference_map || []).map((im: any) => ({
        requirementId: im.requirement_id,
        verifiedClaims: (im.verified_claims || []).map((vc: any) => ({
          claim: vc.claim,
          evidenceIds: vc.evidence_ids || []
        })),
        plausibleInferences: (im.plausible_inferences || []).map((pi: any) => ({
          inference: pi.inference,
          constraint: pi.constraint,
          riskOfOverreach: pi.risk_of_overreach || 'Medium'
        })),
        validationQuestions: (im.validation_questions || []).map((vq: any) => ({
          question: vq.question,
          fieldKey: vq.field_key,
          fieldType: vq.field_type || 'text',
          exampleAnswer: vq.example_answer
        })),
        draftBulletsPlaceholders: (im.draft_bullets_placeholders || []).map((db: any) => ({
          status: 'NEEDS_CONFIRMATION' as const,
          bullet: db.bullet,
          requiredFields: db.required_fields || []
        }))
      })),
      
      benchmarkThemes: (rawBlueprint.benchmark_themes || []).map((t: any) => ({
        theme: t.theme,
        evidenceIds: t.evidence_ids || [],
        requirementIds: t.requirement_ids || []
      })),
      
      // Legacy bullet bank for backwards compatibility
      bulletBank: (rawBlueprint.bullet_bank || rawBlueprint.bullet_bank_verified || []).map((b: any) => ({
        bullet: b.bullet,
        evidenceIds: b.evidence_ids || [],
        requirementIds: b.requirement_ids || []
      })),
      
      // NEW: Separated bullet banks
      bulletBankVerified: (rawBlueprint.bullet_bank_verified || rawBlueprint.bullet_bank || []).map((b: any) => ({
        bullet: b.bullet,
        evidenceIds: b.evidence_ids || [],
        requirementIds: b.requirement_ids || []
      })),
      
      bulletBankInferredPlaceholders: (rawBlueprint.bullet_bank_inferred_placeholders || []).map((b: any) => ({
        status: 'NEEDS_CONFIRMATION' as const,
        bullet: b.bullet,
        requiredFields: b.required_fields || [],
        targetRequirements: b.target_requirements || []
      })),
      
      // NEW: Proof Collector Fields
      proofCollectorFields: (rawBlueprint.proof_collector_fields || []).map((f: any) => ({
        fieldKey: f.field_key,
        label: f.label,
        description: f.description,
        fieldType: f.field_type || 'text',
        options: f.options,
        examples: f.examples,
        priority: f.priority || 'medium',
        category: f.category || 'Outcomes'
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

    console.log('Fit Blueprint generated successfully with rubric integration');

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

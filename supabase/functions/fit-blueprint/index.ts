import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { extractJSON } from "../_shared/json-parser.ts";
import { 
  findExecutiveRubric, 
  detectRoleArchetype, 
  getDefaultResumePattern 
} from "../_shared/executive-rubrics.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// =============================================================================
// PHASE 2: SPLIT AI CALLS
// Pass 1: Analysis (Evidence + Requirements + Fit Map + Inference Map)
// Pass 2: Generation (Bullet Banks + Proof Collector + ATS)
// =============================================================================

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

    // =========================================================================
    // PASS 1: ANALYSIS (Evidence + Requirements + Fit Map + Inference Map)
    // =========================================================================
    console.log('🔍 PASS 1: Starting Analysis Pass...');
    const pass1Start = Date.now();

    const pass1SystemPrompt = `You are a senior hiring manager + executive recruiter. You evaluate candidates like a panel: CEO, VP, and functional leader. You are rigorous about truthfulness and evidence.

Your task is to ANALYZE the candidate's fit for this role. Focus on extraction and classification only.
${rubricContext}

STEP A — NORMALIZE THE RESUME INTO EVIDENCE UNITS
Extract and list:
- Roles (title, company, dates)
- Scope indicators (team size, budget, customers, geographies, scale)
- Outcomes (metrics, deltas, KPIs)
- Tools/platforms
- Domain contexts (industry, customer type, buyer persona)

Create an Evidence Inventory of short, referenceable items (E1, E2, E3…).
For each evidence item, classify:
- proof_type: {Metric, Story, Artifact, Credential, Inference}
- strength: {strong, moderate, weak, inference}

Rules:
- Do not paraphrase into new claims
- If a metric isn't present, don't invent it
- If something is implied but not explicit, mark it "inference"

STEP B — DECOMPOSE THE JOB INTO ATOMIC REQUIREMENTS
Turn the JD into a numbered list (R1…Rn) of atomic requirements.
Each requirement must be one expectation only (no bundling).

Tag each requirement with:
- Type: {Leadership, Domain, Execution, Metrics, Tooling, Communication, Strategy}
- Seniority signal: {Director-level, Manager-level, IC-level}
- Business outcome target: {Retention, Expansion, Adoption, Quality, Revenue, Risk, Efficiency}
- competency_id: Link to a rubric competency if applicable

STEP C — REQUIREMENT-BY-REQUIREMENT FIT CLASSIFICATION
For every requirement R#, assign exactly one category:
- HIGHLY QUALIFIED
- PARTIALLY QUALIFIED  
- EXPERIENCE GAP

For each requirement provide:
1. "why_qualified": 2-3 sentence explanation
2. "resume_language": Ready-to-paste resume bullet
3. "gap_explanation" (for gaps): What's missing?
4. "bridging_strategy" (for gaps): How to address?
5. Evidence citations (E# list)
6. Gap taxonomy: {Domain / Scope / Ownership / Metric / Tooling / Recency}
7. Risk level: {Low / Medium / High}
8. Confidence: {very-high / high / moderate / low}

STEP D — INFERENCE MAP (CRITICAL FOR EVIDENCE SAFETY)
For each requirement, identify:
- verified_claims: Claims backed by direct evidence
- plausible_inferences: Reasonable inferences NOT proven
- validation_questions: Questions to confirm inferences
- draft_bullets_placeholders: Bullets needing confirmation`;

    const pass1UserPrompt = `Analyze this resume against the job description. Focus on evidence extraction and fit analysis.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return valid JSON only:
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
  "executive_summary": {
    "hire_signal":"...",
    "likely_objections":["..."],
    "mitigation_strategy":["..."],
    "best_positioning_angle":"..."
  },
  "overall_fit_score": 75
}`;

    // FIX: Switch to Gemini (DEFAULT) for Pass 1 - it handles large structured JSON better
    // and doesn't have the token truncation issues that GPT-5 has with complex outputs
    const { response: pass1Response, metrics: pass1Metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: pass1SystemPrompt },
          { role: 'user', content: pass1UserPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT, // Use Gemini instead of GPT-5 for better JSON handling
        temperature: 0.2,
        max_tokens: 16000, // Increased from 6000 to prevent truncation
        response_mime_type: "application/json" // Gemini JSON mode
      },
      'fit-blueprint-pass1',
      authedUser.id,
      120000 // Longer timeout for larger response
    );

    const pass1Duration = Date.now() - pass1Start;
    console.log(`✅ PASS 1 complete in ${pass1Duration}ms, tokens:`, pass1Metrics);

    const pass1Message = pass1Response.choices?.[0]?.message;
    const finishReason = pass1Response.choices?.[0]?.finish_reason;
    let pass1Content: string | undefined = pass1Message?.content;

    // Check for truncation - if finish_reason is 'length', the output was cut off
    if (finishReason === 'length') {
      console.warn('⚠️ Pass 1 response was TRUNCATED (finish_reason: length). Output may be incomplete.');
    }

    // Fallback: some model/providers may return tool_calls without message.content
    if ((!pass1Content || !pass1Content.trim()) && Array.isArray(pass1Message?.tool_calls) && pass1Message.tool_calls.length > 0) {
      const tc = pass1Message.tool_calls[0];
      pass1Content = tc?.function?.arguments;
      console.log('Pass 1 returned tool_calls; using tool_call.arguments as content');
    }

    if (!pass1Content || !pass1Content.trim()) {
      console.error('Pass 1 empty content. finish_reason:', finishReason, 'message keys:', pass1Message ? Object.keys(pass1Message) : null);
      throw new Error('No response from Pass 1 analysis');
    }

    const pass1Result = extractJSON(pass1Content);
    if (!pass1Result.success || !pass1Result.data) {
      console.error('Pass 1 JSON parse failed:', pass1Result.error, 'Content preview:', pass1Content.substring(0, 500));
      throw new Error('Failed to parse Pass 1 analysis');
    }

    const analysisData = pass1Result.data;

    // =========================================================================
    // PASS 2: GENERATION (Bullet Banks + Proof Collector + ATS)
    // =========================================================================
    console.log('✍️ PASS 2: Starting Generation Pass...');
    const pass2Start = Date.now();

    // Summarize Pass 1 for Pass 2 context
    const evidenceSummary = (analysisData.evidence_inventory || [])
      .slice(0, 20)
      .map((e: any) => `${e.id}: ${e.text?.substring(0, 100)}...`)
      .join('\n');

    const fitSummary = (analysisData.fit_map || [])
      .map((f: any) => `${f.requirement_id}: ${f.category} - ${f.resume_language?.substring(0, 80)}...`)
      .join('\n');

    const gapRequirements = (analysisData.fit_map || [])
      .filter((f: any) => f.category === 'PARTIALLY QUALIFIED' || f.category === 'EXPERIENCE GAP')
      .map((f: any) => `${f.requirement_id}: ${f.gap_explanation || 'Gap not specified'}`);

    const pass2SystemPrompt = `You are an expert resume architect. Given the analysis from Pass 1, generate:
1. Bullet Bank (verified bullets only using evidence)
2. Proof Collector Fields (structured questions to gather missing information)
3. ATS Alignment (keyword coverage)

Be TRUTHFUL - only create bullets backed by evidence. Flag anything needing confirmation.`;

    const pass2UserPrompt = `Based on this analysis, generate resume content and proof collection fields.

EVIDENCE INVENTORY:
${evidenceSummary}

FIT ANALYSIS:
${fitSummary}

GAPS TO ADDRESS:
${gapRequirements.length > 0 ? gapRequirements.join('\n') : 'No significant gaps identified'}

INFERENCE MAP (validation questions needed):
${JSON.stringify(analysisData.inference_map || [], null, 2)}

JOB DESCRIPTION KEYWORDS TO MATCH:
${jobDescription.substring(0, 1500)}

Return valid JSON:
{
  "benchmark_resume_pattern": {
    "target_title_rules": ["..."],
    "section_order": ["Summary", "Signature Wins", "Experience", "Skills", "Education"],
    "signature_wins_pattern": {"description": "...", "bullet_formula": "...", "examples": ["..."]},
    "summary_pattern": {"description": "...", "required_elements": ["..."]},
    "bullet_formula": "Action + Scope + Outcome + Method",
    "executive_50plus_rules": ["Hide graduation years", "Emphasize last 10-15 years", "Condense early career"]
  },
  "bullet_bank_verified": [{"bullet":"...","evidence_ids":["E3"],"requirement_ids":["R2","R5"]}],
  "bullet_bank_inferred_placeholders": [{"status": "NEEDS_CONFIRMATION", "bullet":"...","required_fields":["field_key"],"target_requirements":["R6"]}],
  "proof_collector_fields": [{
    "field_key": "team_size",
    "label": "Team Size",
    "description": "How many people did you directly manage?",
    "field_type": "number",
    "category": "Scope",
    "priority": "high",
    "examples": ["5", "15", "50+"],
    "unlocks_requirements": ["R3", "R7"]
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
  }
}`;

    const { response: pass2Response, metrics: pass2Metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: pass2SystemPrompt },
          { role: 'user', content: pass2UserPrompt }
        ],
        model: LOVABLE_AI_MODELS.FAST,
        temperature: 0.3,
        max_tokens: 4000,
        response_mime_type: "application/json"
      },
      'fit-blueprint-pass2',
      authedUser.id,
      60000
    );

    const pass2Duration = Date.now() - pass2Start;
    console.log(`✅ PASS 2 complete in ${pass2Duration}ms, tokens:`, pass2Metrics);

    const pass2Content = pass2Response.choices?.[0]?.message?.content;
    if (!pass2Content) {
      throw new Error('No response from Pass 2 generation');
    }

    const pass2Result = extractJSON(pass2Content);
    if (!pass2Result.success || !pass2Result.data) {
      console.error('Pass 2 JSON parse failed:', pass2Result.error);
      throw new Error('Failed to parse Pass 2 generation');
    }

    const generationData = pass2Result.data;

    // =========================================================================
    // MERGE PASSES INTO FINAL BLUEPRINT
    // =========================================================================
    console.log('🔗 Merging Pass 1 + Pass 2 into final blueprint...');

    const rawBlueprint = {
      ...analysisData,
      ...generationData
    };
    
    // Transform to camelCase for frontend
    const blueprint = {
      // From Pass 1: Role Success Rubric
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
      
      // From Pass 2: Benchmark Resume Pattern
      benchmarkResumePattern: rawBlueprint.benchmark_resume_pattern ? {
        targetTitleRules: rawBlueprint.benchmark_resume_pattern.target_title_rules || [],
        sectionOrder: rawBlueprint.benchmark_resume_pattern.section_order || resumePattern.sectionOrder,
        signatureWinsPattern: rawBlueprint.benchmark_resume_pattern.signature_wins_pattern || null,
        summaryPattern: rawBlueprint.benchmark_resume_pattern.summary_pattern || null,
        bulletFormula: rawBlueprint.benchmark_resume_pattern.bullet_formula || resumePattern.bulletFormula,
        executive50PlusRules: rawBlueprint.benchmark_resume_pattern.executive_50plus_rules || resumePattern.executive50PlusRules
      } : resumePattern,
      
      // From Pass 1: Evidence Inventory
      evidenceInventory: (rawBlueprint.evidence_inventory || []).map((e: any) => ({
        id: e.id,
        sourceRole: e.source_role,
        text: e.text,
        type: e.type || 'Story',
        proofType: e.proof_type || e.strength,
        strength: e.strength
      })),
      
      // From Pass 1: Requirements
      requirements: (rawBlueprint.requirements || []).map((r: any) => ({
        id: r.id,
        requirement: r.requirement,
        type: r.type,
        senioritySignal: r.seniority_signal,
        outcomeTarget: r.outcome_target,
        competencyId: r.competency_id
      })),
      
      // From Pass 1: Fit Map
      fitMap: (rawBlueprint.fit_map || []).map((f: any) => {
        let resumeLanguage = f.resume_language || '';
        if (!resumeLanguage && f.rationale) {
          resumeLanguage = f.rationale;
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
      
      // From Pass 1: Inference Map
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
      
      // From Pass 1: Benchmark Themes
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
      
      // From Pass 2: Separated bullet banks
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
      
      // From Pass 2: Proof Collector Fields
      proofCollectorFields: (rawBlueprint.proof_collector_fields || []).map((f: any) => ({
        fieldKey: f.field_key,
        label: f.label,
        description: f.description,
        fieldType: f.field_type || 'text',
        options: f.options,
        examples: f.examples,
        priority: f.priority || 'medium',
        category: f.category || 'Outcomes',
        unlocksRequirements: f.unlocks_requirements || []
      })),
      
      // From Pass 2: Missing Bullet Plan
      missingBulletPlan: (rawBlueprint.missing_bullet_plan || []).map((m: any, idx: number) => ({
        id: m.id || `mb${idx + 1}`,
        targetRequirementIds: m.target_requirement_ids || [],
        whatToAskCandidate: m.what_to_ask_candidate,
        whereToPlace: m.where_to_place,
        templateBullet: m.template_bullet
      })),
      
      // From Pass 2: ATS Alignment
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
      
      // From Pass 1: Executive Summary
      executiveSummary: {
        hireSignal: rawBlueprint.executive_summary?.hire_signal || '',
        likelyObjections: rawBlueprint.executive_summary?.likely_objections || [],
        mitigationStrategy: rawBlueprint.executive_summary?.mitigation_strategy || [],
        bestPositioningAngle: rawBlueprint.executive_summary?.best_positioning_angle || ''
      },
      
      overallFitScore: rawBlueprint.overall_fit_score || 70,
      
      // Metadata about the split pass execution
      _meta: {
        pass1DurationMs: pass1Duration,
        pass2DurationMs: pass2Duration,
        totalDurationMs: pass1Duration + pass2Duration,
        detectedArchetype,
        hasMatchedRubric: !!matchedRubric
      }
    };

    console.log(`✅ Fit Blueprint complete! Total time: ${pass1Duration + pass2Duration}ms (Pass1: ${pass1Duration}ms, Pass2: ${pass2Duration}ms)`);

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

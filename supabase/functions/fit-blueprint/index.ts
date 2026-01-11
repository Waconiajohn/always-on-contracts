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
// SINGLE-PASS GPT-5 FIT BLUEPRINT
// Combines analysis + generation into one AI call for reliability
// =============================================================================

// Input trimming functions to prevent token bloat
function trimResume(text: string, maxChars: number = 15000): string {
  if (text.length <= maxChars) return text;
  
  // Try to keep structure: summary + recent roles + key achievements
  const lines = text.split('\n');
  let result: string[] = [];
  let charCount = 0;
  
  for (const line of lines) {
    if (charCount + line.length > maxChars) break;
    result.push(line);
    charCount += line.length + 1;
  }
  
  console.log(`Resume trimmed: ${text.length} → ${charCount} chars`);
  return result.join('\n');
}

function trimJobDescription(text: string, maxChars: number = 12000): string {
  if (text.length <= maxChars) return text;
  
  // Remove common boilerplate patterns
  let cleaned = text
    .replace(/Equal Opportunity Employer[^]*?(?=\n\n|\n[A-Z]|$)/gi, '')
    .replace(/About (the company|us)[^]*?(?=\n\n|\n[A-Z]|$)/gi, '')
    .replace(/Benefits[^]*?(?=\n\n|\n[A-Z]|$)/gi, '')
    .replace(/We are an equal[^]*?(?=\n\n|$)/gi, '')
    .trim();
  
  if (cleaned.length <= maxChars) return cleaned;
  
  // Truncate to maxChars
  cleaned = cleaned.substring(0, maxChars);
  console.log(`JD trimmed: ${text.length} → ${cleaned.length} chars`);
  return cleaned;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestStart = Date.now();
  console.log('🚀 fit-blueprint request started');

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

    const { resumeText: rawResume, jobDescription: rawJD } = await req.json();
    
    if (!rawResume || !rawJD) {
      throw new Error('Resume text and job description are required');
    }

    // Apply input trimming to prevent token bloat
    const resumeText = trimResume(rawResume);
    const jobDescription = trimJobDescription(rawJD);
    
    console.log(`Input sizes: resume=${resumeText.length} chars, JD=${jobDescription.length} chars`);

    // Detect role archetype and get matching rubric
    const detectedArchetype = detectRoleArchetype(jobDescription);
    const matchedRubric = findExecutiveRubric(detectedArchetype);
    const resumePattern = getDefaultResumePattern();
    
    console.log('Detected role archetype:', detectedArchetype, '| Matched rubric:', matchedRubric?.roleArchetype || 'none');

    // Build compact rubric context (reduced verbosity)
    const rubricContext = matchedRubric ? `
ROLE EVALUATION FRAMEWORK:
Archetype: ${matchedRubric.roleArchetype}
Core Outcomes: ${matchedRubric.coreOutcomes.slice(0, 3).join('; ')}
Key Competencies: ${matchedRubric.topCompetencies.slice(0, 4).map(c => c.name).join(', ')}
Executive Signals: ${matchedRubric.executiveSignals.slice(0, 3).join('; ')}
` : '';

    // =========================================================================
    // SINGLE-PASS GPT-5: Combined Analysis + Generation
    // =========================================================================
    console.log('🔍 Starting single-pass GPT-5 analysis...');
    const aiStart = Date.now();

    const systemPrompt = `You are an expert hiring evaluator and resume architect. Analyze candidates rigorously and generate actionable resume content.

Your task: Analyze the candidate's fit for this role and generate resume optimization content in ONE response.
${rubricContext}

OUTPUT REQUIREMENTS:
1. Evidence Inventory: Extract 10-12 strongest evidence items from resume (E1, E2...)
2. Requirements: Extract 8-10 key job requirements (R1, R2...)
3. Fit Map: Classify each requirement as HIGHLY QUALIFIED, PARTIALLY QUALIFIED, or EXPERIENCE GAP
4. Bullet Bank: Generate 5-8 ready-to-use resume bullets backed by evidence
5. ATS Keywords: Identify covered and missing keywords
6. Missing Bullet Plan: Questions to gather missing proof

CRITICAL RULES:
- Only create bullets backed by explicit evidence
- Mark inferences as needing confirmation
- Be truthful - don't invent metrics or claims
- Keep text fields concise (under 100 chars each)`;

    const userPrompt = `Analyze this resume against the job and return a complete Fit Blueprint.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return valid JSON with this exact structure:
{
  "role_success_rubric": {
    "role_archetype": "detected role type",
    "industry_context": "brief context",
    "core_outcomes": ["outcome1", "outcome2", "outcome3"],
    "top_competencies": [{"id": "comp1", "name": "name", "definition": "brief"}],
    "executive_signals": ["signal1", "signal2"]
  },
  "evidence_inventory": [
    {"id": "E1", "source_role": "role at company", "text": "concise evidence", "proof_type": "strong|moderate|weak"}
  ],
  "requirements": [
    {"id": "R1", "requirement": "requirement text", "type": "Leadership|Domain|Execution", "seniority_signal": "Director|Manager|IC"}
  ],
  "fit_map": [
    {
      "requirement_id": "R1",
      "category": "HIGHLY QUALIFIED|PARTIALLY QUALIFIED|EXPERIENCE GAP",
      "why_qualified": "Brief explanation",
      "resume_language": "Ready-to-use resume bullet",
      "gap_explanation": "For gaps only",
      "bridging_strategy": "For gaps only",
      "evidence_ids": ["E1", "E2"],
      "risk_level": "Low|Medium|High"
    }
  ],
  "inference_map": [
    {
      "requirement_id": "R1",
      "validation_questions": [{"question": "text", "field_key": "key", "field_type": "text|number"}]
    }
  ],
  "benchmark_resume_pattern": {
    "section_order": ["Summary", "Experience", "Skills", "Education"],
    "bullet_formula": "Action + Scope + Outcome"
  },
  "bullet_bank_verified": [
    {"bullet": "Achievement bullet backed by evidence", "evidence_ids": ["E1"], "requirement_ids": ["R1"]}
  ],
  "bullet_bank_inferred_placeholders": [
    {"status": "NEEDS_CONFIRMATION", "bullet": "Bullet needing verification", "required_fields": ["field_key"]}
  ],
  "proof_collector_fields": [
    {"field_key": "team_size", "label": "Team Size", "description": "How many people?", "field_type": "number", "priority": "high"}
  ],
  "missing_bullet_plan": [
    {"id": "mb1", "target_requirement_ids": ["R6"], "what_to_ask_candidate": "Question", "template_bullet": "Template"}
  ],
  "ats_alignment": {
    "top_keywords": ["keyword1", "keyword2"],
    "covered": [{"keyword": "word", "evidence_ids": ["E1"]}],
    "missing_but_addable": [{"keyword": "word", "template": "How to add"}],
    "missing_requires_experience": [{"keyword": "word", "why_gap": "reason"}]
  },
  "executive_summary": {
    "hire_signal": "One sentence recommendation",
    "best_positioning_angle": "Best angle for this candidate"
  },
  "overall_fit_score": 75
}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM, // GPT-5
        max_tokens: 16000,
        response_format: { type: 'json_object' }
      },
      'fit-blueprint',
      authedUser.id,
      110000 // 110s timeout (under Supabase's ~120s limit)
    );

    const aiDuration = Date.now() - aiStart;
    console.log(`✅ AI call complete in ${aiDuration}ms, tokens:`, metrics);

    // Check for truncation
    const finishReason = response.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      console.warn('⚠️ Response was TRUNCATED (finish_reason: length)');
    }

    const message = response.choices?.[0]?.message;
    let content: string | undefined = message?.content;

    // Fallback for tool_calls response format
    if ((!content || !content.trim()) && Array.isArray(message?.tool_calls) && message.tool_calls.length > 0) {
      content = message.tool_calls[0]?.function?.arguments;
      console.log('Using tool_call.arguments as content');
    }

    if (!content || !content.trim()) {
      console.error('Empty AI response. finish_reason:', finishReason);
      throw new Error('No response from AI analysis');
    }

    const parseResult = extractJSON(content);
    if (!parseResult.success || !parseResult.data) {
      console.error('JSON parse failed:', parseResult.error);
      console.error('Content preview:', content.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }

    const rawBlueprint = parseResult.data;

    // =========================================================================
    // TRANSFORM TO FRONTEND FORMAT
    // =========================================================================
    console.log('🔗 Transforming blueprint to frontend format...');

    const blueprint = {
      // Role Success Rubric
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
      
      // NEW: Benchmark Candidate Profile
      benchmarkCandidateProfile: rawBlueprint.benchmark_candidate_profile ? {
        topCompetencies: (rawBlueprint.benchmark_candidate_profile.top_competencies || []).map((c: any) => ({
          name: c.name,
          definition: c.definition,
          proofExamples: c.proof_examples || [],
          weight: c.weight || 'important'
        })),
        expectedProofPoints: rawBlueprint.benchmark_candidate_profile.expected_proof_points || [],
        typicalMetrics: (rawBlueprint.benchmark_candidate_profile.typical_metrics || []).map((m: any) => ({
          metric: m.metric,
          range: m.range,
          context: m.context || ''
        })),
        commonArtifacts: rawBlueprint.benchmark_candidate_profile.common_artifacts || [],
        weakResumePitfalls: rawBlueprint.benchmark_candidate_profile.weak_resume_pitfalls || []
      } : null,
      
      // Benchmark Resume Pattern
      benchmarkResumePattern: rawBlueprint.benchmark_resume_pattern ? {
        targetTitleRules: rawBlueprint.benchmark_resume_pattern.target_title_rules || [],
        sectionOrder: rawBlueprint.benchmark_resume_pattern.section_order || resumePattern.sectionOrder,
        signatureWinsPattern: rawBlueprint.benchmark_resume_pattern.signature_wins_pattern || null,
        summaryPattern: rawBlueprint.benchmark_resume_pattern.summary_pattern || null,
        bulletFormula: rawBlueprint.benchmark_resume_pattern.bullet_formula || resumePattern.bulletFormula,
        executive50PlusRules: rawBlueprint.benchmark_resume_pattern.executive_50plus_rules || resumePattern.executive50PlusRules
      } : resumePattern,
      
      // Evidence Inventory
      evidenceInventory: (rawBlueprint.evidence_inventory || []).map((e: any) => ({
        id: e.id,
        sourceRole: e.source_role,
        text: e.text,
        type: e.type || 'Story',
        proofType: e.proof_type || e.strength,
        strength: e.strength
      })),
      
      // Requirements
      requirements: (rawBlueprint.requirements || []).map((r: any) => ({
        id: r.id,
        requirement: r.requirement,
        type: r.type,
        senioritySignal: r.seniority_signal,
        outcomeTarget: r.outcome_target,
        competencyId: r.competency_id
      })),
      
      // Fit Map - Enhanced with bullet tiers
      fitMap: (rawBlueprint.fit_map || []).map((f: any) => {
        let resumeLanguage = f.resume_language || '';
        if (!resumeLanguage && f.rationale) {
          resumeLanguage = f.rationale;
        }
        
        // Transform bullet tiers if present
        const bulletTiers = f.bullet_tiers ? {
          conservative: {
            bullet: f.bullet_tiers.conservative?.bullet || resumeLanguage,
            emphasis: f.bullet_tiers.conservative?.emphasis || 'Evidence-backed',
            requiresConfirmation: false,
            confirmationFields: []
          },
          strong: {
            bullet: f.bullet_tiers.strong?.bullet || resumeLanguage,
            emphasis: f.bullet_tiers.strong?.emphasis || 'Verify details',
            requiresConfirmation: true,
            confirmationFields: f.bullet_tiers.strong?.confirmation_fields || []
          },
          aggressive: {
            bullet: f.bullet_tiers.aggressive?.bullet || resumeLanguage,
            emphasis: f.bullet_tiers.aggressive?.emphasis || 'Benchmark positioning',
            requiresConfirmation: true,
            confirmationFields: f.bullet_tiers.aggressive?.confirmation_fields || []
          }
        } : undefined;
        
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
          confidence: f.confidence,
          bulletTiers
        };
      }),
      
      // Inference Map
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
      
      // Benchmark Themes
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
      
      // Separated bullet banks
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
      
      // Proof Collector Fields
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
      
      // Missing Bullet Plan
      missingBulletPlan: (rawBlueprint.missing_bullet_plan || []).map((m: any, idx: number) => ({
        id: m.id || `mb${idx + 1}`,
        targetRequirementIds: m.target_requirement_ids || [],
        whatToAskCandidate: m.what_to_ask_candidate,
        whereToPlace: m.where_to_place,
        templateBullet: m.template_bullet
      })),
      
      // ATS Alignment
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
      
      // Executive Summary
      executiveSummary: {
        hireSignal: rawBlueprint.executive_summary?.hire_signal || '',
        likelyObjections: rawBlueprint.executive_summary?.likely_objections || [],
        mitigationStrategy: rawBlueprint.executive_summary?.mitigation_strategy || [],
        bestPositioningAngle: rawBlueprint.executive_summary?.best_positioning_angle || ''
      },
      
      overallFitScore: rawBlueprint.overall_fit_score || 70,
      
      // Metadata
      _meta: {
        aiDurationMs: aiDuration,
        totalDurationMs: Date.now() - requestStart,
        detectedArchetype,
        hasMatchedRubric: !!matchedRubric,
        model: 'gpt-5',
        singlePass: true
      }
    };

    const totalDuration = Date.now() - requestStart;
    console.log(`✅ Fit Blueprint complete! Total time: ${totalDuration}ms (AI: ${aiDuration}ms)`);

    return new Response(JSON.stringify(blueprint), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const totalDuration = Date.now() - requestStart;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Classify error type for better frontend handling
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout');
    const errorCode = isTimeout ? 'TIMEOUT' : 'ANALYSIS_ERROR';
    
    console.error(`❌ Fit Blueprint error after ${totalDuration}ms:`, errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      errorCode,
      durationMs: totalDuration
    }), {
      status: isTimeout ? 504 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

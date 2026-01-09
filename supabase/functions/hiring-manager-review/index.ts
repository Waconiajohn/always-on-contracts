import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Types =============
interface RoleSuccessRubric {
  roleArchetype: string;
  industryContext: string;
  coreOutcomes: string[];
  topCompetencies: { id: string; name: string; definition: string }[];
  benchmarkProofPoints: string[];
  metricsNorms: { metric: string; typicalRange: string }[];
  commonPitfalls: string[];
  executiveSignals: string[];
}

interface FitBlueprint {
  roleSuccessRubric?: RoleSuccessRubric;
  evidenceInventory?: { id: string; text: string; strength: string }[];
  requirements?: { id: string; requirement: string }[];
  fitMap?: { requirementId: string; category: string; riskLevel: string }[];
  overallFitScore?: number;
  executiveSummary?: {
    hireSignal: string;
    likelyObjections: string[];
    mitigationStrategy: string[];
  };
}

interface HMReviewRequest {
  resumeContent: any;
  jobDescription: string;
  jobTitle?: string;
  industry?: string;
  fitBlueprint?: FitBlueprint;
  benchmarkResume?: any;
}

// ============= Helper Functions =============
function buildRubricContext(rubric?: RoleSuccessRubric): string {
  if (!rubric) return '';
  
  return `
ROLE SUCCESS RUBRIC (evaluate candidate against these criteria):
- Role Archetype: ${rubric.roleArchetype}
- Industry Context: ${rubric.industryContext}
- Core Outcomes Expected: ${rubric.coreOutcomes?.join(', ') || 'N/A'}
- Top Competencies Required:
${rubric.topCompetencies?.map(c => `  • ${c.name}: ${c.definition}`).join('\n') || '  N/A'}
- Benchmark Proof Points (what great candidates have):
${rubric.benchmarkProofPoints?.map(p => `  • ${p}`).join('\n') || '  N/A'}
- Key Metrics Norms:
${rubric.metricsNorms?.map(m => `  • ${m.metric}: ${m.typicalRange}`).join('\n') || '  N/A'}
- Common Pitfalls to Watch For:
${rubric.commonPitfalls?.map(p => `  • ${p}`).join('\n') || '  N/A'}
- Executive Signals (differentiators):
${rubric.executiveSignals?.map(s => `  • ${s}`).join('\n') || '  N/A'}`;
}

function buildFitContext(fitBlueprint?: FitBlueprint): string {
  if (!fitBlueprint) return '';
  
  const gaps = fitBlueprint.fitMap?.filter(f => f.category === 'EXPERIENCE GAP') || [];
  const highRisks = fitBlueprint.fitMap?.filter(f => f.riskLevel === 'High') || [];
  
  return `
FIT ANALYSIS SUMMARY:
- Overall Fit Score: ${fitBlueprint.overallFitScore || 'N/A'}%
- Evidence Units Found: ${fitBlueprint.evidenceInventory?.length || 0}
- Requirements Analyzed: ${fitBlueprint.requirements?.length || 0}
- Experience Gaps Identified: ${gaps.length}
- High-Risk Areas: ${highRisks.length}

EXECUTIVE SUMMARY FROM ANALYSIS:
- Hire Signal: ${fitBlueprint.executiveSummary?.hireSignal || 'N/A'}
- Likely Objections: ${fitBlueprint.executiveSummary?.likelyObjections?.join('; ') || 'None identified'}
- Mitigation Strategies: ${fitBlueprint.executiveSummary?.mitigationStrategy?.join('; ') || 'N/A'}`;
}

// ============= Main Handler =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const body: HMReviewRequest = await req.json();
    const { resumeContent, jobDescription, jobTitle, industry, fitBlueprint, benchmarkResume } = body;

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    console.log('Starting HM review with rubric:', !!fitBlueprint?.roleSuccessRubric);

    // Build resume text from sections
    const resumeText = Array.isArray(resumeContent) 
      ? resumeContent.map((s: any) => `${s.title}:\n${s.content?.join('\n') || ''}`).join('\n\n')
      : typeof resumeContent === 'object' && resumeContent.sections
        ? resumeContent.sections.map((s: any) => `${s.title}:\n${s.content?.join('\n') || ''}`).join('\n\n')
        : resumeContent;

    // Build contextual information
    const rubricContext = buildRubricContext(fitBlueprint?.roleSuccessRubric);
    const fitContext = buildFitContext(fitBlueprint);

    const systemPrompt = `You are an experienced hiring manager with 15+ years in ${industry || 'the industry'} performing a critical resume review. You're evaluating this candidate for a ${jobTitle || 'senior'} role.

YOUR PERSONA:
- You've hired 100+ professionals at various levels
- You know what separates good candidates from great ones
- You're direct but constructive in feedback
- You focus on evidence of impact, not just responsibilities

YOUR EVALUATION APPROACH:
1. First, assess against the Role Success Rubric (if provided)
2. Look for evidence of the core competencies required
3. Check for benchmark-level proof points
4. Identify gaps that would come up in interviews
5. Suggest specific improvements that would strengthen the candidacy
${rubricContext}
${fitContext}

CRITICAL EVALUATION CRITERIA:
- Does the resume demonstrate the core outcomes expected?
- Are there quantified achievements that match industry benchmarks?
- Is there evidence of the required competencies?
- What would make you hesitate to bring this candidate in?
- What would make you excited to interview them?

Return ONLY valid JSON with this exact structure:
{
  "would_interview": boolean,
  "recommendation": "strong-yes" | "yes" | "maybe" | "no",
  "confidence_level": "high" | "medium" | "low",
  "overall_impression": "2-3 sentence honest assessment",
  "rubric_evaluation": {
    "competencies_demonstrated": [
      { "competency": "name", "evidence_level": "strong" | "moderate" | "weak" | "missing", "notes": "specific observation" }
    ],
    "outcomes_addressed": [
      { "outcome": "name", "addressed": boolean, "how": "brief explanation" }
    ],
    "benchmark_gaps": ["gap 1", "gap 2"]
  },
  "strengths": [
    { "point": "What's strong", "evidence": "Where you saw it", "impact_level": "critical" | "important" | "nice_to_have" }
  ],
  "critical_gaps": [
    {
      "gap": "What's missing",
      "why_matters": "Why this matters for the role",
      "recommendation": "Specific fix",
      "severity": "deal_breaker" | "concerning" | "minor",
      "interview_risk": "How this might come up in interview"
    }
  ],
  "improvement_suggestions": [
    { 
      "section": "Which section", 
      "current_issue": "What's wrong",
      "suggested_improvement": "Better version or approach", 
      "expected_impact": "How this helps",
      "priority": "high" | "medium" | "low" 
    }
  ],
  "interview_questions": [
    { "question": "Question text", "purpose": "What you're probing for", "red_flag_answer": "Answer that would concern you" }
  ],
  "final_verdict": {
    "summary": "One paragraph final assessment",
    "top_strength": "Single biggest strength",
    "biggest_concern": "Single biggest concern",
    "interview_likelihood": 0-100
  }
}`;

    const userPrompt = `JOB TITLE: ${jobTitle || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Perform your comprehensive hiring manager review. Be thorough, honest, and provide actionable feedback that would actually help this candidate.`;

    console.log('Calling Lovable AI for hiring manager review...');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.4,
        max_tokens: 4000,
      },
      'hiring-manager-review',
      user.id,
      60000
    );

    console.log('AI response received, metrics:', metrics);

    const reviewText = response.choices?.[0]?.message?.content;
    if (!reviewText) {
      throw new Error('No review content returned');
    }

    const parseResult = extractJSON(reviewText);
    if (!parseResult.success || !parseResult.data) {
      console.error('Failed to parse review JSON:', reviewText.substring(0, 500));
      throw new Error('Failed to parse review data');
    }

    const reviewData = parseResult.data;

    // Transform to frontend format
    const transformedReview = {
      wouldInterview: reviewData.would_interview,
      recommendation: reviewData.recommendation,
      confidenceLevel: reviewData.confidence_level,
      overallImpression: reviewData.overall_impression,
      rubricEvaluation: reviewData.rubric_evaluation ? {
        competenciesDemonstrated: reviewData.rubric_evaluation.competencies_demonstrated || [],
        outcomesAddressed: reviewData.rubric_evaluation.outcomes_addressed || [],
        benchmarkGaps: reviewData.rubric_evaluation.benchmark_gaps || []
      } : null,
      strengths: (reviewData.strengths || []).map((s: any) => ({
        point: s.point,
        evidence: s.evidence,
        impactLevel: s.impact_level
      })),
      criticalGaps: (reviewData.critical_gaps || []).map((g: any) => ({
        gap: g.gap,
        whyMatters: g.why_matters,
        recommendation: g.recommendation,
        severity: g.severity,
        interviewRisk: g.interview_risk
      })),
      improvementSuggestions: (reviewData.improvement_suggestions || []).map((s: any) => ({
        section: s.section,
        currentIssue: s.current_issue,
        suggestedImprovement: s.suggested_improvement,
        expectedImpact: s.expected_impact,
        priority: s.priority
      })),
      interviewQuestions: (reviewData.interview_questions || []).map((q: any) => 
        typeof q === 'string' ? { question: q, purpose: '', redFlagAnswer: '' } : {
          question: q.question,
          purpose: q.purpose,
          redFlagAnswer: q.red_flag_answer
        }
      ),
      finalVerdict: reviewData.final_verdict ? {
        summary: reviewData.final_verdict.summary,
        topStrength: reviewData.final_verdict.top_strength,
        biggestConcern: reviewData.final_verdict.biggest_concern,
        interviewLikelihood: reviewData.final_verdict.interview_likelihood
      } : null,
      _meta: {
        reviewedAt: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
        hadRubric: !!fitBlueprint?.roleSuccessRubric,
        hadFitBlueprint: !!fitBlueprint
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        review: transformedReview,
        reviewed_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in hiring-manager-review:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        _meta: {
          executionTimeMs: Date.now() - startTime
        }
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

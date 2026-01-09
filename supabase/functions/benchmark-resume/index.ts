import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { extractToolCallJSON } from "../_shared/json-parser.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Zod Schema for Validation =============
const ResumeSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  content: z.array(z.string()),
  evidence_tags: z.record(z.array(z.string())).optional().default({})
});

const BenchmarkResumeOutputSchema = z.object({
  sections: z.array(ResumeSectionSchema),
  changelog: z.array(z.object({
    section: z.string().optional(),
    change: z.string().optional(),
    reason: z.string().optional(),
    rationale: z.string().optional(),
    evidence_used: z.array(z.string()).optional(),
    requirement_ids: z.array(z.string()).optional()
  })).optional().default([]),
  verification_report: z.object({
    total_claims: z.number().optional(),
    verified_claims: z.number().optional(),
    inferred_claims: z.number().optional(),
    unverifiable_omitted: z.number().optional()
  }).optional().nullable(),
  follow_up_questions: z.array(z.string()).optional().default([])
});

// ============= Types =============
interface ConfirmedFacts {
  [fieldKey: string]: string | number | string[] | { min: number; max: number };
}

interface Executive50PlusPreferences {
  hideGraduationYears: boolean;
  experienceCondensationYears: number;
  includeAdditionalExperience: boolean;
  signatureWinsPosition: 'top' | 'inline';
}

type ResumeMode = 'interview-safe' | 'brainstorm';

interface CustomizationSettings {
  intensity: 'conservative' | 'moderate' | 'aggressive';
  tone: 'formal' | 'conversational' | 'technical' | 'executive';
}

interface BenchmarkResumeRequest {
  resumeText: string;
  jobDescription: string;
  fitBlueprint: any;
  confirmedFacts?: ConfirmedFacts;
  missingBulletResponses?: Record<string, string>; // Legacy support
  customization?: CustomizationSettings;
  executive50PlusPrefs?: Executive50PlusPreferences;
  resumeMode?: ResumeMode;
}

// ============= Helper Functions =============

function formatConfirmedFacts(confirmedFacts: ConfirmedFacts): string {
  if (!confirmedFacts || Object.keys(confirmedFacts).length === 0) {
    return '';
  }
  
  const lines: string[] = [];
  for (const [key, value] of Object.entries(confirmedFacts)) {
    if (value === null || value === undefined || value === '') continue;
    
    if (typeof value === 'object' && 'min' in value && 'max' in value) {
      lines.push(`- ${key}: ${value.min}-${value.max}`);
    } else if (Array.isArray(value)) {
      lines.push(`- ${key}: ${value.join(', ')}`);
    } else {
      lines.push(`- ${key}: ${value}`);
    }
  }
  
  return lines.length > 0 
    ? `USER-CONFIRMED FACTS (verified, use these exact figures):\n${lines.join('\n')}` 
    : '';
}

function buildExecutive50PlusInstructions(prefs?: Executive50PlusPreferences): string {
  if (!prefs) return '';
  
  const instructions: string[] = [];
  
  if (prefs.hideGraduationYears) {
    instructions.push('- OMIT graduation years from education section');
  }
  
  if (prefs.experienceCondensationYears) {
    instructions.push(`- Condense experience older than ${prefs.experienceCondensationYears} years into "Additional Experience" section`);
    if (!prefs.includeAdditionalExperience) {
      instructions.push('- Do NOT include the Additional Experience section at all');
    }
  }
  
  if (prefs.signatureWinsPosition === 'top') {
    instructions.push('- Place "Signature Wins" or "Career Highlights" section BEFORE detailed experience');
  }
  
  return instructions.length > 0
    ? `\nEXECUTIVE 50+ FORMATTING RULES:\n${instructions.join('\n')}`
    : '';
}

function buildModeInstructions(mode: ResumeMode): string {
  if (mode === 'interview-safe') {
    return `
RESUME MODE: INTERVIEW-SAFE (DEFAULT)
- ONLY use claims backed by verified evidence (E tags) or user-confirmed facts
- Every metric, scope claim, and achievement MUST have evidence support
- Do NOT extrapolate or embellish beyond what's proven
- If evidence is weak, use softer language or omit the claim
- Mark any inference with [NEEDS-CONFIRMATION] if included`;
  } else {
    return `
RESUME MODE: BRAINSTORM
- You may include plausible inferences and suggestions
- Mark speculative content with [SUGGESTION] tag
- Still avoid outright fabrication
- User understands this is a working draft`;
  }
}

/**
 * Build resume_text from sections server-side to reduce AI output size
 */
function buildResumeTextFromSections(sections: any[]): string {
  const lines: string[] = [];
  
  for (const section of sections) {
    if (section.title && section.type !== 'header') {
      lines.push(`\n${section.title.toUpperCase()}\n${'─'.repeat(section.title.length)}`);
    }
    
    if (Array.isArray(section.content)) {
      for (const line of section.content) {
        // Remove evidence tags for clean resume text
        const cleanLine = line.replace(/\s*\[E\d+(?:,\s*[ER]\d+)*\]\s*$/g, '').trim();
        if (cleanLine) {
          lines.push(cleanLine);
        }
      }
    }
    lines.push('');
  }
  
  return lines.join('\n').trim();
}

// ============= Main Handler =============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let requestId = 'unknown';
  let finishReason = 'unknown';
  let hadToolCalls = false;

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

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Use getUser with the token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const body: BenchmarkResumeRequest = await req.json();
    const { 
      resumeText, 
      jobDescription, 
      fitBlueprint, 
      confirmedFacts,
      missingBulletResponses, // Legacy
      customization,
      executive50PlusPrefs,
      resumeMode = 'interview-safe'
    } = body;
    
    if (!resumeText || !jobDescription || !fitBlueprint) {
      throw new Error('Resume text, job description, and fit blueprint are required');
    }

    console.log('Generating benchmark resume with mode:', resumeMode);
    console.log('Confirmed facts count:', Object.keys(confirmedFacts || {}).length);

    // ============= Build System Prompt =============
    const systemPrompt = `You are an elite resume writer producing "Benchmark Resumes" — the resumes hiring teams measure other candidates against. Your writing is crisp, metrics-forward, and structurally aligned to the role's success criteria.

CRITICAL PRINCIPLES:
1. EVIDENCE-FIRST: Every claim must map to evidence IDs (E1, E2) or user-confirmed facts
2. NO FABRICATION: Never invent metrics, tools, titles, scope, or ownership
3. INTERVIEW-SAFE: Everything you write must be defensible in an interview
4. RUBRIC-ALIGNED: Structure resume to highlight competencies in the role success rubric

${buildModeInstructions(resumeMode)}

VERIFICATION RULES:
- Verified bullets use evidence tags: [E1, E3] or confirmed fact references
- If a requirement has a gap, you may:
  a) De-emphasize it (don't highlight)
  b) Reframe adjacent experience truthfully
  c) Include in "Exposure" line (if truly minimal exposure exists)
  d) NEVER claim ownership you don't have evidence for

STRUCTURE FOR BENCHMARK RESUME:

1. HEADER & BRANDING
   - Use target title from JD (or truthful equivalent)
   - Add 1-line branding statement aligned to role outcomes

2. SIGNATURE WINS (Optional - for senior roles)
   - 3-5 executive-level outcomes
   - Only if evidence strongly supports

3. PROFESSIONAL SUMMARY (5-7 lines)
   - Scope (years, domains)
   - Lifecycle ownership
   - Leadership dimension
   - 1-2 concrete proof points with evidence

4. CORE COMPETENCIES (12-16 items)
   - Aligned to JD keywords
   - Only include what's evidenced

5. PROFESSIONAL EXPERIENCE
   - 1-line role framing per position
   - 5-8 bullets per role, ordered by: outcomes → leadership → systems → tools
   - Each bullet ends with [E#, R#] traceability tags

6. TOOLS & PLATFORMS
   - Only list evidenced tools
   - Use "Workflow platforms (multiple)" for gaps with equivalents

7. EDUCATION & CERTIFICATIONS
   - Follow 50+ rules if specified

${buildExecutive50PlusInstructions(executive50PlusPrefs)}

IMPORTANT: Use the tool call ONLY to return your response. Do NOT include any text outside the tool call.`;

    // ============= Build User Prompt (streamlined) =============
    const confirmedFactsBlock = formatConfirmedFacts(confirmedFacts || {});
    const legacyResponses = missingBulletResponses || {};
    const legacyResponsesBlock = Object.keys(legacyResponses).length > 0 
      ? `LEGACY USER RESPONSES:\n${Object.entries(legacyResponses).map(([id, resp]) => `- ${id}: ${resp}`).join('\n')}`
      : '';

    // Extract rubric and pattern if available
    const rubricContext = fitBlueprint.roleSuccessRubric 
      ? `\nROLE SUCCESS RUBRIC:\n${JSON.stringify(fitBlueprint.roleSuccessRubric, null, 2)}`
      : '';
    
    const patternContext = fitBlueprint.benchmarkResumePattern
      ? `\nBENCHMARK PATTERN TO FOLLOW:\n${JSON.stringify(fitBlueprint.benchmarkResumePattern, null, 2)}`
      : '';

    // Use verified bullet bank if available
    const verifiedBullets = fitBlueprint.bulletBankVerified 
      ? `\nVERIFIED BULLETS (use these directly):\n${JSON.stringify(fitBlueprint.bulletBankVerified, null, 2)}`
      : fitBlueprint.bulletBank 
        ? `\nBULLET BANK:\n${JSON.stringify(fitBlueprint.bulletBank, null, 2)}`
        : '';

    const userPrompt = `Generate a Benchmark Resume for this candidate-job match.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

FIT ANALYSIS:
- Overall Fit Score: ${fitBlueprint.overallFitScore || 'N/A'}
- Evidence Units: ${fitBlueprint.evidenceInventory?.length || 0}
- Requirements Analyzed: ${fitBlueprint.requirements?.length || 0}
${rubricContext}
${patternContext}

EVIDENCE INVENTORY:
${JSON.stringify(fitBlueprint.evidenceInventory || [], null, 2)}

FIT MAP (requirement -> qualification status):
${JSON.stringify(fitBlueprint.fitMap || [], null, 2)}
${verifiedBullets}

${confirmedFactsBlock}
${legacyResponsesBlock}

CUSTOMIZATION:
- Intensity: ${customization?.intensity || 'moderate'} (${customization?.intensity === 'conservative' ? 'very cautious claims' : customization?.intensity === 'aggressive' ? 'bolder framing within evidence' : 'balanced approach'})
- Tone: ${customization?.tone || 'formal'}

EXECUTIVE SUMMARY GUIDANCE:
${JSON.stringify(fitBlueprint.executiveSummary || {}, null, 2)}

ATS KEYWORDS TO INCLUDE:
${JSON.stringify(fitBlueprint.atsAlignment?.topKeywords || [], null, 2)}

Call the benchmark_resume_result tool with the structured output. Do NOT output any text outside the tool call.`;

    console.log('Calling Lovable AI (OpenAI GPT-5) for Benchmark Resume generation...');

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM, // Now uses openai/gpt-5
        max_tokens: 8000,
        // OpenAI JSON mode for more reliable structured output
        response_format: { type: 'json_object' },
        // Tool calling for structured output
        tools: [
          {
            type: 'function',
            function: {
              name: 'benchmark_resume_result',
              description: 'Return the generated benchmark resume in structured format. Do NOT include resume_text - it will be computed server-side from sections.',
              parameters: {
                type: 'object',
                properties: {
                  sections: {
                    type: 'array',
                    description: 'Resume sections in order',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'Unique section ID like header, summary, experience-1' },
                        type: { type: 'string', description: 'Section type: header, summary, achievements, competencies, experience, skills, education' },
                        title: { type: 'string', description: 'Display title for the section' },
                        content: { type: 'array', items: { type: 'string' }, description: 'Lines of content for this section' },
                        evidence_tags: { type: 'object', description: 'Map of content index to evidence IDs used' }
                      },
                      required: ['id', 'type', 'title', 'content']
                    }
                  },
                  changelog: {
                    type: 'array',
                    description: 'List of changes made from original resume',
                    items: {
                      type: 'object',
                      properties: {
                        section: { type: 'string' },
                        change: { type: 'string' },
                        reason: { type: 'string' },
                        evidence_used: { type: 'array', items: { type: 'string' } },
                        requirement_ids: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  verification_report: {
                    type: 'object',
                    properties: {
                      total_claims: { type: 'number' },
                      verified_claims: { type: 'number' },
                      inferred_claims: { type: 'number' },
                      unverifiable_omitted: { type: 'number' }
                    }
                  },
                  follow_up_questions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Optional questions to further improve the resume'
                  }
                },
                required: ['sections']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'benchmark_resume_result' } },
        temperature: 0.5
      },
      'benchmark-resume',
      user.id,
      120000 // 120 second timeout for complex generation
    );

    // Capture diagnostics
    requestId = response.id || metrics.request_id || 'unknown';
    finishReason = response.choices?.[0]?.finish_reason || 'unknown';
    hadToolCalls = !!(response.choices?.[0]?.message?.tool_calls?.length);

    console.log('AI response received:', {
      requestId,
      finishReason,
      hadToolCalls,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens
    });

    // Parse with robust extraction
    const parseResult = extractToolCallJSON(response, 'benchmark_resume_result', BenchmarkResumeOutputSchema);

    if (!parseResult.success || !parseResult.data) {
      console.error('Failed to parse benchmark resume result:', parseResult.error);
      console.error('Response had tool_calls:', hadToolCalls);
      console.error('Finish reason:', finishReason);
      
      return new Response(JSON.stringify({
        error: 'Failed to parse AI response. Please try again.',
        _meta: {
          request_id: requestId,
          finish_reason: finishReason,
          had_tool_calls: hadToolCalls,
          parse_error: parseResult.error,
          executionTimeMs: Date.now() - startTime
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawResume = parseResult.data;
    
    // Build resume_text server-side from sections
    const computedResumeText = buildResumeTextFromSections(rawResume.sections || []);
    
    // Transform to camelCase for frontend
    const benchmarkResume = {
      resumeText: computedResumeText,
      sections: (rawResume.sections || []).map((s: any) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        content: s.content || [],
        evidenceTags: s.evidence_tags || {},
        isEdited: false
      })),
      changelog: (rawResume.changelog || []).map((c: any) => ({
        section: c.section || 'General',
        change: c.change,
        rationale: c.reason || c.rationale || '',
        evidenceUsed: c.evidence_used || [],
        requirementIds: c.requirement_ids || []
      })),
      verificationReport: rawResume.verification_report || null,
      followUpQuestions: rawResume.follow_up_questions || [],
      _meta: {
        generatedAt: new Date().toISOString(),
        mode: resumeMode,
        confirmedFactsUsed: Object.keys(confirmedFacts || {}).length,
        executionTimeMs: Date.now() - startTime,
        model: LOVABLE_AI_MODELS.PREMIUM,
        request_id: requestId,
        finish_reason: finishReason,
        had_tool_calls: hadToolCalls
      }
    };

    console.log('Benchmark Resume generated successfully:', {
      sectionsCount: benchmarkResume.sections.length,
      changelogCount: benchmarkResume.changelog.length,
      mode: resumeMode,
      executionTimeMs: benchmarkResume._meta.executionTimeMs,
      requestId
    });

    return new Response(JSON.stringify(benchmarkResume), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const executionTimeMs = Date.now() - startTime;
    console.error('Benchmark resume generation error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check for specific error types
    if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        _meta: { request_id: requestId, executionTimeMs }
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (errorMessage.includes('credits') || errorMessage.includes('402')) {
      return new Response(JSON.stringify({
        error: 'AI credits depleted. Please add credits to continue.',
        _meta: { request_id: requestId, executionTimeMs }
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      _meta: {
        request_id: requestId,
        finish_reason: finishReason,
        had_tool_calls: hadToolCalls,
        executionTimeMs
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// =====================================================
// RESUME BUILDER V3 - ORCHESTRATOR EDGE FUNCTION
// =====================================================
// Single entry point with 4 sequential tool calls:
// 1. Fit Analysis - Why is this candidate a great fit + gaps
// 2. Standards Comparison - Compare against industry benchmarks
// 3. Interview Questions - Generate targeted questions for gaps
// 4. Generate Resume - Put it all together with interview answers
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  FIT_ANALYSIS_SCHEMA,
  STANDARDS_SCHEMA,
  QUESTIONS_SCHEMA,
  RESUME_SCHEMA,
} from "../_shared/resume-v3-schemas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Models configuration
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODELS = {
  FAST: "google/gemini-2.5-flash-lite",
  DEFAULT: "google/gemini-2.5-flash",
};

type Step = "fit_analysis" | "standards" | "questions" | "generate_resume";

interface RequestBody {
  step: Step;
  resumeText: string;
  jobDescription: string;
  // For step 4, include previous results and interview answers
  fitAnalysis?: any;
  standards?: any;
  questions?: any;
  interviewAnswers?: Record<string, string>;
}

// Fetch timeout wrapper
const FETCH_TIMEOUT_MS = 90000; // 90 seconds

async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000} seconds`);
    }
    throw error;
  }
}

async function callAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: any,
  functionName: string
): Promise<any> {
  if (DEBUG) console.log(`🤖 Calling AI for ${functionName} with model ${model}`);
  const startTime = Date.now();

  const response = await fetchWithTimeout(LOVABLE_AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: schema.name,
            description: schema.description,
            parameters: schema.schema,
          },
        },
      ],
      tool_choice: { type: "function", function: { name: schema.name } },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ AI call failed for ${functionName}:`, response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add credits to continue.");
    }
    throw new Error(`AI call failed: ${response.status}`);
  }

  const data = await response.json();
  const duration = Date.now() - startTime;
  
  // Telemetry logging
  console.log(`📊 Telemetry: ${JSON.stringify({
    function: functionName,
    model,
    duration_ms: duration,
    success: true,
    tokens: data.usage || null,
  })}`);
  
  if (DEBUG) console.log(`✅ ${functionName} completed in ${duration}ms`);

  // Extract tool call result
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    console.error("❌ No tool call in response:", JSON.stringify(data, null, 2));
    throw new Error(
      "The AI service returned an unexpected format. This usually resolves on retry. " +
      "If the issue persists, try simplifying your resume text."
    );
  }

  try {
    const result = JSON.parse(toolCall.function.arguments);
    return result;
  } catch (e) {
    console.error("❌ Failed to parse tool call arguments:", toolCall.function.arguments);
    throw new Error("Failed to parse AI response");
  }
}

// =====================================================
// STEP 1: Fit Analysis
// =====================================================
async function runFitAnalysis(apiKey: string, resumeText: string, jobDescription: string) {
  const systemPrompt = `You are an expert resume analyst and career coach. Your job is to analyze how well a candidate's resume matches a job description.

Focus on:
1. Identifying specific strengths with evidence from the resume
2. Finding gaps between requirements and experience
3. Extracting ATS keywords that are present and missing

Be specific and actionable. Use exact quotes from the resume as evidence.`;

  const userPrompt = `Analyze this resume against the job description.

## RESUME:
${resumeText}

## JOB DESCRIPTION:
${jobDescription}

Provide a comprehensive fit analysis including:
- Overall fit score (0-100)
- Executive summary of why they're a great fit
- Specific strengths with evidence
- Gaps with severity and suggestions
- Keywords found and missing`;

  return callAI(apiKey, MODELS.FAST, systemPrompt, userPrompt, FIT_ANALYSIS_SCHEMA, "fit_analysis");
}

// =====================================================
// STEP 2: Standards Comparison
// =====================================================
async function runStandardsComparison(apiKey: string, resumeText: string, jobDescription: string, fitAnalysis: any) {
  const systemPrompt = `You are an expert in industry standards and professional benchmarks. Your job is to compare a candidate against what is expected at their level in their profession and industry.

Consider:
1. Industry-specific expectations
2. Role seniority expectations
3. Common achievements and metrics at this level
4. Professional certifications and skills standards`;

  const userPrompt = `Compare this candidate against industry and profession standards.

## RESUME:
${resumeText}

## JOB DESCRIPTION:
${jobDescription}

## FIT ANALYSIS SUMMARY:
Fit Score: ${fitAnalysis.fit_score}
Key Strengths: ${fitAnalysis.strengths.map((s: any) => s.requirement).join(", ")}
Key Gaps: ${fitAnalysis.gaps.map((g: any) => g.requirement).join(", ")}

Identify:
1. The industry and profession
2. The seniority level
3. How the candidate compares to benchmarks
4. Industry keywords and power phrases to use
5. What metrics would strengthen the resume`;

  return callAI(apiKey, MODELS.FAST, systemPrompt, userPrompt, STANDARDS_SCHEMA, "standards_comparison");
}

// =====================================================
// STEP 3: Interview Questions
// =====================================================
async function runInterviewQuestions(apiKey: string, resumeText: string, jobDescription: string, fitAnalysis: any, standards: any) {
  const systemPrompt = `You are an expert career coach conducting a brief interview to gather information that will strengthen a resume. 

Your questions should:
1. Address specific gaps identified in the analysis
2. Uncover hidden achievements and metrics
3. Help quantify accomplishments
4. Be conversational and easy to answer
5. Focus on information that will directly improve the resume

Generate 3-7 targeted questions prioritized by impact.

IMPORTANT: Each question MUST have a unique, deterministic ID. Use the format: q_[category]_[number]
- For gap-related questions: q_gap_1, q_gap_2, etc.
- For benchmark questions: q_bench_1, q_bench_2, etc.  
- For metrics questions: q_metric_1, q_metric_2, etc.
- For keyword questions: q_keyword_1, q_keyword_2, etc.
Never generate random or UUID-style IDs.`;

  const userPrompt = `Generate interview questions to fill resume gaps and enhance strengths.

## GAPS TO ADDRESS:
${fitAnalysis.gaps.map((g: any) => `- ${g.requirement} (${g.severity}): ${g.suggestion}`).join("\n")}

## BENCHMARKS BELOW STANDARD:
${standards.benchmarks
  .filter((b: any) => b.candidate_status === "below")
  .map((b: any) => `- ${b.benchmark}: ${b.recommendation || "Needs improvement"}`)
  .join("\n")}

## METRICS SUGGESTIONS:
${standards.metrics_suggestions.join(", ")}

## MISSING KEYWORDS:
${fitAnalysis.keywords_missing.join(", ")}

Generate targeted questions that will help gather specific information to:
1. Fill the identified gaps
2. Meet industry benchmarks
3. Add quantifiable achievements
4. Include missing keywords naturally

Prioritize questions by their potential impact on the resume.`;

  return callAI(apiKey, MODELS.FAST, systemPrompt, userPrompt, QUESTIONS_SCHEMA, "interview_questions");
}

// =====================================================
// STEP 4: Generate Optimized Resume
// =====================================================
async function runGenerateResume(
  apiKey: string,
  resumeText: string,
  jobDescription: string,
  fitAnalysis: any,
  standards: any,
  interviewAnswers: Record<string, string>
) {
  const systemPrompt = `You are an expert resume writer who creates ATS-optimized, compelling resumes. 

Your resume should:
1. Lead with strengths identified in the fit analysis
2. Address gaps using interview answers provided
3. Include industry keywords and power phrases
4. Use quantifiable achievements with metrics
5. Follow best practices for the profession and seniority level
6. Be optimized for ATS scanning

Write compelling, action-oriented bullet points that showcase impact.`;

  const answersText = Object.entries(interviewAnswers)
    .map(([questionId, answer]) => `Q: ${questionId}\nA: ${answer}`)
    .join("\n\n");

  const userPrompt = `Create an optimized resume using all gathered information.

## ORIGINAL RESUME:
${resumeText}

## JOB DESCRIPTION:
${jobDescription}

## FIT ANALYSIS:
- Fit Score: ${fitAnalysis.fit_score}
- Strengths to emphasize: ${fitAnalysis.strengths.map((s: any) => s.requirement).join(", ")}
- Gaps to address: ${fitAnalysis.gaps.map((g: any) => g.requirement).join(", ")}
- Keywords to include: ${[...fitAnalysis.keywords_found, ...fitAnalysis.keywords_missing].join(", ")}

## INDUSTRY STANDARDS:
- Industry: ${standards.industry}
- Profession: ${standards.profession}
- Level: ${standards.seniority_level}
- Power phrases: ${standards.power_phrases.join(", ")}
- Industry keywords: ${standards.industry_keywords.join(", ")}

## INTERVIEW ANSWERS (use to fill gaps and add specifics):
${answersText || "No additional information provided"}

Generate a complete, optimized resume that:
1. Incorporates all interview answers naturally
2. Addresses every gap with either evidence or improvement
3. Uses the identified keywords and power phrases
4. Matches industry standards for this level
5. Maximizes ATS compatibility`;

  return callAI(apiKey, MODELS.DEFAULT, systemPrompt, userPrompt, RESUME_SCHEMA, "generate_resume");
}

// =====================================================
// MAIN HANDLER
// =====================================================
// Input validation constants
const MAX_RESUME_LENGTH = 25000;
const MAX_JOB_LENGTH = 20000;
const VALID_STEPS: Step[] = ["fit_analysis", "standards", "questions", "generate_resume"];
// DEBUG mode - set DEBUG=true in environment to enable verbose logging
const DEBUG = Deno.env.get("DEBUG") === "true";

// Content validation (NOT XSS sanitization - that's done on the display layer)
// This ensures no script tags or event handlers are in the AI output
function validateAndCleanOutput(obj: unknown): unknown {
  if (typeof obj === 'string') {
    // Remove any script tags and event handlers that somehow got through
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }
  if (Array.isArray(obj)) {
    return obj.map(validateAndCleanOutput);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = validateAndCleanOutput(value);
    }
    return cleaned;
  }
  return obj;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const body: RequestBody = await req.json();
    const { step, resumeText, jobDescription, fitAnalysis, standards, questions, interviewAnswers } = body;

    // Input validation
    if (!step || typeof step !== "string" || !VALID_STEPS.includes(step)) {
      throw new Error(`Invalid step. Must be one of: ${VALID_STEPS.join(", ")}`);
    }
    
    if (!resumeText || typeof resumeText !== "string") {
      throw new Error("Resume text is required");
    }
    
    if (resumeText.length > MAX_RESUME_LENGTH) {
      throw new Error(`Resume text exceeds maximum length of ${MAX_RESUME_LENGTH} characters`);
    }
    
    if (!jobDescription || typeof jobDescription !== "string") {
      throw new Error("Job description is required");
    }
    
    if (jobDescription.length > MAX_JOB_LENGTH) {
      throw new Error(`Job description exceeds maximum length of ${MAX_JOB_LENGTH} characters`);
    }

    if (DEBUG) console.log(`📋 Resume Builder V3 - Step: ${step}`);

    let result;
    switch (step) {
      case "fit_analysis":
        result = await runFitAnalysis(apiKey, resumeText, jobDescription);
        break;

      case "standards":
        if (!fitAnalysis) {
          throw new Error("Fit analysis required for standards comparison");
        }
        result = await runStandardsComparison(apiKey, resumeText, jobDescription, fitAnalysis);
        break;

      case "questions":
        if (!fitAnalysis || !standards) {
          throw new Error("Fit analysis and standards required for questions");
        }
        // Validate previous step data structure
        if (!Array.isArray(fitAnalysis.gaps) || !Array.isArray(standards.benchmarks)) {
          throw new Error("Invalid previous step data structure: gaps and benchmarks must be arrays");
        }
        result = await runInterviewQuestions(apiKey, resumeText, jobDescription, fitAnalysis, standards);
        break;

      case "generate_resume":
        if (!fitAnalysis || !standards) {
          throw new Error("Previous analysis required for resume generation");
        }
        // Validate and sanitize interview answer keys
        const sanitizedAnswers: Record<string, string> = {};
        if (interviewAnswers && typeof interviewAnswers === 'object') {
          for (const [key, value] of Object.entries(interviewAnswers)) {
            // Validate key format and length
            if (typeof key === 'string' && key.length < 100 && typeof value === 'string') {
              // Limit answer length to prevent abuse
              sanitizedAnswers[key] = value.substring(0, 5000);
            }
          }
        }
        result = await runGenerateResume(
          apiKey,
          resumeText,
          jobDescription,
          fitAnalysis,
          standards,
          sanitizedAnswers
        );
        break;

      default:
        throw new Error(`Unknown step: ${step}`);
    }

    // Validate and clean AI output (removes script tags, not HTML entity encoding)
    const cleanedResult = validateAndCleanOutput(result);

    return new Response(JSON.stringify({ success: true, data: cleanedResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Resume Builder V3 error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

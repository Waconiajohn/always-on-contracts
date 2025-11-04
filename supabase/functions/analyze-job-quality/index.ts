import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobAnalysisRequest {
  jobTitle: string;
  jobDescription: string;
  company?: string;
  location?: string;
  source?: string;
}

interface JobAnalysisResult {
  isContractPosition: boolean;
  contractConfidenceScore: number; // 0-100
  extractedRateMin?: number;
  extractedRateMax?: number;
  extractedDurationMonths?: number;
  qualityScore: number; // 0-100
  qualityScoreDetails: {
    hasDetailedDescription: boolean;
    hasRateInfo: boolean;
    hasDurationInfo: boolean;
    hasRequirements: boolean;
    descriptionLength: number;
    postingRecency: string;
  };
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { jobTitle, jobDescription, company, location, source }: JobAnalysisRequest = await req.json();

    console.log(`Analyzing job: ${jobTitle} from ${company || 'Unknown'}`);

    const prompt = `ROLE: You are a senior recruitment analyst with 15+ years evaluating job postings for quality, authenticity, and contract classification. You've analyzed 100K+ job descriptions across industries.

JOB POSTING DATA:
Title: ${jobTitle}
Company: ${company || "Not disclosed"}
Location: ${location || "Not specified"}
Source: ${source || "Unknown"}

FULL DESCRIPTION:
${jobDescription}

ANALYSIS TASKS:

1. CONTRACT CLASSIFICATION (Critical)
DETECTION RULES:
- Explicit keywords: contract, temporary, freelance, consultant, project-based, fixed-term, W2, 1099, interim, short-term, seasonal
- Duration mentions: "6 month", "12 month", "project duration", "through [date]"
- Implicit signals: "project completion", "maternity cover", "immediate start", agency posting
- Company type: Staffing agencies often indicate contract work
- Job type field: "contract", "temporary", "seasonal"

CONFIDENCE SCORING:
- 90-100%: Multiple explicit indicators
- 70-89%: One explicit indicator + contextual signals
- 50-69%: Strong contextual signals but no explicit mention
- 30-49%: Weak signals, unclear
- 0-29%: Strong permanent indicators

2. QUALITY SCORING (0-100) - DETAILED RUBRIC:

DESCRIPTION QUALITY (30 points):
- Role clarity: Specific responsibilities vs. vague duties (0-10)
- Impact/outcomes defined: Measurable goals stated (0-10)
- Day-to-day detail: Typical activities described (0-5)
- Team/context: Reporting structure, team info (0-5)

COMPENSATION TRANSPARENCY (25 points):
- Salary disclosed: Exact range (25) | General range (15) | "Competitive" (5) | None (0)

ROLE CLARITY (20 points):
- Required skills: Specific and prioritized (0-10)
- Experience level: Years clearly stated (0-5)
- Success criteria: How performance measured (0-5)

POSTING QUALITY (15 points):
- Professional formatting and grammar (0-5)
- Company information: About us, culture (0-5)
- Application process clarity (0-5)

RED FLAG DEDUCTIONS (-5 each, max -30):
- Excessive requirements (10+ years + 5 technologies)
- Vague responsibilities ("wearing many hats")
- Unprofessional language or excessive urgency
- No company information / anonymous posting
- "Rockstar/ninja/guru" language
- Salary listed as "$0" or obviously wrong

3. DETAILED EXTRACTION:
- Duration: Extract any time period mentioned (convert to months)
- Experience: Parse "X years" or "X+ years experience"  
- Skills: Extract technical skills, certifications, tools (max 10 most important)
- Work arrangement: Determine from keywords (remote, hybrid, onsite, flexible)

4. REASONING (Required):
CONTRACT DETERMINATION: Explain your classification with evidence quotes
QUALITY ASSESSMENT: List top 3 quality drivers and top 3 concerns

OUTPUT FORMAT (Strict JSON matching schema):
{
  "isContractPosition": boolean,
  "contractConfidenceScore": number (0-100),
  "extractedRateMin": number or null,
  "extractedRateMax": number or null,
  "extractedDurationMonths": number or null,
  "qualityScore": number (0-100),
  "qualityScoreDetails": {
    "hasDetailedDescription": boolean,
    "hasRateInfo": boolean,
    "hasDurationInfo": boolean,
    "hasRequirements": boolean,
    "descriptionLength": number (word count),
    "postingRecency": "recent" | "moderate" | "old" | "unknown"
  },
  "reasoning": "detailed explanation with evidence"
}`;

    const model = selectOptimalModel({
      taskType: 'analysis',
      complexity: 'medium',
      estimatedInputTokens: jobDescription.length / 4,
      estimatedOutputTokens: 600,
      requiresReasoning: true,
      requiresLatestData: false
    });

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a senior recruitment analyst with expertise in job posting evaluation and contract classification. Provide detailed, evidence-based analysis. Return ONLY valid JSON with no markdown formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model,
        temperature: 0.3,
        max_tokens: 1500,
        return_citations: false,
      },
      'analyze-job-quality',
      user.id
    );

    await logAIUsage(metrics);

    const analysisText = cleanCitations(response.choices[0].message.content);

    console.log('AI Response:', analysisText);

    // Extract JSON from the response
    let analysis: JobAnalysisResult;
    try {
      // Try to parse directly first
      analysis = JSON.parse(analysisText);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = analysisText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find JSON object in the text
        const objectMatch = analysisText.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          analysis = JSON.parse(objectMatch[0]);
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      }
    }

    console.log('Parsed analysis:', analysis);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-job-quality:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

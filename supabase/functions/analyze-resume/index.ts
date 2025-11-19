import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const logger = createLogger('analyze-resume');

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const { resumeText, userId } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials not configured");
    if (!userId) throw new Error("User ID is required");

    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Starting resume analysis', { userId });

    const systemPrompt = `You are an elite resume analysis AI specializing in executive career positioning and contract/freelance work optimization. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "years_experience": number,
  "key_achievements": string[],
  "industry_expertise": string[],
  "management_capabilities": string[],
  "skills": string[],
  "target_hourly_rate_min": number,
  "target_hourly_rate_max": number,
  "recommended_positions": string[],
  "analysis_summary": string,
  "work_history": [
    {
      "job_title": string,
      "company_name": string,
      "start_date": string,
      "end_date": string,
      "is_current": boolean,
      "industry": string,
      "key_responsibilities": string[],
      "achievements": string[],
      "technologies_used": string[],
      "team_size": number,
      "budget_managed": string
    }
  ]
}`;

    const userPrompt = `Analyze this resume with elite-level extraction.

RESUME TEXT:
${resumeText}

EXTRACTION RULES:
1. DATES: Extract ALL employment dates in YYYY-MM format. If year-only, use YYYY-01. Mark ongoing roles as "Present".
2. ACHIEVEMENTS: Quantify everything. Extract numbers, percentages, dollar amounts, team sizes, timelines.
3. CONTRACT IDENTIFICATION: Flag any indicators of contract/freelance work (keywords: contractor, consultant, freelance, project-based, temporary, contract, 1099, W2).
4. WORK HISTORY: Identify gaps >3 months. Calculate total experience excluding gaps.
5. RATES: If hourly/daily rates mentioned, extract and convert to annual equivalent.
6. SKILLS: Separate technical skills, soft skills, and certifications/tools.
7. INDUSTRY SIGNALS: Identify primary and secondary industries from company names, role titles, and project descriptions.

MANDATORY EXTRACTION:
- Extract detailed work history for last 10-15 years minimum
- For each position: exact dates, company, title, responsibilities, achievements with metrics
- Calculate years_experience accurately from employment dates
- Identify contractor vs employee status from job type keywords
- Extract or estimate hourly rates based on role level and industry

ERROR HANDLING:
- If data is ambiguous, provide best estimate based on context
- Never leave required fields empty - use reasonable defaults
- Flag any data quality concerns

Focus on positioning experience as premium value for executive and strategic opportunities.`;

    const { response, metrics } = await retryWithBackoff(
      async () => {
        const aiStartTime = Date.now();
        const result = await callLovableAI(
          {
            model: LOVABLE_AI_MODELS.DEFAULT,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' }
          },
          'analyze-resume',
          userId
        );

        logger.logAICall({
          model: result.metrics.model,
          inputTokens: result.metrics.input_tokens,
          outputTokens: result.metrics.output_tokens,
          latencyMs: Date.now() - aiStartTime,
          cost: result.metrics.cost_usd,
          success: true
        });

        return result;
      },
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('[analyze-resume] Raw AI response:', rawContent.substring(0, 500));

    const extractResult = extractJSON(rawContent);
    
    if (!extractResult.success || !extractResult.data) {
      console.error('[analyze-resume] JSON parse failed:', extractResult.error);
      console.error('[analyze-resume] Full response:', rawContent);
      logger.error('Failed to extract analysis JSON', { 
        error: extractResult.error,
        content: rawContent.substring(0, 500)
      });
      throw new Error(`Failed to parse AI response: ${extractResult.error}`);
    }

    const analysis = extractResult.data;

    // Validate required fields
    if (typeof analysis.years_experience !== 'number' ||
        !Array.isArray(analysis.key_achievements) ||
        !Array.isArray(analysis.work_history)) {
      console.error('[analyze-resume] Missing required fields:', analysis);
      throw new Error('AI response missing required fields');
    }

    console.log('[analyze-resume] Analysis complete:', {
      yearsExp: analysis.years_experience,
      achievements: analysis.key_achievements.length,
      workHistory: analysis.work_history.length
    });

    // Extract work_history separately and exclude from database insert
    const { work_history, ...analysisForDb } = analysis;

    // Process data types for database insertion
    const processedAnalysis = {
      ...analysisForDb,
      years_experience: analysisForDb.years_experience 
        ? Math.round(Number(analysisForDb.years_experience)) 
        : 0,
      target_hourly_rate_min: analysisForDb.target_hourly_rate_min 
        ? Number(analysisForDb.target_hourly_rate_min) 
        : null,
      target_hourly_rate_max: analysisForDb.target_hourly_rate_max 
        ? Number(analysisForDb.target_hourly_rate_max) 
        : null
    };

    // Store analysis in database (excluding work_history which is a nested array)
    const { error: insertError } = await supabase
      .from("resume_analysis")
      .insert({
        user_id: userId,
        resume_id: null,
        ...processedAnalysis
      });

    if (insertError) throw insertError;

    logger.info('Resume analysis completed', { 
      userId,
      latencyMs: Date.now() - startTime,
      yearsExperience: analysis.years_experience
    });

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const aiError = handlePerplexityError(error);
    logger.error('Resume analysis failed', error, {
      code: aiError.code,
      retryable: aiError.retryable
    });

    return new Response(
      JSON.stringify({ 
        error: aiError.userMessage,
        retryable: aiError.retryable
      }),
      {
        status: aiError.statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

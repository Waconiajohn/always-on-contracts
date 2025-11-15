import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { createLogger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeContent, jobDescription } = await req.json();

    if (!resumeContent || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume content and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an ATS (Applicant Tracking System) analyzer. Analyze the resume against the job description and provide detailed scoring.

Score the following categories on a scale of 0-100:
1. Keyword Match - How well keywords from the job description appear in the resume
2. Format Score - ATS-friendly formatting (no tables, images, proper headers)
3. Experience Match - How well experience aligns with requirements
4. Skills Match - How well listed skills match required skills

Also provide:
- Overall score (weighted average)
- Top 3-5 strengths
- Top 3-5 warnings/issues
- Top 3-5 actionable recommendations

Return ONLY valid JSON in this exact format:
{
  "overallScore": 85,
  "keywordMatch": 80,
  "formatScore": 95,
  "experienceMatch": 85,
  "skillsMatch": 90,
  "strengths": ["Strong keyword presence", "Clear quantified achievements"],
  "warnings": ["Missing specific technical tool X", "Limited leadership examples"],
  "recommendations": ["Add keyword Y 2-3 more times", "Quantify project Z impact"]
}`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nResume Content:\n${resumeContent}\n\nAnalyze and score this resume for ATS compatibility.`
          }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      },
      'analyze-ats-score'
    );

    await logAIUsage(metrics);

    const cleanedContent = response.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON from response with production-grade extraction
    const parseResult = extractJSON(cleanedContent);

    if (!parseResult.success || !parseResult.data) {
      const logger = createLogger('analyze-ats-score');
      logger.error('JSON parsing failed', {
        error: parseResult.error,
        content: cleanedContent.substring(0, 500)
      });
      throw new Error('Failed to parse JSON from AI response');
    }

    const scoreData = parseResult.data;

    // Validate and ensure all required fields exist
    const validatedData = {
      overallScore: Math.min(100, Math.max(0, scoreData.overallScore || 0)),
      keywordMatch: Math.min(100, Math.max(0, scoreData.keywordMatch || 0)),
      formatScore: Math.min(100, Math.max(0, scoreData.formatScore || 0)),
      experienceMatch: Math.min(100, Math.max(0, scoreData.experienceMatch || 0)),
      skillsMatch: Math.min(100, Math.max(0, scoreData.skillsMatch || 0)),
      strengths: Array.isArray(scoreData.strengths) ? scoreData.strengths : [],
      warnings: Array.isArray(scoreData.warnings) ? scoreData.warnings : [],
      recommendations: Array.isArray(scoreData.recommendations) ? scoreData.recommendations : [],
    };

    return new Response(
      JSON.stringify(validatedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-ats-score:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Analyze Resume Match Against Job Description
 * Provides detailed breakdown of how well resume matches JD
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeData, jobDescription } = await req.json();

    console.log('📊 Analyzing resume match');

    // Extract resume text
    const resumeText = resumeData.sections
      .map((section: any) => {
        const bullets = section.bullets.map((b: any) => b.userEditedText || b.text).join('\n');
        return `${section.title}\n${bullets}`;
      })
      .join('\n\n');

    const prompt = `You are an expert resume analyzer and ATS specialist. Analyze how well this resume matches the job description.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Provide a detailed analysis in this EXACT JSON format:

{
  "overallMatch": 85,
  "coveredRequirements": [
    "5+ years software engineering experience",
    "React and TypeScript expertise",
    "Team leadership experience"
  ],
  "uncoveredRequirements": [
    "AWS cloud architecture certification",
    "PhD or Masters degree"
  ],
  "strengthAreas": [
    "Technical Skills: Strong evidence of React, TypeScript, and modern frameworks",
    "Leadership: Clear examples of managing teams and mentoring",
    "Impact: Quantified achievements with metrics"
  ],
  "improvementAreas": [
    "Cloud Certifications: Consider highlighting any cloud training or projects",
    "Education: Emphasize relevant coursework or continuing education",
    "Industry Keywords: Add more domain-specific terminology"
  ]
}

CRITICAL RULES:
- overallMatch should be 0-100 (realistic, not inflated)
- List actual requirements from the JD in coveredRequirements
- List missing requirements in uncoveredRequirements
- strengthAreas should be specific and evidence-based
- improvementAreas should be actionable

Return ONLY the JSON, no markdown formatting.`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      max_tokens: 1500,
    }, 'analyze-resume-match', undefined);

    await logAIUsage(metrics);

    let rawContent = cleanCitations(response.choices?.[0]?.message?.content || '');
    rawContent = rawContent.replace(/^```json\n?/i, '').replace(/\n?```$/i, '').trim();

    let matchAnalysis;
    try {
      matchAnalysis = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', rawContent);
      throw new Error('AI returned invalid JSON format');
    }

    // Validate structure
    if (typeof matchAnalysis.overallMatch !== 'number') {
      throw new Error('Invalid match analysis structure');
    }

    console.log('✅ Match analysis complete:', matchAnalysis.overallMatch);

    return new Response(
      JSON.stringify({ success: true, matchAnalysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in analyze-resume-match:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

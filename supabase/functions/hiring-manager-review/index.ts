import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const { resumeContent, jobDescription, jobTitle, industry } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
    }

    // Build resume text from sections
    const resumeText = Array.isArray(resumeContent) 
      ? resumeContent.map((s: any) => `${s.title}:\n${s.content?.join('\n') || ''}`).join('\n\n')
      : resumeContent;

    const systemPrompt = `You are an experienced hiring manager performing a resume review. You have 10+ years of hiring experience.

Your task: Review this resume against the job description with honest, constructive feedback.

Return ONLY valid JSON with this exact structure:
{
  "would_interview": boolean,
  "overall_impression": "string - honest assessment",
  "confidence_level": "high" | "medium" | "low",
  "strengths": [
    { "point": "What's strong", "impact_level": "critical" | "important" | "nice_to_have" }
  ],
  "critical_gaps": [
    {
      "gap": "What's missing",
      "why_matters": "Why this matters",
      "recommendation": "How to fix",
      "severity": "deal_breaker" | "concerning" | "minor"
    }
  ],
  "improvement_suggestions": [
    { "section": "Which section", "suggested_improvement": "Better version", "priority": "high" | "medium" | "low" }
  ],
  "interview_questions": ["Question 1", "Question 2", "Question 3"]
}`;

    const userPrompt = `JOB TITLE: ${jobTitle || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

Perform your hiring manager review. Be thorough and provide actionable feedback.`;

    console.log('Calling Lovable AI for hiring manager review...');

    const { response } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      },
      'hiring-manager-review',
      user.id
    );

    const reviewText = response.choices?.[0]?.message?.content;
    if (!reviewText) {
      throw new Error('No review content returned');
    }

    const parseResult = extractJSON(reviewText);
    if (!parseResult.success || !parseResult.data) {
      console.error('Failed to parse review JSON:', reviewText);
      throw new Error('Failed to parse review data');
    }

    const reviewData = parseResult.data;

    return new Response(
      JSON.stringify({
        success: true,
        review: reviewData,
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
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

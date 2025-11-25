import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    // Build comprehensive system prompt for Perplexity
    const systemPrompt = `You are an experienced hiring manager performing a critical resume review. You have 10+ years of hiring experience and understand what truly makes candidates stand out.

Your task: Review this resume against the job description with brutal honesty - just like a real hiring manager would during their 6-second initial scan and deeper review.

Focus on:
1. Would you actually call this candidate for an interview? (Be honest)
2. What makes them stand out (or not)?
3. Critical gaps that would make you hesitate
4. Specific, actionable improvements with examples
5. Deal-breakers that would auto-reject

Use CURRENT market data and hiring trends to validate your feedback. Cite sources.

Return ONLY valid JSON with this exact structure:
{
  "would_interview": boolean,
  "overall_impression": "string - harsh but fair truth",
  "confidence_level": "high" | "medium" | "low",
  "strengths": [
    { 
      "point": "What's strong", 
      "hiring_manager_perspective": "Why it matters to me as a hiring manager",
      "impact_level": "critical" | "important" | "nice_to_have"
    }
  ],
  "critical_gaps": [
    {
      "gap": "What's missing",
      "why_matters": "Why this would make me hesitate (with market data citation)",
      "recommendation": "Specific fix with example",
      "severity": "deal_breaker" | "concerning" | "minor"
    }
  ],
  "improvement_suggestions": [
    {
      "section": "Which section",
      "current": "What they wrote",
      "suggested_improvement": "Better version",
      "rationale": "Why this is better for ATS and humans",
      "priority": "high" | "medium" | "low"
    }
  ],
  "market_intelligence": {
    "typical_requirements": ["What similar roles typically require"],
    "competitive_differentiators": ["What would make this resume stand out"],
    "red_flags_to_avoid": ["Common mistakes for this role"]
  },
  "citations": ["Source URLs that validate the feedback"]
}`;

    const userPrompt = `JOB TITLE: ${jobTitle || 'Not specified'}
INDUSTRY: ${industry || 'Not specified'}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S RESUME:
${resumeContent}

Perform your hiring manager review. Be thorough, be honest, and provide actionable feedback backed by current market data.`;

    console.log('Calling Perplexity for hiring manager review...');

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const reviewText = data.choices?.[0]?.message?.content;

    if (!reviewText) {
      throw new Error('No review content returned from Perplexity');
    }

    // Parse JSON from response
    const cleanedContent = reviewText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let reviewData;
    
    try {
      reviewData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse review JSON:', cleanedContent);
      throw new Error('Failed to parse review data');
    }

    // Extract citations if available
    const citations = data.citations || reviewData.citations || [];

    // Store review in database
    const { error: insertError } = await supabase
      .from('resume_reviews')
      .insert({
        user_id: user.id,
        review_type: 'hiring_manager',
        review_data: reviewData,
        score: reviewData.would_interview ? 85 : 45, // Simple scoring
        citations,
        reviewed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error storing review:', insertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        review: reviewData,
        citations,
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

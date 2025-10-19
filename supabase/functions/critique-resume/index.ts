import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (!resumeContent) {
      throw new Error('Resume content is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user context
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Unauthorized');
    }

    console.log('Critiquing resume for user:', user.id);

    // Build the prompt for AI critique
    const prompt = `You are an expert executive resume reviewer. Analyze this resume and provide detailed, actionable feedback.

Resume Content:
${resumeContent}

${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}

Provide a comprehensive critique with:

1. Overall Quality Score (0-100)
2. Specific Strengths (4-5 points)
3. Areas for Improvement (4-5 points)
4. Detailed Suggestions categorized as:
   - CRITICAL: Issues that will likely cause rejection
   - IMPORTANT: Improvements that significantly boost chances
   - OPTIONAL: Nice-to-have enhancements
   
For each suggestion include:
   - Category (critical/important/optional)
   - Type (content/formatting/keywords/impact)
   - Title (brief)
   - Description (what's wrong)
   - Suggestion (specific fix)
   - Location (where in resume)

5. Industry Insights (4 best practices specific to this role/industry)
6. ATS Compatibility Issues

Format as JSON with this structure:
{
  "overallScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "suggestions": [{
    "category": "critical" | "important" | "optional",
    "type": "content" | "formatting" | "keywords" | "impact",
    "title": string,
    "description": string,
    "suggestion": string,
    "location": string
  }],
  "industryInsights": string[],
  "atsCompatibility": {
    "score": number,
    "issues": string[]
  }
}`;

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert executive resume reviewer with 20+ years of experience in talent acquisition and career coaching. You provide detailed, actionable feedback to help executives land their dream roles.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const critiqueText = aiResponse.choices[0].message.content;
    const critique = JSON.parse(critiqueText);

    console.log('Resume critique generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        critique
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in critique-resume function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

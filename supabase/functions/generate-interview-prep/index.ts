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
    const { resumeContent, jobTitle, jobDescription } = await req.json();

    if (!resumeContent || !jobDescription) {
      throw new Error('Resume content and job description are required');
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

    console.log('Generating interview prep for user:', user.id);

    const prompt = `You are an expert executive career coach specializing in interview preparation. Generate a comprehensive set of interview questions based on:

RESUME CONTENT:
${resumeContent}

JOB DETAILS:
- Title: ${jobTitle || 'Not specified'}
- Description: ${jobDescription}

Generate 8-10 interview questions that:
1. Mix behavioral, technical, situational, and leadership questions
2. Are specifically tailored to the candidate's experience and the target role
3. Vary in difficulty (easy, medium, hard)
4. Cover key competencies mentioned in the job description

For each question, provide:
- category: behavioral | technical | situational | leadership
- difficulty: easy | medium | hard
- question: The actual interview question
- context: Why this question is being asked (1-2 sentences)
- tips: Array of 3-4 specific tips for answering this question effectively
- starFramework (optional, for behavioral/situational questions):
  - situation: Guidance on what situation details to include
  - task: What task/responsibility to clarify
  - action: What actions to emphasize
  - result: What results/metrics to highlight

CRITICAL REQUIREMENTS:
- Questions should reflect actual interview scenarios for this role level
- Mix expected questions with curveball questions
- Include questions that test both hard skills and soft skills
- Ensure questions allow candidate to showcase resume achievements
- Make questions specific to the industry and role

Return as JSON array with this structure:
[
  {
    "id": "1",
    "category": "leadership",
    "difficulty": "hard",
    "question": "...",
    "context": "...",
    "tips": ["...", "...", "..."],
    "starFramework": {
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "..."
    }
  }
]`;

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
            content: 'You are an expert executive interview coach with 20+ years of experience preparing senior leaders for high-stakes interviews. You understand what hiring committees look for and how to position candidates effectively.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const questionsText = aiResponse.choices[0].message.content;
    const parsedResponse = JSON.parse(questionsText);
    const questions = parsedResponse.questions || parsedResponse;

    console.log('Interview questions generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        questions,
        metadata: {
          questionCount: questions.length,
          generatedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-interview-prep function:', error);
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

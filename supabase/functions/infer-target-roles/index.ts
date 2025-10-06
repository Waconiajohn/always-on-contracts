import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeAnalysis {
  current_role?: string;
  years_of_experience?: number;
  seniority_level?: string;
  industry?: string;
  key_skills?: string[];
}

Deno.serve(async (req) => {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { resume_analysis } = await req.json();

    if (!resume_analysis) {
      throw new Error('resume_analysis is required');
    }

    const analysis: ResumeAnalysis = resume_analysis;

    // Use Lovable AI to suggest target roles
    const prompt = `Based on this career profile, suggest job titles the candidate should target:

Current Role: ${analysis.current_role || 'Not specified'}
Years of Experience: ${analysis.years_of_experience || 'Not specified'}
Seniority Level: ${analysis.seniority_level || 'Not specified'}
Industry: ${analysis.industry || 'Not specified'}
Key Skills: ${analysis.key_skills?.join(', ') || 'Not specified'}

Please suggest:
1. AT CURRENT LEVEL: 3-5 roles matching their current seniority
2. STRETCH ROLES: 2-3 roles one level above (promotions/growth)
3. SAFETY/PIVOT ROLES: 1-2 alternative roles (adjacent fields or one level below)

Return ONLY a JSON object in this exact format:
{
  "current_level": ["Role 1", "Role 2", "Role 3"],
  "stretch": ["Senior Role 1", "Senior Role 2"],
  "safety": ["Alternative Role 1"],
  "reasoning": "Brief explanation of suggestions"
}`;

    const aiResponse = await fetch('https://api.lovable.app/v1/ai/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to generate role suggestions');
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content || '{}';
    
    // Extract JSON from markdown code blocks if present
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const suggestions = JSON.parse(jsonContent);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in infer-target-roles:', error);
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

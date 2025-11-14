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
  industry_expertise?: string[];
  key_skills?: string[];
  analysis_summary?: string;
  key_achievements?: string[];
  recommended_positions?: string[];
  management_capabilities?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
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

    // Build industry context
    const industryContext = analysis.industry_expertise?.length 
      ? analysis.industry_expertise.join(', ')
      : analysis.industry || 'Not specified';

    // Build achievements context (first 3 for brevity)
    const achievementsContext = analysis.key_achievements?.slice(0, 3).join('\n• ') || 'Not specified';

    // Use Lovable AI with tool calling for structured output
    const systemPrompt = `You are an expert career advisor specializing in role targeting for experienced professionals. 
Your task is to suggest highly relevant, industry-specific job titles based on detailed career information.

CRITICAL RULES:
- Match seniority level accurately (Senior → Senior roles, not entry-level)
- Use industry-specific terminology and actual job titles
- Consider years of experience when suggesting roles
- Provide 5-7 highly relevant job titles
- Focus on roles that match the candidate's expertise and experience level`;

    const userPrompt = `Analyze this professional's career profile and suggest relevant target roles:

CURRENT POSITION:
Role: ${analysis.current_role || 'Not specified'}
Years of Experience: ${analysis.years_of_experience || 'Not specified'}
Seniority Level: ${analysis.seniority_level || 'Not specified'}

INDUSTRY EXPERTISE:
${industryContext}

CAREER SUMMARY:
${analysis.analysis_summary || 'Professional with demonstrated expertise in their field.'}

KEY SKILLS:
${analysis.key_skills?.join(', ') || 'Not specified'}

NOTABLE ACHIEVEMENTS:
${achievementsContext}

${analysis.recommended_positions?.length ? `PREVIOUSLY IDENTIFIED ROLES:\n${analysis.recommended_positions.join(', ')}` : ''}

${analysis.management_capabilities?.length ? `MANAGEMENT CAPABILITIES:\n${analysis.management_capabilities.join(', ')}` : ''}

Based on this ${analysis.seniority_level || 'experienced'} professional's background, suggest 5-7 appropriate target job titles.`;

    console.log('[infer-target-roles] Calling Lovable AI for role suggestions');
    
    const startTime = Date.now();
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'suggest_job_titles',
              description: 'Returns a list of relevant job titles for the candidate',
              parameters: {
                type: 'object',
                properties: {
                  job_titles: {
                    type: 'array',
                    description: 'Array of 5-7 relevant job titles matching the candidate\'s experience level and expertise',
                    items: {
                      type: 'string'
                    },
                    minItems: 5,
                    maxItems: 7
                  }
                },
                required: ['job_titles'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_job_titles' } }
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    console.log('[infer-target-roles] AI response received', { duration, model: aiData.model });

    // Extract tool call result
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(aiData));
      throw new Error('AI did not return structured role suggestions');
    }

    const result = JSON.parse(toolCall.function.arguments);
    const suggestions = result.job_titles;

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    console.log('[infer-target-roles] Generated suggestions:', suggestions);
    
    // Validate suggestions match experience level
    if (analysis.seniority_level?.toLowerCase().includes('senior') || 
        (analysis.years_of_experience && analysis.years_of_experience > 7)) {
      const hasJuniorRoles = suggestions.some((role: string) => 
        role.toLowerCase().includes('junior') || role.toLowerCase().includes('entry')
      );
      if (hasJuniorRoles) {
        console.warn('Warning: Junior roles suggested for senior candidate');
      }
    }

    // Log usage metrics
    const usage = aiData.usage || {};
    await supabase.from('ai_usage_metrics').insert({
      user_id: user.id,
      function_name: 'infer-target-roles',
      model: aiData.model || 'google/gemini-2.5-flash',
      provider: 'lovable-ai',
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      cost_usd: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000002),
      execution_time_ms: duration
    });

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

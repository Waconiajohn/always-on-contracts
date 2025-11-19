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
Your task is to suggest highly relevant, industry-specific job titles with rich metadata to power an intelligent job search system.

For each suggestion, you must provide:

1. **title**: The primary job title that recruiters commonly use (e.g., "Senior Data Analyst")

2. **confidence**: A 0-100 score indicating fit:
   - 90-100: Perfect match (seniority, skills, industry all align)
   - 75-89: Strong match (most factors align, minor gaps)
   - 60-74: Good match (transferable skills, potential stretch)
   - Below 60: Avoid suggesting

3. **synonyms**: 2-4 alternative titles recruiters might use:
   - Include variations (Senior/Lead/Principal)
   - Include industry-specific variants
   - Use actual job market terminology

4. **reasoning**: 1-2 sentences explaining why this fits:
   - Reference specific skills or experience
   - Mention seniority alignment
   - Note industry relevance

5. **suggestedBoolean**: Pre-built OR string for job board searches:
   - Format: ("Primary Title" OR "Synonym 1" OR "Synonym 2" OR "Synonym 3")
   - Use exact quote marks
   - Include all synonyms

6. **industryAlignment**: Rate as 'high', 'medium', or 'low':
   - high: Direct industry match
   - medium: Transferable skills across industries
   - low: Significant pivot required

CRITICAL RULES:
- Match seniority level accurately (Senior → Senior roles, not entry-level)
- Use industry-specific terminology and actual job titles from real job boards
- Consider years of experience when calculating confidence scores
- Provide 5-7 highly relevant job titles only
- Focus on roles that match the candidate's expertise and experience level
- Ensure boolean strings are properly formatted with quotes and OR operators`;

    const userPrompt = `Analyze this professional's career profile and suggest 5-7 target roles with confidence scores and metadata:

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

Based on this ${analysis.seniority_level || 'experienced'} professional's background, suggest 5-7 target job titles.

IMPORTANT: For each suggestion, calculate confidence based on:
- Seniority match: Does their level align with the role's typical requirements?
- Skills alignment: How many of their key skills match this role?
- Industry fit: Is this their current industry or a reasonable pivot?
- Experience level: Do they have the right years of experience for this role?`;

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
        tools:
          {
            type: 'function',
            function: {
              name: 'suggest_target_roles',
              description: 'Suggest highly relevant job titles with confidence scores and metadata for optimal job search targeting',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    description: 'Array of 5-7 job title recommendations with rich metadata',
                    items: {
                      type: 'object',
                      properties: {
                        title: {
                          type: 'string',
                          description: 'The primary job title (e.g., "Senior Data Analyst")'
                        },
                        confidence: {
                          type: 'number',
                          description: 'Confidence score 0-100 indicating how well this role fits the candidate. Consider seniority match, skills alignment, and industry relevance.',
                          minimum: 0,
                          maximum: 100
                        },
                        synonyms: {
                          type: 'array',
                          items: { type: 'string' },
                          description: '2-4 alternative job titles or variations that recruiters might use (e.g., ["Data Analytics Lead", "Lead Data Analyst", "Analytics Manager"])',
                          minItems: 2,
                          maxItems: 4
                        },
                        reasoning: {
                          type: 'string',
                          description: 'Brief 1-2 sentence explanation of why this role is a good fit, highlighting key matching factors'
                        },
                        suggestedBoolean: {
                          type: 'string',
                          description: 'Pre-built boolean search string with OR clauses combining the title and all synonyms. Format: ("Title" OR "Synonym1" OR "Synonym2")'
                        },
                        industryAlignment: {
                          type: 'string',
                          enum: ['high', 'medium', 'low'],
                          description: 'How well this role aligns with the candidate\'s industry experience. High = perfect match, Medium = transferable, Low = stretch role'
                        }
                      },
                      required: ['title', 'confidence', 'synonyms', 'reasoning', 'industryAlignment'],
                      additionalProperties: false
                    },
                    minItems: 5,
                    maxItems: 7
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_target_roles' } }
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
    const suggestions = result.suggestions;

    if (!suggestions || !Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Invalid suggestions format');
    }

    // Validate each suggestion has required fields
    for (const suggestion of suggestions) {
      if (!suggestion.title || typeof suggestion.confidence !== 'number' ||
          !Array.isArray(suggestion.synonyms) || !suggestion.reasoning ||
          !suggestion.industryAlignment) {
        console.error('Invalid suggestion format:', suggestion);
        throw new Error('Suggestion missing required fields');
      }
      
      // Auto-generate boolean if missing
      if (!suggestion.suggestedBoolean && suggestion.synonyms.length > 0) {
        const allTitles = [suggestion.title, ...suggestion.synonyms];
        suggestion.suggestedBoolean = `(${allTitles.map((t: string) => `"${t}"`).join(' OR ')})`;
      }
    }

    console.log('[infer-target-roles] Generated suggestions with metadata:', 
      suggestions.map((s: any) => ({ title: s.title, confidence: s.confidence }))
    );

    // Validate suggestions match experience level
    const avgConfidence = suggestions.reduce((sum: number, s: any) => sum + s.confidence, 0) / suggestions.length;

    if (avgConfidence < 60) {
      console.warn('[infer-target-roles] Low average confidence:', avgConfidence);
    }

    if (analysis.seniority_level?.toLowerCase().includes('senior') || 
        (analysis.years_of_experience && analysis.years_of_experience > 7)) {
      const hasJuniorRoles = suggestions.some((s: any) => 
        s.title.toLowerCase().includes('junior') || 
        s.title.toLowerCase().includes('entry') ||
        s.confidence < 50
      );
      if (hasJuniorRoles) {
        console.warn('[infer-target-roles] Warning: Low-confidence or junior roles suggested for senior candidate');
      }
    }

    // Ensure boolean strings are valid
    for (const suggestion of suggestions) {
      if (!suggestion.suggestedBoolean.includes('OR') || 
          !suggestion.suggestedBoolean.includes('"')) {
        console.warn('[infer-target-roles] Invalid boolean format:', suggestion.suggestedBoolean);
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
        metadata: {
          avgConfidence,
          seniorityLevel: analysis.seniority_level,
          suggestionsCount: suggestions.length,
          model: aiData.model || 'google/gemini-2.5-flash'
        }
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

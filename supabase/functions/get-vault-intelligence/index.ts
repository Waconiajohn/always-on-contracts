import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { jobDescription } = await req.json();

    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    console.log('Fetching vault data for user:', user.id);

    // Fetch all vault content
    const [powerPhrasesRes, skillsRes, competenciesRes, achievementsRes] = await Promise.all([
      supabaseClient
        .from('vault_power_phrases')
        .select('*')
        .eq('user_id', user.id),
      supabaseClient
        .from('vault_confirmed_skills')
        .select('*')
        .eq('user_id', user.id),
      supabaseClient
        .from('vault_hidden_competencies')
        .select('*')
        .eq('user_id', user.id),
      supabaseClient
        .from('vault_achievements')
        .select('*')
        .eq('user_id', user.id),
    ]);

    console.log('Vault data fetched:', {
      powerPhrases: powerPhrasesRes.data?.length || 0,
      skills: skillsRes.data?.length || 0,
      competencies: competenciesRes.data?.length || 0,
      achievements: achievementsRes.data?.length || 0,
    });

    // Use Lovable AI to analyze and match vault content to job
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const vaultContent = {
      powerPhrases: powerPhrasesRes.data || [],
      skills: skillsRes.data || [],
      competencies: competenciesRes.data || [],
      achievements: achievementsRes.data || [],
    };

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert career advisor analyzing a candidate's career vault against a job description. 
Your task is to identify the most relevant vault items and score them by relevance (0-1).
Return ONLY valid JSON with this structure:
{
  "suggestions": [
    {
      "id": "vault_item_id",
      "type": "power_phrase|skill|competency|achievement",
      "content": "the actual content text",
      "relevanceScore": 0.95,
      "reasoning": "why this is relevant"
    }
  ]
}
Focus on items that directly match job requirements, demonstrate required skills, or showcase relevant achievements.`
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nCareer Vault:\n${JSON.stringify(vaultContent, null, 2)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "match_vault_content",
              description: "Match career vault content to job requirements",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string", enum: ["power_phrase", "skill", "competency", "achievement"] },
                        content: { type: "string" },
                        relevanceScore: { type: "number", minimum: 0, maximum: 1 },
                        reasoning: { type: "string" }
                      },
                      required: ["id", "type", "content", "relevanceScore", "reasoning"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "match_vault_content" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('Matched suggestions:', result.suggestions.length);

    // Sort by relevance score and return top suggestions
    const sortedSuggestions = result.suggestions
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15); // Return top 15 suggestions

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: sortedSuggestions,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-vault-intelligence:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

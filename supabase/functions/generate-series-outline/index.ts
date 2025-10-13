import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seriesTopic, seriesLength, userRole, industry, experienceYears, targetAudience } = await req.json();
    
    if (!seriesTopic || !seriesLength) {
      throw new Error('Series topic and length are required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert LinkedIn series strategist focused on creating authentic, executive-level content.

CRITICAL RULES:
- Generate exactly ${seriesLength} parts
- Each title MUST be max 12 words including "Part X of ${seriesLength}"
- Each focus statement MUST be max 25 words and address ONE concept only
- Use executive vocabulary: cost, margin, deadlines, systems, staff, results
- AVOID consultant jargon: synergy, holistic, resilience, paradigm, leverage

PROGRESSION STRUCTURE:
${seriesLength === 8 ? 'Parts 1-3: Foundation/common failures | Parts 4-6: Implementation | Parts 7-8: Leadership perspective' : ''}
${seriesLength === 12 ? 'Parts 1-3: Foundation/common failures | Parts 4-8: Implementation | Parts 9-12: Leadership/organizational' : ''}
${seriesLength === 16 ? 'Parts 1-4: Foundation/common failures | Parts 5-10: Implementation | Parts 11-16: Leadership/organizational' : ''}

Every 2-3 parts should address common failures or challenges.

Return as JSON:
{
  "seriesTitle": "Topic Name - Blog Series",
  "parts": [
    {
      "partNumber": 1,
      "title": "Why Most [X] Fail",
      "focusStatement": "Teams try to use both approaches simultaneously instead of choosing the right method.",
      "category": "foundation"
    }
  ]
}`;

    const userPrompt = `Create a ${seriesLength}-part LinkedIn blog series outline.

Series Topic: ${seriesTopic}
User Role: ${userRole || 'Not specified'}
Industry: ${industry || 'Not specified'}
Experience: ${experienceYears ? `${experienceYears} years` : 'Not specified'}
Target Audience: ${targetAudience || 'Not specified'}

Generate titles that sound practical and problem-focused, not theoretical.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_series_outline',
            description: 'Generate LinkedIn blog series outline',
            parameters: {
              type: 'object',
              properties: {
                seriesTitle: { type: 'string' },
                parts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      partNumber: { type: 'integer' },
                      title: { type: 'string' },
                      focusStatement: { type: 'string' },
                      category: { type: 'string', enum: ['foundation', 'implementation', 'leadership'] }
                    },
                    required: ['partNumber', 'title', 'focusStatement', 'category']
                  }
                }
              },
              required: ['seriesTitle', 'parts']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_series_outline' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const outline = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(outline), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error generating series outline:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
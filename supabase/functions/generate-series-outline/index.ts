import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

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

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'medium',
          requiresReasoning: true
        }),
        temperature: 0.7,
        max_tokens: 1500,
        return_citations: false,
      },
      'generate-series-outline'
    );

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices[0].message.content);
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const outline = JSON.parse(jsonMatch[0]);

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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phrase, context } = await req.json();

    const prompt = `You are a career coach helping add quantified metrics to achievement statements.

Original Phrase: "${phrase}"
Context: "${context || 'No additional context'}"

Analyze this phrase and suggest 2-3 specific metrics that could strengthen it. Return suggestions in this JSON format:
{
  "suggestions": [
    {
      "type": "amount",
      "value": "$2.3M",
      "example": "Led $2.3M digital transformation initiative"
    },
    {
      "type": "percentage",
      "value": "45%",
      "example": "Improved operational efficiency by 45%"
    },
    {
      "type": "timeframe",
      "value": "18 months",
      "example": "Delivered results in 18 months"
    }
  ]
}

Valid types: amount, percentage, teamSize, timeframe, roi
Be specific and realistic. If the phrase doesn't naturally support certain metrics, don't force them.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach specializing in quantifying achievements. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: PERPLEXITY_MODELS.SMALL,
        temperature: 0.7,
        max_tokens: 800,
        return_citations: false,
      },
      'suggest-metrics'
    );

    await logAIUsage(metrics);

    const rawContent = cleanCitations(response.choices[0].message.content);
    const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    const suggestions = parsed.suggestions || [];

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', suggestions: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

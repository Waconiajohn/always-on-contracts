import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MODERN_KEYWORDS = [
  'AI', 'ML', 'machine learning', 'artificial intelligence',
  'cloud', 'AWS', 'Azure', 'GCP',
  'automation', 'DevOps', 'CI/CD',
  'data analytics', 'big data', 'data-driven',
  'agile', 'scrum', 'digital transformation',
  'SaaS', 'API', 'microservices',
  'blockchain', 'IoT', 'edge computing',
  'cybersecurity', 'zero trust',
  'remote-first', 'hybrid work', 'distributed teams'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phrase, context } = await req.json();

    const prompt = `You are a career coach helping modernize professional achievement statements with current industry terminology.

Original Phrase: "${phrase}"
Context: "${context || 'No additional context'}"

Modern keywords to consider: ${MODERN_KEYWORDS.join(', ')}

Rewrite this phrase to include modern, relevant terminology that shows the person is current with industry trends. Focus on adding terms like AI, cloud, automation, data-driven, agile, digital transformation, etc. where appropriate.

Return your response in this JSON format:
{
  "suggestion": {
    "original": "${phrase}",
    "modernized": "Your modernized version here",
    "addedKeywords": ["cloud", "AI", "automation"],
    "reasoning": "Brief explanation of why you added these terms"
  }
}

Be authentic - only add terms that genuinely fit the achievement. Don't force modern buzzwords where they don't belong.`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach specializing in modernizing professional language. Return valid JSON only.'
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
      'modernize-language'
    );

    await logAIUsage(metrics);

    const rawContent = cleanCitations(response.choices[0].message.content);
    const cleanedContent = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanedContent);
    const suggestion = parsed.suggestion;

    return new Response(
      JSON.stringify({ suggestion }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', suggestion: null }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

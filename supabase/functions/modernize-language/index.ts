import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Use OpenAI-compatible API with either Anthropic or Gemini
    const useAnthropic = Deno.env.get('ANTHROPIC_API_KEY');

    let suggestion = null;

    if (useAnthropic) {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      const parsed = JSON.parse(content);
      suggestion = parsed.suggestion;
    } else {
      // Fallback to Gemini
      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: 'application/json'
            }
          })
        }
      );

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      const parsed = JSON.parse(content);
      suggestion = parsed.suggestion;
    }

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

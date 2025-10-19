import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Use OpenAI-compatible API with either Anthropic or Gemini
    const useAnthropic = Deno.env.get('ANTHROPIC_API_KEY');

    let suggestions = [];

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
      suggestions = parsed.suggestions || [];
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
      suggestions = parsed.suggestions || [];
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, suggestions: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

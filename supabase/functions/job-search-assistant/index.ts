import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { PERPLEXITY_CONFIG } from '../_shared/ai-config.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Build system prompt with Career Vault context
    const systemPrompt = `You are an AI Job Search Assistant powered by the user's Career Vault.

User's Profile:
- Skills: ${context?.skills?.join(', ') || 'Not provided'}
- Target Titles: ${context?.titles?.join(', ') || 'Not provided'}
- Transferable Skills: ${context?.transferableSkills || 0} available
- Current Search: "${context?.query || 'None'}"
- Results Found: ${context?.resultsCount || 0}
- Active Filters: ${context?.activeFilters || 'None'}

Your role:
1. Guide users through job searches with proactive suggestions
2. Recommend filter adjustments based on results
3. Explain why jobs match their background
4. Warn when to use transferable skills (only as last resort)
5. Provide quick actions as buttons in your responses

Style:
- Be conversational but efficient
- Use emojis sparingly for emphasis
- Suggest 2-3 quick actions per response
- Keep responses under 100 words unless explaining complex matches

Format quick actions as:
[Action: Label]

Example:
"I found 23 remote Product Manager positions matching your skills. 8 of these emphasize your healthcare background.

[Action: Show Remote Only]
[Action: View Healthcare Matches]
[Action: Adjust Filters]"`;

    const response = await fetch(PERPLEXITY_CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Job search assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

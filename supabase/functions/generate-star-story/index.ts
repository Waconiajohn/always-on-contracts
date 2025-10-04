import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { rawStory, action = 'generate', provider = 'lovable' } = await req.json();

    console.log('STAR story request:', { action, hasRawStory: !!rawStory });

    let prompt = '';
    
    if (action === 'generate') {
      prompt = `You are an executive career coach helping a professional create a STAR method achievement story.

Based on this raw achievement description, create a structured STAR story:

"${rawStory}"

Generate a JSON response with this exact structure:
{
  "title": "Brief compelling title (5-8 words)",
  "situation": "Context and background of the challenge (2-3 sentences)",
  "task": "What specifically needed to be accomplished and why it mattered (2-3 sentences)",
  "action": "Specific actions taken, methodologies used, and leadership demonstrated (3-4 sentences with concrete details)",
  "result": "Quantifiable outcomes, impact metrics, and business value created (2-3 sentences with numbers)",
  "skills": ["skill1", "skill2", "skill3"],
  "metrics": {
    "primaryMetric": "X% increase/decrease in Y",
    "secondaryMetrics": ["Additional quantifiable results"]
  },
  "industry": "Industry context",
  "timeframe": "Duration or time period"
}

Focus on quantifiable results and executive-level impact.`;
    } else if (action === 'refine') {
      prompt = `You are refining an existing STAR story to be more impactful for executive-level positions.

Current story:
${JSON.stringify(rawStory, null, 2)}

Enhance this story by:
1. Making the language more executive-level and strategic
2. Adding more quantifiable metrics where possible
3. Emphasizing leadership and business impact
4. Ensuring the action section shows initiative and innovation

Return the same JSON structure but with enhanced content.`;
    }

    const apiUrl = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : LOVABLE_API_KEY;
    const model = provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash';

    console.log(`Using ${provider} AI for STAR story`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert career coach specializing in helping executives articulate their achievements using the STAR method. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: provider === 'openai' ? 0.7 : undefined,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', response.status, error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }

    const starStory = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify({ starStory }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-star-story function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

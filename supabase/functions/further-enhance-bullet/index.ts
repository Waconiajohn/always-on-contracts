import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      originalBullet,
      currentEnhancedBullet,
      requirement,
      userGuidance,
      jobContext
    } = await req.json();

    if (!originalBullet || !currentEnhancedBullet || !requirement) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build enhancement prompt based on user guidance
    let enhancementInstruction = '';
    if (userGuidance === 'quantifiable') {
      enhancementInstruction = `Add specific metrics, percentages, dollar amounts, or quantified impact. Transform vague statements into measurable achievements.`;
    } else if (userGuidance === 'technical') {
      enhancementInstruction = `Add more technical depth - mention specific technologies, methodologies, tools, frameworks, or technical approaches used.`;
    } else if (userGuidance === 'leadership') {
      enhancementInstruction = `Emphasize leadership aspects - team size, mentoring, decision-making authority, stakeholder management, or strategic influence.`;
    } else if (userGuidance.startsWith('keyword:')) {
      const keyword = userGuidance.replace('keyword:', '').trim();
      enhancementInstruction = `Naturally incorporate the keyword "${keyword}" into this bullet while maintaining authenticity and flow.`;
    } else {
      enhancementInstruction = userGuidance; // Custom user input
    }

    const prompt = `You are an expert resume writer. You need to further enhance an already-enhanced resume bullet.

JOB REQUIREMENT TO ADDRESS:
${requirement}

ORIGINAL BULLET (before any enhancement):
${originalBullet}

CURRENT ENHANCED VERSION:
${currentEnhancedBullet}

${jobContext ? `JOB CONTEXT:\n${jobContext}\n` : ''}

USER'S ENHANCEMENT REQUEST:
${enhancementInstruction}

INSTRUCTIONS:
1. Start with the current enhanced version, not the original
2. Apply the user's specific enhancement request
3. Maintain all existing good qualities (ATS keywords, impact, clarity)
4. Keep it concise (1-2 lines maximum)
5. Ensure it directly addresses the job requirement
6. Preserve factual accuracy from the original bullet

Return ONLY the further-enhanced bullet text, nothing else.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are an expert ATS resume writer. Return only the enhanced bullet text, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedBullet = data.choices[0]?.message?.content?.trim();

    if (!enhancedBullet) {
      throw new Error('No enhanced bullet generated');
    }

    return new Response(
      JSON.stringify({ 
        enhancedBullet,
        appliedGuidance: userGuidance
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in further-enhance-bullet:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

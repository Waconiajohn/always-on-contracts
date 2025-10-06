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
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

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

    const { question, currentAnswer, validationFeedback } = await req.json();

    if (!question || !currentAnswer) {
      throw new Error('Question and current answer are required');
    }

    // Get Career Vault data for resume context
    const { data: vault } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const enhancementPrompt = `You are helping improve an interview answer by providing an enhanced example.

QUESTION:
${question}

USER'S CURRENT ANSWER:
${currentAnswer}

VALIDATION FEEDBACK:
${JSON.stringify(validationFeedback || {})}

RESUME CONTEXT:
${JSON.stringify(vault?.initial_analysis || {})}

Your task: Create an ENHANCED version of their answer that:
1. BUILDS ON what they already said (don't ignore their input)
2. Adds specific details from their resume where relevant
3. Includes the missing elements (specificity, quantification, context, impact)
4. Uses STAR format (Situation, Task, Action, Result)
5. Feels natural and authentic to their career story

Return JSON with:
{
  "enhanced_answer": "The improved answer with specific details",
  "what_was_added": "Brief explanation of what you enhanced",
  "resume_details_used": ["List of specific resume details incorporated"]
}

Keep the enhanced answer realistic and grounded in their actual experience. Don't fabricate - enhance.`;

    console.log('Generating enhanced answer example');
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
            content: 'You are an expert interview coach creating enhanced answer examples. Return only valid JSON.' 
          },
          { role: 'user', content: enhancementPrompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`Failed to generate enhanced answer: ${response.status}`);
    }

    const aiResponse = await response.json();
    const enhancedText = aiResponse.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = enhancedText.match(/\{[\s\S]*\}/);
    const enhancement = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      enhanced_answer: currentAnswer,
      what_was_added: "Could not generate enhancement",
      resume_details_used: []
    };

    return new Response(
      JSON.stringify(enhancement),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating enhanced answer:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        enhanced_answer: "",
        what_was_added: "",
        resume_details_used: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

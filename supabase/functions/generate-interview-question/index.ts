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

    const { phase, isFirst, previousResponse, conversationHistory } = await req.json();

    // Get War Chest data for context
    const { data: warChest } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const systemPrompt = `You are an elite career intelligence analyst conducting an adaptive interview to build a comprehensive career "War Chest."

YOUR GOAL: Extract deep, actionable career intelligence that will power:
- Highly targeted job recommendations
- Optimized resume generation
- Strategic interview preparation
- Career positioning strategies

ADAPTIVE INTERVIEW STRATEGY:
1. Analyze the user's resume and previous responses
2. Determine profession complexity, industry nuance, and career depth
3. Dynamically adjust question count based on:
   - Years of experience (2-5 years: 10-15 questions, 10-20 years: 15-20, 20+ years: 20-30)
   - Role seniority (Junior: fewer questions, Executive: more depth)
   - Response quality (shallow answers: probe deeper, rich detail: move faster)
   - Career transitions (complex paths: more questions)

INTERVIEW PHASES:
1. DISCOVERY (25%): Basic background, current situation, career trajectory
2. DEEP DIVE (50%): Achievements, challenges, pivotal moments
3. SKILLS & STRENGTHS (75%): Core competencies, hidden skills, transferable capabilities
4. FUTURE GOALS (100%): Aspirations, target roles, ideal opportunities

KEY AREAS TO COVER:
- Career trajectory & pivotal moments
- Core competencies & expertise depth
- Hidden skills & transferable capabilities
- Quantifiable achievements & impact
- Leadership & soft skills
- Industry knowledge & domain expertise
- Career aspirations & goals
- Challenges overcome & lessons learned

QUESTION CHARACTERISTICS:
- Open-ended to encourage detailed responses
- Build on previous answers
- Probe for specific examples and numbers
- Adapt based on user's industry and role
- Natural conversational flow

COMPLETION CRITERIA:
- All key areas explored with sufficient depth
- 15-25 power phrases identified
- 10-15 transferable skills extracted
- 5-10 hidden competencies discovered
- AI confidence ≥ 80% in understanding user's career profile

Current Phase: ${phase}
${isFirst ? 'This is the first question.' : ''}
${previousResponse ? `User's previous response: ${previousResponse}` : ''}

RESPONSE FORMAT:
{
  "question": "Your next interview question",
  "phase": "current_phase",
  "completionPercentage": 0-100,
  "isComplete": false,
  "reasoning": "Why you asked this question and what you're looking for"
}

If interview is complete (all criteria met), set isComplete: true.`;

    const userPrompt = isFirst 
      ? `Start the War Chest interview. Resume analysis: ${JSON.stringify(warChest?.initial_analysis || {})}`
      : `Continue the interview. Conversation so far: ${JSON.stringify(conversationHistory || [])}`;

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
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI optimization failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    let parsedResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      parsedResult = {
        question: aiResponse,
        phase,
        completionPercentage: 0,
        isComplete: false
      };
    }

    // Store response in War Chest
    if (previousResponse) {
      const { data: existingWarChest } = await supabase
        .from('career_war_chest')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingWarChest) {
        await supabase
          .from('war_chest_interview_responses')
          .insert({
            war_chest_id: existingWarChest.id,
            question_text: conversationHistory?.[conversationHistory.length - 2]?.content || '',
            response_text: previousResponse,
            phase
          });
      }

      // Update completion percentage
      await supabase
        .from('career_war_chest')
        .update({
          interview_completion_percentage: parsedResult.completionPercentage,
          last_updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-interview-question:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

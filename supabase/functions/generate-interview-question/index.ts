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

YOUR GOAL: Extract deep, actionable career intelligence through structured, contextual questions.

RESPONSE FORMAT (ALWAYS RETURN THIS STRUCTURE):
{
  "question": {
    "context": "Why I'm asking this - explain the strategic value of this question",
    "knownData": [
      {
        "label": "Current Role",
        "value": "Senior Product Manager",
        "source": "resume"
      },
      {
        "label": "Years Experience", 
        "value": "12 years",
        "source": "resume"
      },
      {
        "label": "Key Skills",
        "value": ["Product Strategy", "Team Leadership", "Data Analysis"],
        "source": "resume"
      }
    ],
    "questionsToExpand": [
      {
        "prompt": "Walk me through your biggest product success at [Company]",
        "placeholder": "Describe the product, your role, the outcome...",
        "hint": "Include specific metrics like user growth, revenue impact, or efficiency gains"
      },
      {
        "prompt": "What made this success repeatable?",
        "placeholder": "The framework or approach you can use again...",
        "hint": "Think about the process, not just the result"
      }
    ],
    "exampleAnswer": "At TechCorp, I led the redesign of our B2B dashboard which increased customer retention by 34% over 6 months. I identified pain points through 40+ user interviews, prioritized features using RICE scoring, and coordinated a cross-functional team of 8 people. The key was establishing weekly user feedback loops that we could replicate for future products."
  },
  "phase": "deep_dive",
  "completionPercentage": 45,
  "isComplete": false
}

CRITICAL INSTRUCTIONS:
1. ALWAYS pull specific data from the resume (${JSON.stringify(warChest?.initial_analysis || {})})
2. Create 1-3 sub-questions in questionsToExpand that probe for depth
3. Make knownData specific and relevant to this question
4. Provide realistic, detailed example answers
5. Context should explain WHY this question matters strategically
6. Hints should guide users toward quantified, specific responses

INTERVIEW PHASES:
1. DISCOVERY (0-25%): Career trajectory, current role, key accomplishments
2. DEEP_DIVE (25-60%): Detailed achievements with metrics, leadership examples, problem-solving
3. SKILLS (60-85%): Technical skills, soft skills, hidden competencies, transferable capabilities
4. FUTURE (85-100%): Career goals, target roles, ideal opportunities

QUESTION STRATEGY:
- Reference specific items from their resume in knownData
- Build on previous responses (${previousResponse ? `Previous: ${previousResponse}` : 'First question'})
- Probe for STAR format: Situation, Task, Action, Result
- Always ask for metrics and numbers
- Adaptive depth based on response quality

Current Phase: ${phase}
${isFirst ? 'This is the FIRST question - focus on career overview' : ''}

Return ONLY valid JSON in the format above.`;

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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI } from '../_shared/lovableAI.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GapQuestion {
  question: string;
  hint: string;
  targetArea: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    const { vaultId, gaps } = await req.json();

    console.log('Generating gap questions for vault:', vaultId);
    console.log('Number of gaps:', gaps.length);

    const generatedGaps = [];

    for (const gap of gaps) {
      console.log('Processing gap:', gap.gap_type, gap.requirement);

      // Generate 2-3 questions per gap
      const prompt = `You are a career coach helping someone fill gaps in their professional profile.

Gap Type: ${gap.gap_type}
Requirement: ${gap.requirement}
Reasoning: ${gap.reasoning}
Priority: ${gap.priority}

Generate 2-3 specific, actionable questions that will help this person provide evidence of having this capability.

Each question should:
1. Be specific and concrete (not vague)
2. Ask for real examples and outcomes
3. Include a helpful hint about what good evidence looks like

Return a JSON array of questions in this format:
[
  {
    "question": "Can you describe a specific time when you [relevant action]?",
    "hint": "Include the situation, your specific actions, and measurable outcomes",
    "targetArea": "${gap.gap_type}"
  }
]`;

      const aiResponse = await callLovableAI(
        [{ role: 'user', content: prompt }],
        'google/gemini-2.5-flash',
        { temperature: 0.7, max_tokens: 1000 }
      );

      const messageContent = aiResponse.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = messageContent.match(/\[[\s\S]*\]/);
      const questions: GapQuestion[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      console.log(`Generated ${questions.length} questions for gap ${gap.gap_id}`);

      // Create gap progress record
      const { data: gapProgress, error: insertError } = await supabase
        .from('vault_gap_progress')
        .insert({
          vault_id: vaultId,
          gap_id: gap.gap_id,
          gap_type: gap.gap_type,
          gap_description: gap.requirement,
          questions_generated: questions,
          total_questions: questions.length,
          questions_answered: 0,
          status: 'open'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting gap progress:', insertError);
        throw insertError;
      }

      generatedGaps.push(gapProgress);
    }

    console.log('Successfully generated questions for all gaps');

    return new Response(
      JSON.stringify({
        success: true,
        gaps: generatedGaps,
        totalQuestions: generatedGaps.reduce((sum, g) => sum + g.total_questions, 0)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-gap-questions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorStack
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

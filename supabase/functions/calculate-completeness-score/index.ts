import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Count confirmed skills
    const { count: confirmedCount, error: confirmedError } = await supabase
      .from('vault_confirmed_skills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (confirmedError) throw confirmedError;

    // Count total suggested skills
    const { count: totalCount, error: totalError } = await supabase
      .from('vault_skill_taxonomy')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (totalError) throw totalError;

    // Get interview responses with quality scores
    const { data: responses, error: responsesError } = await supabase
      .from('vault_responses')
      .select('quality_score')
      .eq('user_id', user.id);

    if (responsesError) throw responsesError;

    // Calculate skill confirmation score (50% weight)
    const skillScore = totalCount && totalCount > 0 
      ? (confirmedCount || 0) / totalCount 
      : 0;

    // Calculate interview quality score (50% weight)
    const qualityScores = responses
      ?.filter((r) => r.quality_score && r.quality_score >= 70)
      .map((r) => r.quality_score) || [];

    const avgQuality = qualityScores.length > 0
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length
      : 0;

    const interviewScore = avgQuality / 100;

    // Combined completeness score
    const completenessPercentage = Math.round((skillScore * 50) + (interviewScore * 50));

    // Determine recommended question count based on completeness
    let recommendedQuestionCount: number;
    if (completenessPercentage >= 80) {
      recommendedQuestionCount = Math.floor(Math.random() * 4) + 5; // 5-8 questions
    } else if (completenessPercentage >= 50) {
      recommendedQuestionCount = Math.floor(Math.random() * 6) + 10; // 10-15 questions
    } else {
      recommendedQuestionCount = Math.floor(Math.random() * 6) + 20; // 20-25 questions
    }

    // Update profile with completeness score
    await supabase
      .from('profiles')
      .update({ completeness_score: completenessPercentage })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        completeness_percentage: completenessPercentage,
        recommended_question_count: recommendedQuestionCount,
        breakdown: {
          skills_confirmed: confirmedCount || 0,
          skills_total: totalCount || 0,
          skill_score: Math.round(skillScore * 50),
          interview_responses: responses?.length || 0,
          quality_responses: qualityScores.length,
          interview_score: Math.round(interviewScore * 50),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in calculate-completeness-score:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
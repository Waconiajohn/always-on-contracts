import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log('[GET-VAULT-INTELLIGENCE] Fetching for user:', user.id);

    // Get the career vault
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (vaultError || !vault) {
      return new Response(JSON.stringify({ 
        intelligence: null,
        message: 'No Career Vault found. Please complete the interview first.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch ALL 20 intelligence categories in parallel
    const [
      powerPhrases,
      transferableSkills,
      hiddenCompetencies,
      softSkills,
      leadershipPhilosophy,
      executivePresence,
      personalityTraits,
      workStyle,
      values,
      behavioralIndicators,
      problemSolvingApproaches,
      decisionMakingStyles,
      communicationPreferences,
      conflictResolutionStrategies,
      motivationDrivers,
      learningStyles,
      adaptabilityIndicators,
      riskToleranceLevels,
      collaborationPatterns,
      innovationTendencies,
      interviewResponses
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vault.id),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vault.id),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vault.id),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vault.id),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vault.id),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vault.id),
      supabase.from('vault_personality_traits').select('*').eq('vault_id', vault.id),
      supabase.from('vault_work_style').select('*').eq('vault_id', vault.id),
      supabase.from('vault_values').select('*').eq('vault_id', vault.id),
      supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vault.id),
      supabase.from('vault_problem_solving_approaches').select('*').eq('vault_id', vault.id),
      supabase.from('vault_decision_making_styles').select('*').eq('vault_id', vault.id),
      supabase.from('vault_communication_preferences').select('*').eq('vault_id', vault.id),
      supabase.from('vault_conflict_resolution_strategies').select('*').eq('vault_id', vault.id),
      supabase.from('vault_motivation_drivers').select('*').eq('vault_id', vault.id),
      supabase.from('vault_learning_styles').select('*').eq('vault_id', vault.id),
      supabase.from('vault_adaptability_indicators').select('*').eq('vault_id', vault.id),
      supabase.from('vault_risk_tolerance_levels').select('*').eq('vault_id', vault.id),
      supabase.from('vault_collaboration_patterns').select('*').eq('vault_id', vault.id),
      supabase.from('vault_innovation_tendencies').select('*').eq('vault_id', vault.id),
      supabase.from('vault_interview_responses').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false })
    ]);

    const intelligence = {
      // Overview
      completionPercentage: vault.interview_completion_percentage || 0,
      strengthScore: vault.overall_strength_score || 0,
      resumeText: vault.resume_raw_text,
      initialAnalysis: vault.initial_analysis,
      
      // Core Intelligence (First 3)
      powerPhrases: powerPhrases.data || [],
      transferableSkills: transferableSkills.data || [],
      hiddenCompetencies: hiddenCompetencies.data || [],
      
      // All 17 Intangibles
      softSkills: softSkills.data || [],
      leadershipPhilosophy: leadershipPhilosophy.data || [],
      executivePresence: executivePresence.data || [],
      personalityTraits: personalityTraits.data || [],
      workStyle: workStyle.data || [],
      values: values.data || [],
      behavioralIndicators: behavioralIndicators.data || [],
      problemSolvingApproaches: problemSolvingApproaches.data || [],
      decisionMakingStyles: decisionMakingStyles.data || [],
      communicationPreferences: communicationPreferences.data || [],
      conflictResolutionStrategies: conflictResolutionStrategies.data || [],
      motivationDrivers: motivationDrivers.data || [],
      learningStyles: learningStyles.data || [],
      adaptabilityIndicators: adaptabilityIndicators.data || [],
      riskToleranceLevels: riskToleranceLevels.data || [],
      collaborationPatterns: collaborationPatterns.data || [],
      innovationTendencies: innovationTendencies.data || [],
      
      // Interview History
      interviewResponses: interviewResponses.data || [],
      
      // Summary Counts
      counts: {
        powerPhrases: vault.total_power_phrases || 0,
        transferableSkills: vault.total_transferable_skills || 0,
        hiddenCompetencies: vault.total_hidden_competencies || 0,
        softSkills: vault.total_soft_skills || 0,
        leadershipPhilosophy: vault.total_leadership_philosophy || 0,
        executivePresence: vault.total_executive_presence || 0,
        personalityTraits: vault.total_personality_traits || 0,
        workStyle: vault.total_work_style || 0,
        values: vault.total_values || 0,
        behavioralIndicators: vault.total_behavioral_indicators || 0
      },
      
      // Metadata
      lastUpdated: vault.last_updated_at,
      createdAt: vault.created_at,
    };

    console.log('[GET-VAULT-INTELLIGENCE] Total intelligence items:', 
      Object.values(intelligence.counts).reduce((sum, count) => sum + count, 0));

    return new Response(JSON.stringify({ intelligence }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET-VAULT-INTELLIGENCE] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
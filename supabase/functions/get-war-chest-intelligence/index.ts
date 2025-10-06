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

    console.log('[GET-WAR-CHEST-INTELLIGENCE] Fetching for user:', user.id);

    // Get the war chest
    const { data: warChest, error: wcError } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (wcError || !warChest) {
      return new Response(JSON.stringify({ 
        intelligence: null,
        message: 'No War Chest found. Please complete the interview first.' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all intelligence categories in parallel
    const [
      powerPhrases,
      transferableSkills,
      hiddenCompetencies,
      businessImpacts,
      leadershipEvidence,
      technicalDepth,
      projects,
      industryExpertise,
      problemSolving,
      stakeholderMgmt,
      careerNarrative,
      competitiveAdvantages,
      communication,
      interviewResponses
    ] = await Promise.all([
      supabase.from('war_chest_power_phrases').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_transferable_skills').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_hidden_competencies').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_business_impact').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_leadership_evidence').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_technical_depth').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_projects').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_industry_expertise').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_problem_solving').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_stakeholder_mgmt').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_career_narrative').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_competitive_advantages').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_communication').select('*').eq('war_chest_id', warChest.id),
      supabase.from('war_chest_interview_responses').select('*').eq('war_chest_id', warChest.id).order('created_at', { ascending: false })
    ]);

    const intelligence = {
      // Overview
      completionPercentage: warChest.interview_completion_percentage || 0,
      strengthScore: warChest.overall_strength_score || 0,
      resumeText: warChest.resume_raw_text,
      initialAnalysis: warChest.initial_analysis,
      
      // Core Intelligence (Original 3)
      powerPhrases: powerPhrases.data || [],
      transferableSkills: transferableSkills.data || [],
      hiddenCompetencies: hiddenCompetencies.data || [],
      
      // Expanded Intelligence (New 10)
      businessImpacts: businessImpacts.data || [],
      leadershipEvidence: leadershipEvidence.data || [],
      technicalDepth: technicalDepth.data || [],
      projects: projects.data || [],
      industryExpertise: industryExpertise.data || [],
      problemSolving: problemSolving.data || [],
      stakeholderManagement: stakeholderMgmt.data || [],
      careerNarrative: careerNarrative.data || [],
      competitiveAdvantages: competitiveAdvantages.data || [],
      communicationExamples: communication.data || [],
      
      // Interview History
      interviewResponses: interviewResponses.data || [],
      
      // Summary Counts
      counts: {
        powerPhrases: warChest.total_power_phrases || 0,
        transferableSkills: warChest.total_transferable_skills || 0,
        hiddenCompetencies: warChest.total_hidden_competencies || 0,
        businessImpacts: warChest.total_business_impacts || 0,
        leadershipExamples: warChest.total_leadership_examples || 0,
        technicalSkills: warChest.total_technical_skills || 0,
        projects: warChest.total_projects || 0,
        industryExpertise: warChest.total_industry_expertise || 0,
        problemSolving: warChest.total_problem_solving || 0,
        stakeholderExamples: warChest.total_stakeholder_examples || 0,
        careerNarrative: warChest.total_career_narrative || 0,
        competitiveAdvantages: warChest.total_competitive_advantages || 0,
        communicationExamples: warChest.total_communication_examples || 0,
      },
      
      // Metadata
      lastUpdated: warChest.last_updated_at,
      createdAt: warChest.created_at,
    };

    console.log('[GET-WAR-CHEST-INTELLIGENCE] Total intelligence items:', 
      Object.values(intelligence.counts).reduce((sum, count) => sum + count, 0));

    return new Response(JSON.stringify({ intelligence }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[GET-WAR-CHEST-INTELLIGENCE] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

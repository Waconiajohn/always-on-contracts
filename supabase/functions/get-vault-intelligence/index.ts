// Vault Intelligence Fetcher
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Fetching vault intelligence for user:', user.id);

    // Fetch all vault content from ALL 20 categories
    const [
      powerPhrasesRes,
      skillsRes,
      transferableSkillsRes,
      competenciesRes,
      achievementsRes,
      softSkillsRes,
      leadershipRes,
      executivePresenceRes,
      personalityTraitsRes,
      workStyleRes,
      valuesRes,
      behavioralRes
    ] = await Promise.all([
      supabaseClient.from('vault_power_phrases').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_confirmed_skills').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_transferable_skills').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_hidden_competencies').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_achievements').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_soft_skills').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_leadership_philosophy').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_executive_presence').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_personality_traits').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_work_style').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_values_motivations').select('*').eq('user_id', user.id),
      supabaseClient.from('vault_behavioral_indicators').select('*').eq('user_id', user.id)
    ]);

    // Prepare comprehensive intelligence object
    const intelligence = {
      powerPhrases: powerPhrasesRes.data || [],
      confirmedSkills: skillsRes.data || [],
      transferableSkills: transferableSkillsRes.data || [],
      hiddenCompetencies: competenciesRes.data || [],
      achievements: achievementsRes.data || [],
      softSkills: softSkillsRes.data || [],
      leadershipPhilosophy: leadershipRes.data || [],
      executivePresence: executivePresenceRes.data || [],
      personalityTraits: personalityTraitsRes.data || [],
      workStyle: workStyleRes.data || [],
      values: valuesRes.data || [],
      behavioralIndicators: behavioralRes.data || [],
      counts: {
        powerPhrases: powerPhrasesRes.data?.length || 0,
        skills: skillsRes.data?.length || 0,
        transferableSkills: transferableSkillsRes.data?.length || 0,
        competencies: competenciesRes.data?.length || 0,
        achievements: achievementsRes.data?.length || 0,
        softSkills: softSkillsRes.data?.length || 0,
        leadership: leadershipRes.data?.length || 0,
        executivePresence: executivePresenceRes.data?.length || 0,
        personality: personalityTraitsRes.data?.length || 0,
        workStyle: workStyleRes.data?.length || 0,
        values: valuesRes.data?.length || 0,
        behavioral: behavioralRes.data?.length || 0
      }
    };

    console.log('Vault intelligence fetched:', intelligence.counts);

    return new Response(
      JSON.stringify({
        success: true,
        intelligence,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-vault-intelligence:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

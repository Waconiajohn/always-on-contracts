import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Get Vault Data
 * 
 * Replacement for mcp-vault-manager.get
 * Fetches complete vault data for a user including all intelligence categories
 */

serve(async (req) => {
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId } = await req.json();

    // Fetch vault
    const { data: vault, error: vaultError } = await supabaseClient
      .from('career_vault')
      .select('*')
      .eq('user_id', userId || user.id)
      .maybeSingle();

    if (vaultError) throw vaultError;

    if (!vault) {
      return new Response(JSON.stringify({ 
        success: true,
        data: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch all intelligence categories in parallel
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
      behavioralIndicators
    ] = await Promise.all([
      supabaseClient.from('vault_power_phrases').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_transferable_skills').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_hidden_competencies').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_soft_skills').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_leadership_philosophy').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_executive_presence').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_personality_traits').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_work_style').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_values_motivations').select('*').eq('vault_id', vault.id),
      supabaseClient.from('vault_behavioral_indicators').select('*').eq('vault_id', vault.id)
    ]);

    return new Response(JSON.stringify({ 
      success: true,
      data: {
        vault,
        intelligence: {
          powerPhrases: powerPhrases.data || [],
          transferableSkills: transferableSkills.data || [],
          hiddenCompetencies: hiddenCompetencies.data || [],
          softSkills: softSkills.data || [],
          leadershipPhilosophy: leadershipPhilosophy.data || [],
          executivePresence: executivePresence.data || [],
          personalityTraits: personalityTraits.data || [],
          workStyle: workStyle.data || [],
          values: values.data || [],
          behavioralIndicators: behavioralIndicators.data || []
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[GET-VAULT-DATA] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

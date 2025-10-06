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

    // Fetch all intelligence categories in parallel
    const [
      powerPhrases,
      transferableSkills,
      hiddenCompetencies,
      interviewResponses
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vault.id),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vault.id),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vault.id),
      supabase.from('vault_interview_responses').select('*').eq('vault_id', vault.id).order('created_at', { ascending: false })
    ]);

    const intelligence = {
      // Overview
      completionPercentage: vault.interview_completion_percentage || 0,
      strengthScore: vault.overall_strength_score || 0,
      resumeText: vault.resume_raw_text,
      initialAnalysis: vault.initial_analysis,
      
      // Core Intelligence
      powerPhrases: powerPhrases.data || [],
      transferableSkills: transferableSkills.data || [],
      hiddenCompetencies: hiddenCompetencies.data || [],
      
      // Interview History
      interviewResponses: interviewResponses.data || [],
      
      // Summary Counts
      counts: {
        powerPhrases: vault.total_power_phrases || 0,
        transferableSkills: vault.total_transferable_skills || 0,
        hiddenCompetencies: vault.total_hidden_competencies || 0
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
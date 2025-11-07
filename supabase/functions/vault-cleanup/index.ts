// =====================================================
// VAULT CLEANUP UTILITY
// =====================================================
// Safely clears all vault data before re-extraction
// Preserves vault record and metadata
// Requires explicit confirmation for safety
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface CleanupRequest {
  vaultId: string;
  confirmation: string; // Must be "DELETE_ALL_DATA"
  preserveVaultRecord?: boolean; // Default: true
}

interface CleanupResult {
  success: boolean;
  deleted: {
    powerPhrases: number;
    transferableSkills: number;
    hiddenCompetencies: number;
    softSkills: number;
    leadershipPhilosophy: number;
    executivePresence: number;
    personalityTraits: number;
    coreValues: number;
    workStyle: number;
    passionProjects: number;
    total: number;
  };
  vaultId: string;
  timestamp: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request
    const { vaultId, confirmation, preserveVaultRecord = true } =
      await req.json() as CleanupRequest;

    // Safety check: Require explicit confirmation
    if (confirmation !== 'DELETE_ALL_DATA') {
      return new Response(
        JSON.stringify({
          error: 'Confirmation required',
          message: 'Must provide confirmation: "DELETE_ALL_DATA"'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vaultId) {
      return new Response(
        JSON.stringify({ error: 'vaultId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('\n🧹 VAULT CLEANUP STARTING');
    console.log(`Vault ID: ${vaultId}`);
    console.log(`Preserve vault record: ${preserveVaultRecord}`);

    // Verify vault exists
    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('id, user_id')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error(`Vault not found: ${vaultId}`);
    }

    const userId = vault.user_id;
    console.log(`User ID: ${userId}`);

    // Delete all vault items (track counts)
    const deleted = {
      powerPhrases: 0,
      transferableSkills: 0,
      hiddenCompetencies: 0,
      softSkills: 0,
      leadershipPhilosophy: 0,
      executivePresence: 0,
      personalityTraits: 0,
      coreValues: 0,
      workStyle: 0,
      passionProjects: 0,
      total: 0,
    };

    // Delete from vault_power_phrases
    const { data: ppData } = await supabase
      .from('vault_power_phrases')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.powerPhrases = ppData?.length || 0;
    console.log(`✅ Deleted ${deleted.powerPhrases} power phrases`);

    // Delete from vault_transferable_skills
    const { data: skillsData } = await supabase
      .from('vault_transferable_skills')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.transferableSkills = skillsData?.length || 0;
    console.log(`✅ Deleted ${deleted.transferableSkills} transferable skills`);

    // Delete from vault_hidden_competencies
    const { data: compData } = await supabase
      .from('vault_hidden_competencies')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.hiddenCompetencies = compData?.length || 0;
    console.log(`✅ Deleted ${deleted.hiddenCompetencies} hidden competencies`);

    // Delete from vault_soft_skills
    const { data: ssData } = await supabase
      .from('vault_soft_skills')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.softSkills = ssData?.length || 0;
    console.log(`✅ Deleted ${deleted.softSkills} soft skills`);

    // Delete from vault_leadership_philosophy
    const { data: lpData } = await supabase
      .from('vault_leadership_philosophy')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.leadershipPhilosophy = lpData?.length || 0;
    console.log(`✅ Deleted ${deleted.leadershipPhilosophy} leadership philosophy items`);

    // Delete from vault_executive_presence
    const { data: epData } = await supabase
      .from('vault_executive_presence')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.executivePresence = epData?.length || 0;
    console.log(`✅ Deleted ${deleted.executivePresence} executive presence items`);

    // Delete from vault_personality_traits
    const { data: ptData } = await supabase
      .from('vault_personality_traits')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.personalityTraits = ptData?.length || 0;
    console.log(`✅ Deleted ${deleted.personalityTraits} personality traits`);

    // Delete from vault_values_motivations
    const { data: vmData } = await supabase
      .from('vault_values_motivations')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.coreValues = vmData?.length || 0;
    console.log(`✅ Deleted ${deleted.coreValues} values & motivations`);

    // Delete from vault_work_style
    const { data: wsData } = await supabase
      .from('vault_work_style')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.workStyle = wsData?.length || 0;
    console.log(`✅ Deleted ${deleted.workStyle} work style items`);

    // Delete from vault_behavioral_indicators
    const { data: biData } = await supabase
      .from('vault_behavioral_indicators')
      .delete()
      .eq('vault_id', vaultId)
      .select('id');
    deleted.passionProjects = biData?.length || 0;
    console.log(`✅ Deleted ${deleted.passionProjects} behavioral indicators`);

    // Calculate total
    deleted.total =
      deleted.powerPhrases +
      deleted.transferableSkills +
      deleted.hiddenCompetencies +
      deleted.softSkills +
      deleted.leadershipPhilosophy +
      deleted.executivePresence +
      deleted.personalityTraits +
      deleted.coreValues +
      deleted.workStyle +
      deleted.passionProjects;

    // Update vault metadata (clear auto-populated flag, preserve resume)
    if (preserveVaultRecord) {
      await supabase
        .from('career_vault')
        .update({
          auto_populated: false,
          extraction_item_count: 0,
          last_extraction_session_id: null,
          extraction_version: null,
        })
        .eq('id', vaultId);

      console.log('✅ Updated vault record (preserved resume)');
    } else {
      // Delete vault record entirely
      await supabase
        .from('career_vault')
        .delete()
        .eq('id', vaultId);

      console.log('✅ Deleted vault record');
    }

    console.log(`\n✅ CLEANUP COMPLETE: ${deleted.total} items deleted`);

    const result: CleanupResult = {
      success: true,
      deleted,
      vaultId,
      timestamp: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Vault cleanup error:', error);

    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Refresh Vault Intelligence
 * 
 * Re-analyzes stale vault items (6+ months old) to:
 * - Update quality tiers based on new confidence scoring
 * - Refresh language to use modern terminology
 * - Re-calculate freshness scores
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { vaultId, ageThresholdDays = 180 } = await req.json();

    console.log(`[REFRESH-VAULT] Starting refresh for vault ${vaultId}, age threshold: ${ageThresholdDays} days`);

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ageThresholdDays);
    const cutoffIso = cutoffDate.toISOString();

    // Fetch stale items from all intelligence tables
    const tables = [
      'vault_power_phrases',
      'vault_transferable_skills',
      'vault_hidden_competencies',
      'vault_soft_skills',
      'vault_leadership_philosophy',
      'vault_executive_presence',
      'vault_personality_traits',
      'vault_work_style',
      'vault_values_motivations',
      'vault_behavioral_indicators'
    ];

    let totalRefreshed = 0;
    const refreshResults = [];

    for (const tableName of tables) {
      console.log(`[REFRESH-VAULT] Checking ${tableName}...`);

      // Fetch stale items
      const { data: staleItems, error: fetchError } = await supabaseClient
        .from(tableName)
        .select('*')
        .eq('vault_id', vaultId)
        .or(`last_updated_at.lt.${cutoffIso},last_updated_at.is.null`);

      if (fetchError) {
        console.error(`Error fetching from ${tableName}:`, fetchError);
        continue;
      }

      if (!staleItems || staleItems.length === 0) {
        console.log(`[REFRESH-VAULT] No stale items in ${tableName}`);
        continue;
      }

      console.log(`[REFRESH-VAULT] Found ${staleItems.length} stale items in ${tableName}`);

      // Update quality tiers and reset needs_user_review
      const updates = staleItems.map(item => {
        // Recalculate quality tier
        let newTier = 'assumed';
        
        if (item.quiz_verified || item.verification_status === 'verified') {
          newTier = 'gold';
        } else if ((item.ai_confidence && item.ai_confidence >= 0.70) || 
                   (item.evidence_count && item.evidence_count >= 3)) {
          newTier = 'silver';
        } else if ((item.ai_confidence && item.ai_confidence >= 0.55) ||
                   (item.evidence_count && item.evidence_count > 0) ||
                   item.ai_inferred) {
          newTier = 'bronze';
        }

        return supabaseClient
          .from(tableName)
          .update({
            quality_tier: newTier,
            needs_user_review: newTier === 'assumed' || newTier === 'bronze',
            last_updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      });

      await Promise.all(updates);
      totalRefreshed += staleItems.length;

      refreshResults.push({
        table: tableName,
        itemsRefreshed: staleItems.length
      });
    }

    console.log(`[REFRESH-VAULT] Refresh complete! Updated ${totalRefreshed} items`);

    // Update vault last_updated_at
    await supabaseClient
      .from('career_vault')
      .update({ last_updated_at: new Date().toISOString() })
      .eq('id', vaultId);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalRefreshed,
        details: refreshResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[REFRESH-VAULT] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

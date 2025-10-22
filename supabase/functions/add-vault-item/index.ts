import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Add Vault Item
 * 
 * Replacement for mcp-vault-manager.addItem
 * Adds a new intelligence item to the user's vault
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

    const { vaultId, category, itemData } = await req.json();

    if (!vaultId || !category || !itemData) {
      throw new Error('Missing required fields: vaultId, category, itemData');
    }

    // Map category to table name
    const categoryTableMap: Record<string, string> = {
      'power_phrases': 'vault_power_phrases',
      'transferable_skills': 'vault_transferable_skills',
      'hidden_competencies': 'vault_hidden_competencies',
      'soft_skills': 'vault_soft_skills',
      'leadership_philosophy': 'vault_leadership_philosophy',
      'executive_presence': 'vault_executive_presence',
      'personality_traits': 'vault_personality_traits',
      'work_style': 'vault_work_style',
      'values': 'vault_values_motivations',
      'behavioral_indicators': 'vault_behavioral_indicators'
    };

    const tableName = categoryTableMap[category];
    if (!tableName) {
      throw new Error(`Invalid category: ${category}`);
    }

    // Insert item
    const { data, error } = await supabaseClient
      .from(tableName)
      .insert({
        vault_id: vaultId,
        user_id: user.id,
        quality_tier: 'assumed', // Default for user-added items
        needs_user_review: false, // User explicitly added it
        ai_confidence: 1.0, // User input is 100% confident
        last_updated_at: new Date().toISOString(),
        ...itemData
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true,
      data 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADD-VAULT-ITEM] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

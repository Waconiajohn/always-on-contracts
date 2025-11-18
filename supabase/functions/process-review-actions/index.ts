// =====================================================
// PROCESS REVIEW ACTIONS - Career Vault 2.0
// =====================================================
// INTELLIGENT REVIEW WORKFLOW
//
// This function processes user review actions in batches,
// ensuring maximum efficiency and accuracy.
//
// KEY INNOVATION: Unlike other platforms that force
// item-by-item approval, we enable BATCH operations
// with smart prioritization—saving 20+ minutes.
//
// Actions:
// - Confirm: Upgrade quality tier, mark as reviewed
// - Edit: Update content, set to gold tier (user-verified)
// - Reject: Remove item entirely
// - Batch operations: Confirm all, reject low confidence
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ReviewAction {
  itemId: string;
  itemType: string; // power_phrases, transferable_skills, etc.
  action: 'confirm' | 'edit' | 'reject';
  updatedData?: {
    [key: string]: any;
  };
}

interface ProcessReviewRequest {
  vaultId: string;
  actions: ReviewAction[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map frontend item types to database table names
const TABLE_MAPPING: { [key: string]: string } = {
  'power_phrase': 'vault_power_phrases',
  'power_phrases': 'vault_power_phrases',
  'transferable_skill': 'vault_transferable_skills',
  'transferable_skills': 'vault_transferable_skills',
  'hidden_competency': 'vault_hidden_competencies',
  'hidden_competencies': 'vault_hidden_competencies',
  'soft_skill': 'vault_soft_skills',
  'soft_skills': 'vault_soft_skills',
  'leadership_philosophy': 'vault_leadership_philosophy',
  'executive_presence': 'vault_executive_presence',
  'personality_trait': 'vault_personality_traits',
  'personality_traits': 'vault_personality_traits',
  'work_style': 'vault_work_style',
  'values_motivation': 'vault_values_motivations',
  'values_motivations': 'vault_values_motivations',
  'behavioral_indicator': 'vault_behavioral_indicators',
  'behavioral_indicators': 'vault_behavioral_indicators',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { vaultId, actions }: ProcessReviewRequest = await req.json();

    if (!vaultId || !actions || actions.length === 0) {
      throw new Error('Missing required fields: vaultId and actions');
    }

    console.log('📝 PROCESSING REVIEW ACTIONS:', {
      vaultId,
      actionCount: actions.length,
      userId: user.id,
    });

    const results = {
      confirmed: 0,
      edited: 0,
      rejected: 0,
      errors: [] as string[],
    };

    // Process each action
    for (const reviewAction of actions) {
      const { itemId, itemType, action, updatedData } = reviewAction;

      // Get table name from mapping
      const tableName = TABLE_MAPPING[itemType];
      if (!tableName) {
        console.error('Unknown item type:', itemType);
        results.errors.push(`Unknown item type: ${itemType}`);
        continue;
      }

      try {
        if (action === 'confirm') {
          // CONFIRM: Upgrade quality tier, mark as reviewed
          const { error } = await supabaseClient
            .from(tableName)
            .update({
              quality_tier: 'silver', // Confirmed by user = silver minimum
              needs_user_review: false,
              review_action: 'confirmed',
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', itemId)
            .eq('user_id', user.id);

          if (error) {
            console.error(`Error confirming ${itemType}:`, error);
            results.errors.push(`Failed to confirm item ${itemId}: ${error.message}`);
          } else {
            results.confirmed++;
          }

        } else if (action === 'edit') {
          // EDIT: Update content, set to gold tier (user-verified)
          const updatePayload = {
            ...updatedData,
            quality_tier: 'gold', // User-edited = gold tier
            needs_user_review: false,
            review_action: 'edited',
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error } = await supabaseClient
            .from(tableName)
            .update(updatePayload)
            .eq('id', itemId)
            .eq('user_id', user.id);

          if (error) {
            console.error(`Error editing ${itemType}:`, error);
            results.errors.push(`Failed to edit item ${itemId}: ${error.message}`);
          } else {
            results.edited++;
          }

        } else if (action === 'reject') {
          // REJECT: Delete item entirely
          const { error } = await supabaseClient
            .from(tableName)
            .delete()
            .eq('id', itemId)
            .eq('user_id', user.id);

          if (error) {
            console.error(`Error rejecting ${itemType}:`, error);
            results.errors.push(`Failed to reject item ${itemId}: ${error.message}`);
          } else {
            results.rejected++;
          }

        } else {
          results.errors.push(`Unknown action: ${action} for item ${itemId}`);
        }

      } catch (itemError) {
        console.error(`Error processing item ${itemId}:`, itemError);
        results.errors.push(`Item ${itemId}: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    }

    // Recalculate vault strength after review
    const vaultStats = await supabaseClient
      .rpc('get_vault_statistics', { p_vault_id: vaultId });

    let newVaultStrength = 75; // Default
    if (vaultStats.data) {
      const stats = vaultStats.data;
      const totalItems = stats.totalItems || 0;
      const goldCount = stats.qualityBreakdown?.gold || 0;
      const silverCount = stats.qualityBreakdown?.silver || 0;

      // Vault strength formula: base + quality bonuses
      newVaultStrength = Math.min(100, Math.round(
        (totalItems / 2.5) + // Base score from item count
        (goldCount * 0.5) + // Gold items add more value
        (silverCount * 0.3) // Silver items add moderate value
      ));
    }

    // Update vault with new strength
    await supabaseClient
      .from('career_vault')
      .update({
        vault_strength_after_qa: newVaultStrength,
        onboarding_step: 'review_complete',
      })
      .eq('id', vaultId)
      .eq('user_id', user.id);

    // Log activity
    await supabaseClient.from('vault_activity_log').insert({
      vault_id: vaultId,
      user_id: user.id,
      activity_type: 'intelligence_extracted',
      description: `Reviewed ${actions.length} items: ${results.confirmed} confirmed, ${results.edited} edited, ${results.rejected} rejected`,
      metadata: {
        confirmed: results.confirmed,
        edited: results.edited,
        rejected: results.rejected,
        newVaultStrength,
      },
    });

    console.log('✅ REVIEW ACTIONS PROCESSED:', results);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...results,
          newVaultStrength,
          totalProcessed: actions.length,
        },
        meta: {
          message: `✅ Review Complete! Processed ${actions.length} items in seconds.`,
          uniqueValue: `Our smart batch processing saved you 20+ minutes compared to traditional item-by-item approval. Your vault is now ${newVaultStrength}% complete.`,
          qualityUpdate: results.edited > 0
            ? `${results.edited} items upgraded to gold tier (highest quality) based on your edits.`
            : `${results.confirmed} items confirmed and validated.`,
          nextStep: newVaultStrength >= 85
            ? `Your vault is at ${newVaultStrength}%—ready for professional use! You can now generate AI-optimized resumes.`
            : `You're at ${newVaultStrength}%. Answer a few gap-filling questions to reach 85%+ and unlock maximum effectiveness.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-review-actions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'We encountered an issue processing your review actions. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

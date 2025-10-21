import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Submit Micro-Question Answers & Upgrade Vault Items
 *
 * Processes user answers to micro-questions and upgrades vault item quality tiers.
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) throw new Error('Unauthorized');

    const { answers, triggerId } = await req.json();

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new Error('Answers array is required');
    }

    if (!triggerId) {
      throw new Error('Trigger ID is required');
    }

    console.log(`[SUBMIT-MICRO] Processing ${answers.length} answers for user ${user.id}`);

    const results = [];

    for (const answer of answers) {
      const { questionId, userAnswer } = answer;

      if (!questionId || userAnswer === null || userAnswer === undefined) {
        console.warn('[SUBMIT-MICRO] Invalid answer:', answer);
        continue;
      }

      // Fetch question record
      const { data: question, error: fetchError } = await supabase
        .from('progressive_profiling_questions')
        .select('*')
        .eq('id', questionId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !question) {
        console.error('[SUBMIT-MICRO] Question not found:', questionId);
        results.push({ questionId, success: false, error: 'Question not found' });
        continue;
      }

      // Update question with user answer
      const { error: updateError } = await supabase
        .from('progressive_profiling_questions')
        .update({
          user_answer: typeof userAnswer === 'object' ? userAnswer : { value: userAnswer },
          answered_at: new Date().toISOString()
        })
        .eq('id', questionId);

      if (updateError) {
        console.error('[SUBMIT-MICRO] Update error:', updateError);
        results.push({ questionId, success: false, error: updateError.message });
        continue;
      }

      // Upgrade vault item quality tier
      try {
        await supabase.rpc('upgrade_vault_item_tier', {
          p_vault_category: question.vault_category,
          p_vault_item_id: question.vault_item_id,
          p_new_tier: question.target_quality_tier,
          p_evidence: { microQuestionAnswer: userAnswer, answeredAt: new Date().toISOString() }
        });

        console.log(`[SUBMIT-MICRO] ✓ Upgraded ${question.vault_category}/${question.vault_item_id} to ${question.target_quality_tier}`);

        results.push({
          questionId,
          success: true,
          vaultCategory: question.vault_category,
          vaultItemId: question.vault_item_id,
          upgradedTo: question.target_quality_tier
        });

      } catch (upgradeError: any) {
        console.error('[SUBMIT-MICRO] Upgrade error:', upgradeError);
        results.push({ questionId, success: false, error: upgradeError.message });
      }
    }

    // Mark trigger as completed
    const { error: triggerUpdateError } = await supabase
      .from('progressive_profiling_triggers')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', triggerId);

    if (triggerUpdateError) {
      console.warn('[SUBMIT-MICRO] Could not update trigger status:', triggerUpdateError);
    }

    // Update vault progressive profiling score
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      // Fetch vault to update score
      const { data: vaultData } = await supabase
        .from('progressive_profiling_triggers')
        .select('vault_id')
        .eq('id', triggerId)
        .single();

      if (vaultData) {
        const { error: vaultUpdateError } = await supabase
          .from('career_vault')
          .update({
            total_micro_questions_answered: supabase.rpc('increment', { x: successCount }),
            last_profiling_prompt_at: new Date().toISOString()
          })
          .eq('id', vaultData.vault_id);

        if (vaultUpdateError) {
          console.warn('[SUBMIT-MICRO] Could not update vault stats:', vaultUpdateError);
        }
      }
    }

    const succeededCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`[SUBMIT-MICRO] ✅ Complete: ${succeededCount} succeeded, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: answers.length,
        succeeded: succeededCount,
        failed: failedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[SUBMIT-MICRO] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

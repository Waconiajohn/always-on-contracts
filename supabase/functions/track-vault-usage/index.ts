import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UsageEvent {
  vaultCategory: string;
  vaultItemId: string;
  action: 'used' | 'kept' | 'edited' | 'removed';
  resumeId?: string;
  jobId?: string;
  sectionName?: string;
  matchScore?: number;
  qualityTier?: 'gold' | 'silver' | 'bronze' | 'assumed';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { events, vaultId } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      throw new Error('Events array is required');
    }

    if (!vaultId) {
      throw new Error('Vault ID is required');
    }

    console.log(`[TRACK-VAULT-USAGE] Processing ${events.length} events for user ${user.id}`);

    // Process each usage event
    const results = [];
    for (const event of events as UsageEvent[]) {
      const { vaultCategory, vaultItemId, action, resumeId, jobId, sectionName, matchScore, qualityTier } = event;

      if (!vaultCategory || !vaultItemId || !action) {
        console.warn('[TRACK-VAULT-USAGE] Skipping invalid event:', event);
        continue;
      }

      // Call the database function to log usage
      const { error } = await supabase.rpc('log_vault_item_usage', {
        p_user_id: user.id,
        p_vault_id: vaultId,
        p_vault_category: vaultCategory,
        p_vault_item_id: vaultItemId,
        p_action: action,
        p_resume_id: resumeId || null,
        p_job_id: jobId || null,
        p_section_name: sectionName || null,
        p_match_score: matchScore || null,
        p_quality_tier: qualityTier || null
      });

      if (error) {
        console.error('[TRACK-VAULT-USAGE] Error logging event:', error);
        results.push({ event, success: false, error: error.message });
      } else {
        console.log(`[TRACK-VAULT-USAGE] ✓ Logged ${action} for ${vaultCategory}/${vaultItemId}`);
        results.push({ event, success: true });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`[TRACK-VAULT-USAGE] Complete: ${successCount} succeeded, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: events.length,
        succeeded: successCount,
        failed: failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[TRACK-VAULT-USAGE] Error:', error);
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

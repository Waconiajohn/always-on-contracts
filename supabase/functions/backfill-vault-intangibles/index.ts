import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    console.log('[BACKFILL-INTANGIBLES] Starting backfill for user:', user.id);

    // Get user's career vault
    const { data: vault } = await supabase
      .from('career_vault')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!vault) throw new Error('No career vault found');

    // Get all interview responses that don't have intangibles extracted yet
    const { data: responses } = await supabase
      .from('vault_interview_responses')
      .select('id, question_text, response_text, milestone_id')
      .eq('vault_id', vault.id)
      .order('created_at', { ascending: true });

    if (!responses || responses.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No responses to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BACKFILL-INTANGIBLES] Processing ${responses.length} responses...`);

    let totalExtracted = 0;
    let processedCount = 0;

    // Process responses in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < responses.length; i += batchSize) {
      const batch = responses.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (response) => {
        try {
          // Call extract-vault-intelligence for each response
          const extractResponse = await supabase.functions.invoke('extract-vault-intelligence', {
            body: {
              responseText: response.response_text,
              questionText: response.question_text,
              vaultId: vault.id,
              milestone_id: response.milestone_id
            }
          });

          if (extractResponse.data?.totalExtracted) {
            totalExtracted += extractResponse.data.totalExtracted;
            processedCount++;
          }

          console.log(`[BACKFILL-INTANGIBLES] Processed response ${response.id}: ${extractResponse.data?.totalExtracted || 0} items`);
        } catch (error) {
          console.error(`[BACKFILL-INTANGIBLES] Error processing response ${response.id}:`, error);
        }
      }));

      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < responses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Recalculate totals
    const { data: counts } = await supabase.rpc('count_vault_intelligence', { vault_id_param: vault.id });
    
    if (counts) {
      await supabase
        .from('career_vault')
        .update({
          total_power_phrases: counts.power_phrases || 0,
          total_transferable_skills: counts.transferable_skills || 0,
          total_hidden_competencies: counts.hidden_competencies || 0,
          total_soft_skills: counts.soft_skills || 0,
          total_leadership_philosophy: counts.leadership_philosophy || 0,
          total_executive_presence: counts.executive_presence || 0,
          total_personality_traits: counts.personality_traits || 0,
          total_work_style: counts.work_style || 0,
          total_values: counts.values || 0,
          total_behavioral_indicators: counts.behavioral_indicators || 0,
        })
        .eq('id', vault.id);
    }

    console.log(`[BACKFILL-INTANGIBLES] Complete! Processed ${processedCount} responses, extracted ${totalExtracted} intelligence items`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processedResponses: processedCount,
        totalExtracted,
        message: `Successfully backfilled intangibles from ${processedCount} responses`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BACKFILL-INTANGIBLES] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
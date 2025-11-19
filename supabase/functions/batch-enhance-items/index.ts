import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from "../_shared/lovable-ai-config.ts";
import { logAIUsage } from "../_shared/cost-tracking.ts";
import { extractJSON } from "../_shared/json-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, itemIds, userId } = await req.json();

    console.log(`Batch enhancing ${itemIds.length} items for vault:`, vaultId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create batch operation record for progress tracking
    const { data: batchOp, error: batchOpError } = await supabase
      .from('batch_operations')
      .insert({
        user_id: userId,
        vault_id: vaultId,
        operation_type: 'enhance',
        status: 'processing',
        total_items: itemIds.length,
        processed_items: 0,
        successful_items: 0,
        failed_items: 0
      })
      .select()
      .single();

    if (batchOpError) {
      console.error('Failed to create batch operation record:', batchOpError);
    }

    const batchOperationId = batchOp?.id;

    // Fetch all items (from all tables)
    const [
      { data: powerPhrases },
      { data: transferableSkills },
      { data: hiddenCompetencies }
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').in('id', itemIds),
      supabase.from('vault_transferable_skills').select('*').in('id', itemIds),
      supabase.from('vault_hidden_competencies').select('*').in('id', itemIds)
    ]);

    const allItems = [
      ...(powerPhrases || []).map((i: any) => ({ ...i, type: 'power_phrase', table: 'vault_power_phrases', field: 'power_phrase' })),
      ...(transferableSkills || []).map((i: any) => ({ ...i, type: 'transferable_skill', table: 'vault_transferable_skills', field: 'stated_skill' })),
      ...(hiddenCompetencies || []).map((i: any) => ({ ...i, type: 'hidden_competency', table: 'vault_hidden_competencies', field: 'competency_area' }))
    ];

    console.log(`Found ${allItems.length} items to enhance`);

    // Filter out already-gold items
    const itemsToEnhance = allItems.filter(item => (item.quality_tier || 'assumed') !== 'gold');
    console.log(`${itemsToEnhance.length} items need enhancement (${allItems.length - itemsToEnhance.length} already gold)`);

    // Enhance items in parallel batches for 5x speed improvement
    let enhanced_count = 0;
    let failed_count = 0;
    const BATCH_SIZE = 5; // Process 5 items concurrently (adjust based on rate limits)

    // Helper function with retry logic and exponential backoff
    const retryWithBackoff = async <T>(
      fn: () => Promise<T>,
      maxRetries = 3,
      baseDelay = 1000
    ): Promise<T> => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          const isLastAttempt = attempt === maxRetries - 1;
          if (isLastAttempt) throw error;

          // Exponential backoff: 1s, 2s, 4s
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`[batch-enhance-items] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw new Error('Max retries exceeded');
    };

    // Helper function to enhance a single item
    const enhanceItem = async (item: any) => {
      const currentContent = item[item.field] || '';
      const currentTier = item.quality_tier || 'assumed';

      // Determine target tier
      const tierProgression: Record<string, string> = {
        'assumed': 'bronze',
        'bronze': 'silver',
        'silver': 'gold'
      };
      const targetTier = tierProgression[currentTier];

      const systemPrompt = `Enhance career items to higher quality tiers with metrics, strategic context, and strong language. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "enhanced_content": "improved version",
  "new_tier": "gold" | "silver" | "bronze",
  "suggested_keywords": ["kw1", "kw2", "kw3"]
}`;

      const userPrompt = `Enhance this ${currentTier} tier item to ${targetTier}:
"${currentContent}"

Add metrics, strategic impact, and stronger language. Include 3 ATS keywords.`;

      // Call AI with retry logic for resilience
      const { response, metrics } = await retryWithBackoff(async () => {
        return await callLovableAI(
          {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            model: LOVABLE_AI_MODELS.PREMIUM,
            temperature: 0.7,
            max_tokens: 500,
            response_format: { type: 'json_object' }
          },
          "batch-enhance-items",
          undefined
        );
      });

      await logAIUsage(metrics);

      const rawContent = response.choices[0].message.content;
      console.log(`[batch-enhance-items] Raw AI response for item ${item.id}:`, rawContent.substring(0, 300));

      const parseResult = extractJSON(rawContent);

      if (!parseResult.success || !parseResult.data) {
        console.error(`[batch-enhance-items] Failed to parse enhancement for item ${item.id}:`, parseResult.error);
        throw new Error(`Parse failed: ${parseResult.error}`);
      }

      const enhancement = parseResult.data;

      // Validate required fields
      if (!enhancement.enhanced_content || typeof enhancement.enhanced_content !== 'string') {
        throw new Error('Missing or invalid enhanced_content');
      }
      if (!enhancement.new_tier) {
        throw new Error('Missing new_tier');
      }

      // Update the item
      await supabase
        .from(item.table)
        .update({
          [item.field]: enhancement.enhanced_content,
          quality_tier: enhancement.new_tier,
          confidence_score: 0.95,
          keywords: enhancement.suggested_keywords,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      return { success: true, itemId: item.id, newTier: enhancement.new_tier };
    };

    // Rate limiting: delay between batches to prevent API throttling
    const BATCH_DELAY_MS = 500; // 500ms delay between batches

    // Process items in parallel batches
    for (let i = 0; i < itemsToEnhance.length; i += BATCH_SIZE) {
      const batch = itemsToEnhance.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(itemsToEnhance.length / BATCH_SIZE);

      console.log(`[batch-enhance-items] Processing batch ${batchNumber}/${totalBatches} (${batch.length} items)`);

      // Process all items in this batch concurrently
      const promises = batch.map(item => enhanceItem(item));
      const results = await Promise.allSettled(promises);

      // Count successes and failures
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          enhanced_count++;
          console.log(`[batch-enhance-items] ✓ Enhanced item ${batch[idx].id} → ${result.value.newTier}`);
        } else {
          failed_count++;
          console.error(`[batch-enhance-items] ✗ Failed item ${batch[idx].id}:`, result.reason);
        }
      });

      console.log(`[batch-enhance-items] Batch ${batchNumber} complete: ${enhanced_count} enhanced, ${failed_count} failed`);

      // Update progress in database
      if (batchOperationId) {
        await supabase
          .from('batch_operations')
          .update({
            processed_items: enhanced_count + failed_count,
            successful_items: enhanced_count,
            failed_items: failed_count
          })
          .eq('id', batchOperationId);
      }

      // Rate limiting: add delay between batches (except for the last batch)
      if (batchNumber < totalBatches) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    // Mark batch operation as completed
    if (batchOperationId) {
      await supabase
        .from('batch_operations')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchOperationId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        batch_operation_id: batchOperationId,
        enhanced_count,
        failed_count,
        total_items: allItems.length,
        already_gold: allItems.length - itemsToEnhance.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in batch-enhance-items:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Batch enhancement failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

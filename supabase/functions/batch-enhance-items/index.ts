import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI } from "../_shared/lovableAI.ts";
import { logAIUsage } from "../_shared/aiUsageLogger.ts";
import { extractJSON } from "../_shared/jsonParser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, itemIds } = await req.json();

    console.log(`Batch enhancing ${itemIds.length} items for vault:`, vaultId);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    // Enhance each item
    let enhanced_count = 0;

    for (const item of allItems) {
      try {
        const currentContent = item[item.field] || '';
        const currentTier = item.quality_tier || 'assumed';

        // Skip if already gold
        if (currentTier === 'gold') continue;

        // Determine target tier
        const tierProgression: Record<string, string> = {
          'assumed': 'bronze',
          'bronze': 'silver',
          'silver': 'gold'
        };
        const targetTier = tierProgression[currentTier];

        const systemPrompt = `Enhance career items to higher quality tiers with metrics, strategic context, and strong language. Return JSON:
{
  "enhanced_content": "improved version",
  "new_tier": "gold/silver/bronze",
  "suggested_keywords": ["kw1", "kw2", "kw3"]
}`;

        const userPrompt = `Enhance this ${currentTier} tier item to ${targetTier}:
"${currentContent}"

Add metrics, strategic impact, and stronger language. Include 3 ATS keywords.`;

        const startTime = Date.now();
        const aiResponse = await callLovableAI(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          "google/gemini-2.5-pro",
          { temperature: 0.7, max_tokens: 500 }
        );

        const latencyMs = Date.now() - startTime;

        await logAIUsage({
          model: "google/gemini-2.5-pro",
          provider: "lovable",
          function_name: "batch-enhance-items",
          input_tokens: aiResponse.usage?.prompt_tokens || 0,
          output_tokens: aiResponse.usage?.completion_tokens || 0,
          execution_time_ms: latencyMs
        });

        const enhancement = extractJSON(aiResponse.choices[0].message.content);

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

        enhanced_count++;

      } catch (itemError) {
        console.error(`Error enhancing item ${item.id}:`, itemError);
        // Continue with next item
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        enhanced_count,
        total_items: allItems.length
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

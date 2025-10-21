import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate Micro-Questions for Progressive Profiling
 *
 * Analyzes vault items with low quality tiers and generates 2 targeted
 * micro-questions to upgrade them from Bronze → Silver or Silver → Gold.
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

    const { vaultId, triggerId } = await req.json();

    if (!vaultId) throw new Error('Vault ID is required');

    console.log(`[MICRO-QUESTIONS] Generating for user ${user.id}, vault ${vaultId}`);

    // Create or get trigger record
    let triggerRecord = null;
    if (triggerId) {
      const { data } = await supabase
        .from('progressive_profiling_triggers')
        .select('*')
        .eq('id', triggerId)
        .single();
      triggerRecord = data;
    } else {
      // Create new trigger
      const { data, error } = await supabase
        .from('progressive_profiling_triggers')
        .insert({
          user_id: user.id,
          vault_id: vaultId,
          trigger_type: 'applications_milestone',
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      triggerRecord = data;
    }

    // Find vault items that need upgrading (limit to 5, pick best 2)
    const categories = [
      'power_phrases',
      'transferable_skills',
      'hidden_competencies',
      'soft_skills',
      'leadership_philosophy'
    ];

    const upgradeableItems: any[] = [];

    for (const category of categories) {
      const { data } = await supabase
        .from(`vault_${category}`)
        .select('*')
        .eq('user_id', user.id)
        .in('quality_tier', ['bronze', 'assumed', 'silver'])
        .order('times_used', { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        data.forEach(item => {
          upgradeableItems.push({
            category,
            item,
            currentTier: item.quality_tier || 'assumed',
            targetTier: item.quality_tier === 'silver' ? 'gold' : 'silver'
          });
        });
      }
    }

    if (upgradeableItems.length === 0) {
      console.log('[MICRO-QUESTIONS] No upgradeable items found');
      return new Response(
        JSON.stringify({
          success: true,
          questions: [],
          message: 'No items need upgrading'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sort by times_used (prioritize frequently used items)
    upgradeableItems.sort((a, b) => (b.item.times_used || 0) - (a.item.times_used || 0));

    // Pick top 2 items
    const itemsToUpgrade = upgradeableItems.slice(0, 2);

    console.log(`[MICRO-QUESTIONS] Generating questions for ${itemsToUpgrade.length} items`);

    // Generate micro-questions using AI
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const microQuestions = [];

    for (const { category, item, currentTier, targetTier } of itemsToUpgrade) {
      const itemContent = JSON.stringify(item).substring(0, 500);

      const prompt = `You are upgrading a Career Vault item from ${currentTier} tier to ${targetTier} tier.

VAULT ITEM:
Category: ${category}
Content: ${itemContent}

Generate ONE targeted micro-question to verify and add evidence to this item.

QUESTION GUIDELINES:
- Must be answerable in < 30 seconds
- Should add quantifiable evidence (numbers, dates, specifics)
- Upgrades require EVIDENCE:
  - Bronze → Silver: Need concrete details (team size, budget, timeline, specific tools)
  - Silver → Gold: Need measurable outcomes (%, $, metrics, awards, certifications)

EXAMPLES:
- Bronze "led a team" → Silver: "How many people did you lead?"
- Silver "managed $1M budget" → Gold: "What cost savings or ROI did you achieve? (% or $)"
- Bronze "used Python" → Silver: "How many years have you used Python professionally?"
- Silver "5 years Python" → Gold: "Do you have any Python certifications or major projects built?"

Return ONLY valid JSON:
{
  "question": "How many people were on your team?",
  "questionType": "numeric",
  "hint": "Enter the number of direct reports",
  "answerOptions": null,
  "validation": {
    "min": 1,
    "max": 1000,
    "unit": "people"
  }
}

OR for multiple choice:
{
  "question": "What was the team size range?",
  "questionType": "multiple_choice",
  "hint": "Select the closest range",
  "answerOptions": [
    {"value": "1-5", "label": "1-5 people (small team)"},
    {"value": "6-15", "label": "6-15 people (medium team)"},
    {"value": "16-50", "label": "16-50 people (large team)"},
    {"value": "50+", "label": "50+ people (enterprise team)"}
  ],
  "validation": null
}`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        if (!aiResponse.ok) {
          console.error('[MICRO-QUESTIONS] AI error:', await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const questionData = JSON.parse(aiData.choices[0].message.content);

        // Insert question into database
        const { data: questionRecord, error: insertError } = await supabase
          .from('progressive_profiling_questions')
          .insert({
            trigger_id: triggerRecord.id,
            user_id: user.id,
            vault_category: category,
            vault_item_id: item.id,
            current_quality_tier: currentTier,
            target_quality_tier: targetTier,
            question_text: questionData.question,
            question_type: questionData.questionType,
            answer_options: questionData.answerOptions || null
          })
          .select()
          .single();

        if (insertError) {
          console.error('[MICRO-QUESTIONS] Insert error:', insertError);
          continue;
        }

        microQuestions.push({
          id: questionRecord.id,
          vaultCategory: category,
          vaultItemId: item.id,
          currentTier,
          targetTier,
          ...questionData
        });

        console.log(`[MICRO-QUESTIONS] ✓ Generated question for ${category}/${item.id}`);

      } catch (error) {
        console.error('[MICRO-QUESTIONS] Error generating question:', error);
      }
    }

    console.log(`[MICRO-QUESTIONS] ✅ Generated ${microQuestions.length} questions`);

    return new Response(
      JSON.stringify({
        success: true,
        triggerId: triggerRecord.id,
        questions: microQuestions,
        upgradeableItemsCount: upgradeableItems.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[MICRO-QUESTIONS] Error:', error);
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

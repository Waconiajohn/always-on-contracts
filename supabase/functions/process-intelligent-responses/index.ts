import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vaultId, responses, industryStandards } = await req.json();

    console.log('[PROCESS-RESPONSES] Processing', responses.length, 'responses for vault:', vaultId);

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use AI to convert responses into vault items
    const prompt = `
You are processing user responses to create structured career vault items.

USER RESPONSES:
${JSON.stringify(responses, null, 2)}

INDUSTRY STANDARDS FOR CONTEXT:
${JSON.stringify(industryStandards, null, 2)}

For each response, generate vault items that should be added. Return JSON:
{
  "newItems": [
    {
      "category": "power_phrases|transferable_skills|hidden_competencies|soft_skills|etc",
      "table": "vault_power_phrases|vault_transferable_skills|etc",
      "content": "Specific, quantified achievement or skill",
      "context": "Additional context",
      "confidence": "high|medium|low",
      "source": "user_qa",
      "sourceQuestionId": "q1"
    }
  ],
  "gapsClosed": [
    { "gap": "regulatory_compliance", "status": "closed|partial" }
  ],
  "impactAnalysis": {
    "itemsAdded": 12,
    "gapsClosedCount": 3,
    "strengthBoost": 15
  }
}

RULES:
- Create specific, actionable vault items
- Quantify everything possible
- One response may create multiple vault items
- Tag with high confidence since user provided it directly
`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a career data processor converting user responses into structured career intelligence. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const resultContent = aiData.choices[0]?.message?.content || '{}';
    
    let result;
    try {
      const jsonMatch = resultContent.match(/```json\n([\s\S]*?)\n```/) || 
                       resultContent.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : resultContent;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('[PROCESS-RESPONSES] Parse error:', parseError);
      result = { newItems: [], gapsClosed: [], impactAnalysis: {} };
    }

    // Store responses in database
    const responseRecords = responses.map((r: any) => ({
      vault_id: vaultId,
      question_id: r.questionId,
      question_type: r.questionType,
      question_category: r.category,
      question_text: r.question,
      user_response: r.answer,
      skipped: r.skipped || false,
      impact_score: r.impactScore || 0
    }));

    await fetch(`${supabaseUrl}/rest/v1/career_vault_intelligent_responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(responseRecords)
    });

    // Insert new vault items into appropriate tables
    const insertedItemIds: string[] = [];
    
    for (const item of result.newItems || []) {
      const tableName = item.table;
      const itemData = {
        vault_id: vaultId,
        content: item.content,
        context: item.context,
        confidence: item.confidence,
        source: 'user_qa',
        ai_generated: true,
        verified: false,
        status: 'approved'
      };

      try {
        const insertResponse = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(itemData)
        });

        if (insertResponse.ok) {
          const insertedData = await insertResponse.json();
          insertedItemIds.push(insertedData[0]?.id);
        }
      } catch (insertError) {
        console.error('[PROCESS-RESPONSES] Insert error for table', tableName, insertError);
      }
    }

    // Update vault completion status
    await fetch(`${supabaseUrl}/rest/v1/career_vault?id=eq.${vaultId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intelligent_qa_completed: true,
        vault_strength_after_qa: (result.impactAnalysis?.strengthBoost || 0) + 85
      })
    });

    console.log('[PROCESS-RESPONSES] Processed successfully. Created', insertedItemIds.length, 'new vault items');

    return new Response(
      JSON.stringify({
        success: true,
        newItemsCreated: insertedItemIds.length,
        gapsClosed: result.gapsClosed || [],
        impactAnalysis: result.impactAnalysis || {},
        itemIds: insertedItemIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PROCESS-RESPONSES] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

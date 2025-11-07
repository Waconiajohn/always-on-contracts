import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, vaultContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context-aware system prompt
    const systemPrompt = `You are a Career Vault AI Assistant, an expert career advisor helping users optimize their professional profile.

VAULT CONTEXT:
- Total Items: ${vaultContext.totalItems || 0}
- Strength Score: ${vaultContext.strengthScore || 0}/100
- Quality Distribution: Gold: ${vaultContext.qualityDistribution?.gold || 0}, Silver: ${vaultContext.qualityDistribution?.silver || 0}, Bronze: ${vaultContext.qualityDistribution?.bronze || 0}, Assumed: ${vaultContext.qualityDistribution?.assumed || 0}
- Items Needing Review: ${vaultContext.qualityDistribution?.assumedNeedingReview || 0}

AVAILABLE DATA:
${vaultContext.powerPhrases ? `- Power Phrases: ${vaultContext.powerPhrases.length} items` : ''}
${vaultContext.skills ? `- Transferable Skills: ${vaultContext.skills.length} items` : ''}
${vaultContext.competencies ? `- Hidden Competencies: ${vaultContext.competencies.length} items` : ''}

YOUR ROLE:
1. Answer questions about the user's career vault items
2. Suggest specific improvements to increase their strength score
3. Guide users through verification and quality improvement
4. Provide actionable advice based on their actual vault data
5. Help identify gaps and opportunities

GUIDELINES:
- Be specific and reference actual vault data when possible
- Focus on actionable improvements
- Keep responses concise but helpful (2-3 paragraphs max)
- When suggesting improvements, prioritize high-impact changes
- Use a supportive, professional tone

If asked about specific items, reference the data provided in the vault context.`;

    console.log('Calling Lovable AI with vault context:', { 
      totalItems: vaultContext.totalItems,
      strengthScore: vaultContext.strengthScore 
    });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Lovable AI response received');

    return new Response(
      JSON.stringify({ 
        message: data.choices[0].message.content,
        usage: data.usage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in career-vault-chat:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred processing your request' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

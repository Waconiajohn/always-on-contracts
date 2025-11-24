import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CoachRequest {
  mode: 'improve' | 'quantify' | 'star' | 'expand';
  originalText: string;
  itemId?: string;
  itemType?: string;
  positionId?: string;
  vaultId: string;
  userQuery?: string; // For 'expand' mode
  marketContext?: any; // Gap data, requirements
  positionTitle?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: CoachRequest = await req.json();
    const { mode, originalText, itemId, itemType, positionId, vaultId, userQuery, marketContext, positionTitle } = body;

    if (!mode || !originalText || !vaultId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt based on mode
    let systemPrompt = "";
    let userPrompt = "";

    switch (mode) {
      case 'improve':
        systemPrompt = `You are a senior career coach specializing in transforming weak resume bullets into compelling achievements. 
Your goal: Make the text more impactful, specific, and results-focused WITHOUT changing the core facts.

Rules:
- Keep all numerical facts accurate (if you change numbers, flag it)
- Use strong action verbs (led, architected, drove, etc.)
- Add specificity where vague
- Maintain professional tone
- Keep it concise (1-2 sentences max)`;
        userPrompt = `Improve this achievement:\n\n"${originalText}"`;
        break;

      case 'quantify':
        systemPrompt = `You are a data-driven career coach. Your specialty is helping people add metrics to vague achievements.

Your goal: Suggest specific numbers, percentages, or measurable outcomes that could apply.

Rules:
- If the original has numbers, enhance them with context (e.g., "$1M revenue" → "$1M revenue (30% YoY growth)")
- If no numbers exist, suggest realistic ranges based on the role/context
- Flag any numerical additions as "suggested - verify accuracy"
- Focus on impact metrics: time saved, money saved/earned, people managed, % improvements`;
        userPrompt = `Add quantifiable metrics to:\n\n"${originalText}"\n\nPosition: ${positionTitle || 'Not specified'}`;
        break;

      case 'star':
        systemPrompt = `You are an interview prep coach specializing in the STAR method (Situation, Task, Action, Result).

Your goal: Restructure the achievement into a clear STAR story.

Format:
- Situation: What was the context/challenge?
- Task: What was your responsibility?
- Action: What specific steps did you take?
- Result: What measurable outcome did you achieve?

Rules:
- Keep it concise (2-3 sentences total)
- Lead with impact (Result-Action-Situation if more punchy)
- Use metrics where possible`;
        userPrompt = `Convert to STAR format:\n\n"${originalText}"`;
        break;

      case 'expand':
        systemPrompt = `You are a strategic career positioning coach. You understand market dynamics, industry expectations, and how to position experience for maximum impact.

Your expertise:
- Connecting individual achievements to broader business impact
- Positioning technical work in business terms (and vice versa)
- Identifying hidden leadership/strategic elements in tactical work
- Tailoring language for specific roles/industries

Provide:
1. Strategic insight (why this matters to employers)
2. Improved text
3. Specific reasoning for changes`;
        userPrompt = `Context: ${positionTitle ? `Position: ${positionTitle}` : ''}\n\nOriginal text: "${originalText}"\n\nUser request: ${userQuery || 'Make this more strategic and impactful'}\n\n${marketContext ? `Market context: ${JSON.stringify(marketContext)}` : ''}`;
        break;
    }

    // Call Lovable AI (Gemini-3-Pro-Preview)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const suggestion = aiData.choices?.[0]?.message?.content || "";

    if (!suggestion) {
      throw new Error("No suggestion returned from AI");
    }

    // Detect "fact drift" (significant numerical changes)
    const factDriftDetected = detectFactDrift(originalText, suggestion);
    const factDriftDetails = factDriftDetected ? extractNumberChanges(originalText, suggestion) : null;

    // Save to coaching history
    await supabaseClient.from('vault_ai_coaching_history').insert({
      vault_id: vaultId,
      user_id: user.id,
      item_id: itemId,
      item_type: itemType,
      position_id: positionId,
      coaching_type: mode,
      original_text: originalText,
      suggested_text: suggestion,
      user_action: 'pending',
      fact_drift_detected: factDriftDetected,
      fact_drift_details: factDriftDetails
    });

    // For 'expand' mode, parse strategy/reasoning if AI provided it
    let strategy = "";
    let reasoning = "";
    if (mode === 'expand') {
      const lines = suggestion.split('\n');
      const strategyLine = lines.find((l: string) => l.toLowerCase().includes('strategy:'));
      const reasoningLine = lines.find((l: string) => l.toLowerCase().includes('reasoning:'));
      
      if (strategyLine) strategy = strategyLine.replace(/strategy:/i, '').trim();
      if (reasoningLine) reasoning = reasoningLine.replace(/reasoning:/i, '').trim();
    }

    return new Response(JSON.stringify({
      suggestion,
      strategy: strategy || undefined,
      reasoning: reasoning || undefined,
      factDriftDetected,
      factDriftDetails
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("AI Coach error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper: Detect significant numerical changes
function detectFactDrift(original: string, suggestion: string): boolean {
  const originalNumbers = extractNumbers(original);
  const suggestedNumbers = extractNumbers(suggestion);

  // If AI added numbers where none existed, flag it
  if (originalNumbers.length === 0 && suggestedNumbers.length > 0) {
    return true;
  }

  // If any number changed by >20%, flag it
  for (const origNum of originalNumbers) {
    const match = suggestedNumbers.find(sugNum => {
      const diff = Math.abs(sugNum - origNum) / origNum;
      return diff > 0.2; // 20% change threshold
    });
    if (match) return true;
  }

  return false;
}

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/g);
  if (!matches) return [];
  return matches.map(m => parseFloat(m.replace(/,/g, '')));
}

function extractNumberChanges(original: string, suggestion: string): any {
  return {
    original: extractNumbers(original),
    suggested: extractNumbers(suggestion),
    warning: "Verify these numerical changes are accurate"
  };
}

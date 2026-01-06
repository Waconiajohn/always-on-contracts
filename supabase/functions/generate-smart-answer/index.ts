import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const startTime = Date.now();
  const logger = createLogger('generate-smart-answer');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error('[generate-smart-answer] Auth error:', userError);
      throw new Error("Unauthorized");
    }

    const { 
      requirement, 
      category, 
      explanation, 
      vaultMatches,
      jobContext,
      generateAlternatives = true
    } = await req.json();

    logger.info('Generating smart answer', { 
      requirement: requirement?.substring(0, 50), 
      category, 
      generateAlternatives 
    });

    // Build vault evidence context
    const vaultContext = vaultMatches?.slice(0, 5).map((m: any) => {
      const content = m.content || m;
      return `• ${content.stated_skill || content.skill || content.text || ''}: ${content.evidence || content.description || ''}`.substring(0, 250);
    }).join('\n') || 'No vault data available';

    const systemPrompt = `You are an expert executive resume writer and career strategist. Generate a compelling, evidence-based resume bullet point that addresses the job requirement. Return valid JSON only.`;

    const userPrompt = `Create an AI-powered suggestion for this job requirement.

REQUIREMENT: ${requirement}
CATEGORY: ${category} (highlyQualified = strong match, partiallyQualified = partial match, experienceGaps = gap)
CONTEXT: ${explanation || 'N/A'}
JOB: ${jobContext?.title || 'Unknown Role'} at ${jobContext?.company || 'Unknown Company'}

USER'S CAREER VAULT EVIDENCE:
${vaultContext}

Generate a smart answer suggestion with:
1. A compelling resume bullet that addresses this requirement
2. Clear reasoning why this works for the candidate
3. A confidence score (0.0-1.0) based on evidence strength
4. List of resume evidence points used
${generateAlternatives ? '5. 3 alternative phrasings with different strategic approaches' : ''}

For the confidence score:
- 0.8-1.0: Strong evidence directly supports the requirement
- 0.6-0.79: Moderate evidence with some inference
- 0.4-0.59: Limited evidence, relies on transferable skills
- Below 0.4: Gap-filling with strategic framing

Return JSON:
{
  "suggestedAnswer": "Led cross-functional team of 12 to deliver $2.3M enterprise platform...",
  "reasoning": "Your vault shows strong team leadership and enterprise experience...",
  "confidenceScore": 0.85,
  "resumeEvidence": [
    "Led 8-person engineering team (from vault)",
    "Delivered enterprise projects (from vault)"
  ]${generateAlternatives ? `,
  "alternatives": [
    {
      "text": "Alternative bullet focusing on different angle...",
      "style": "Impact-Focused",
      "strengths": "Emphasizes measurable outcomes",
      "bestFor": "Data-driven companies"
    },
    {
      "text": "Second alternative with different framing...",
      "style": "Leadership-Centric",
      "strengths": "Highlights team building and mentorship",
      "bestFor": "Growth-stage companies"
    },
    {
      "text": "Third alternative emphasizing technical depth...",
      "style": "Technical Expert",
      "strengths": "Shows hands-on expertise",
      "bestFor": "Engineering-first organizations"
    }
  ]` : ''}
}`;

    const { response, metrics } = await retryWithBackoff(
      async () => await callLovableAI(
        {
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' }
        },
        'generate-smart-answer',
        user.id
      ),
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    logger.info('Raw AI response received', { length: content.length });
    
    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const extracted = extractJSON(content);
      if (extracted.success) {
        result = extracted.data;
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    // Ensure required fields exist
    if (!result.suggestedAnswer) {
      throw new Error('Invalid response: missing suggestedAnswer');
    }

    // Normalize the response
    const normalizedResult = {
      suggestedAnswer: result.suggestedAnswer,
      reasoning: result.reasoning || 'Based on your career vault evidence.',
      confidenceScore: Math.min(1, Math.max(0, result.confidenceScore || 0.7)),
      resumeEvidence: Array.isArray(result.resumeEvidence) ? result.resumeEvidence : [],
      alternatives: Array.isArray(result.alternatives) ? result.alternatives : []
    };

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    return new Response(JSON.stringify(normalizedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error('Request failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      latencyMs: Date.now() - startTime
    });

    const errorResponse = handlePerplexityError(error);
    return new Response(
      JSON.stringify(errorResponse),
      {
        status: errorResponse.statusCode,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

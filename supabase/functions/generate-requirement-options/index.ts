import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { extractJSON } from '../_shared/json-parser.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  const startTime = Date.now();
  const logger = createLogger('generate-requirement-options');

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { requirement, vaultMatches, answers, voiceContext, jobContext, matchStatus } = await req.json();

    console.log("Generating options for:", { requirement, matchStatus, hasVoiceContext: !!voiceContext });

    // Determine number of options based on complexity
    let numOptions = 3;
    if (matchStatus === 'perfect_match') {
      numOptions = 2; // Simple case
    } else if (matchStatus === 'complete_gap' || Object.keys(answers || {}).length > 3) {
      numOptions = 4; // Complex case
    }

    // Build vault context
    const vaultContext = vaultMatches?.slice(0, 5).map((m: any) => {
      const content = m.content || m;
      return `- ${content.stated_skill || content.skill || content.text || ''}: ${content.evidence || content.description || ''}`.substring(0, 200);
    }).join('\n') || 'No vault data';

    const prompt = `You are a professional resume writer creating ACTUAL RESUME BULLETS (not advice or coaching suggestions).

CRITICAL: Output must be copy-paste ready resume content using action verbs, metrics, and outcomes. DO NOT write coaching like "Highlight X" or "Emphasize Y".

REQUIREMENT: ${requirement}
MATCH STATUS: ${matchStatus}
JOB: ${jobContext?.title || 'Unknown'} (${jobContext?.seniority || 'mid'} level)

USER'S ACTUAL EXPERIENCE:
${vaultContext}

USER'S CLARIFICATIONS:
${answers ? JSON.stringify(answers) : 'None'}
${voiceContext ? `VOICE NOTES: ${voiceContext}` : ''}

Create ${numOptions} DIFFERENT resume bullet point options addressing this requirement. Each must:
1. Start with strong action verb (Led, Architected, Drove, Optimized, Implemented)
2. Include specific context and scope
3. Show measurable outcomes where possible (%, $, timeframes)
4. Use different strategic framings:
   - Aggregate approach (combine multiple experiences)
   - Range with peak example ("5-10 projects, including...")
   - Career trajectory (growth over time)
   - Specific high-impact example
5. Be 1-2 lines maximum (40-60 words)
6. Use ATS keywords naturally

RULES:
- Write ACTUAL bullets ready to paste into a resume
- NO phrases like "Highlight", "Demonstrate", "Showcase", "Emphasize"
- Use ONLY information from vault/answers (or industry standards if no data)
- Each option must feel substantively different

Return JSON:
{
  "options": [
    {
      "content": "• Led cross-functional team of 8 engineers to deliver...",
      "approach": "Aggregate Approach - combines 3 vault items",
      "reasoning": "Shows breadth and leadership",
      "keywords": ["team", "delivery", "engineering"],
      "strength": "Demonstrates scale",
      "consideration": "Less specific on individual projects"
    }
  ]
}`;

    const { response, metrics } = await retryWithBackoff(
      async () => await callPerplexity(
        {
          messages: [{ role: "user", content: prompt }],
          model: selectOptimalModel({
            taskType: 'generation',
            complexity: 'medium',
            requiresReasoning: true
          }),
        },
        'generate-requirement-options',
        user.id
      ),
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const result = extractJSON(content, GenericAIResponseSchema);

    if (!result.success) {
      logger.error('JSON parsing failed', { 
        error: result.error,
        content: content.substring(0, 500)
      });
      throw new Error(`Invalid AI response: ${result.error}`);
    }

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    return new Response(JSON.stringify(result.data), {
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

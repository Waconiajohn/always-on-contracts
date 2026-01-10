/**
 * Dispute Gap - Re-evaluate a requirement with user-provided evidence
 * Allows users to say "I actually have this skill" and provide proof
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      requirementId,
      requirementText, 
      originalCategory,
      originalGapExplanation,
      userEvidence,
      jobDescription 
    } = await req.json();

    console.log('🔍 Re-evaluating requirement with user evidence:', requirementId);

    const prompt = `You are a senior hiring manager re-evaluating a candidate based on NEW EVIDENCE they've provided.

ORIGINAL ASSESSMENT:
- Requirement: ${requirementText}
- Category: ${originalCategory}
- Gap Explanation: ${originalGapExplanation || 'Not specified'}

THE CANDIDATE SAYS:
"${userEvidence}"

JOB CONTEXT:
${jobDescription?.substring(0, 1500) || 'Not provided'}

INSTRUCTIONS:
1. Carefully evaluate the candidate's new evidence
2. Determine if this evidence changes their qualification status
3. Be fair but maintain high standards - vague claims without specifics should not upgrade status
4. If they provide specific examples, metrics, or clear demonstrations, consider upgrading

Return a JSON object:
{
  "newCategory": "HIGHLY QUALIFIED" | "PARTIALLY QUALIFIED" | "EXPERIENCE GAP",
  "categoryChanged": true | false,
  "reasoning": "2-3 sentence explanation of your decision",
  "newWhyQualified": "If upgraded, explain why they now qualify",
  "newGapExplanation": "If still a gap, explain what's still missing",
  "suggestedBullet": "A resume bullet incorporating their new evidence",
  "confidenceLevel": "high" | "moderate" | "low",
  "followUpQuestion": "Optional: If more info would help, ask a clarifying question"
}`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.PREMIUM, // GPT-5 for nuanced evaluation
      temperature: 0.3, // Lower temp for consistent evaluation
      max_tokens: 800,
    }, 'dispute-gap', undefined);

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices?.[0]?.message?.content || '').trim();

    if (!content) {
      throw new Error('AI returned empty response');
    }

    // Parse the JSON response
    let parsedResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      // Fallback
      parsedResult = {
        newCategory: originalCategory,
        categoryChanged: false,
        reasoning: content,
        confidenceLevel: 'low'
      };
    }

    console.log('✅ Re-evaluation complete:', parsedResult.categoryChanged ? 'UPGRADED' : 'UNCHANGED');

    return new Response(
      JSON.stringify({ 
        success: true, 
        requirementId,
        ...parsedResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in dispute-gap:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

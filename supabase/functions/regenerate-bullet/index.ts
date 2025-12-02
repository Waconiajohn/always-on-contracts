/**
 * Regenerate Single Bullet Point
 * Takes an existing bullet and regenerates it with different wording
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
    const { bulletId, sectionType, jobDescription, currentText } = await req.json();

    console.log('🔄 Regenerating bullet', { bulletId, sectionType });

    const prompt = `You are an elite resume writer. Regenerate this resume bullet point with fresh wording while keeping the core achievement.

SECTION TYPE: ${sectionType}
CURRENT BULLET: ${currentText}

JOB CONTEXT:
${jobDescription.substring(0, 1000)}

INSTRUCTIONS:
- Keep the same core achievement/responsibility
- Use different action verbs and phrasing
- Maintain professional tone
- Include quantifiable metrics if present
- Optimize for ATS keywords from the job description
- Keep it concise (1-2 lines)

Return ONLY the new bullet point text, no JSON, no formatting.`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.7,
      max_tokens: 200,
    }, 'regenerate-bullet', undefined);

    await logAIUsage(metrics);

    const newText = cleanCitations(response.choices?.[0]?.message?.content || '').trim();

    if (!newText) {
      throw new Error('AI returned empty response');
    }

    console.log('✅ Bullet regenerated successfully');

    return new Response(
      JSON.stringify({ success: true, newText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in regenerate-bullet:', error);
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

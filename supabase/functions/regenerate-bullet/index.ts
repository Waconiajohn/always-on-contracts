/**
 * Regenerate/Refine Single Bullet Point
 * Supports multiple action types: strengthen, add_metrics, regenerate
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ActionType = 'strengthen' | 'add_metrics' | 'regenerate';

function getPromptForAction(action: ActionType, currentText: string, jobDescription: string, requirementText?: string): string {
  const jobContext = jobDescription.substring(0, 1500);
  
  const baseContext = `CURRENT BULLET:
${currentText}

JOB CONTEXT:
${jobContext}

${requirementText ? `REQUIREMENT BEING ADDRESSED:\n${requirementText}\n` : ''}`;

  switch (action) {
    case 'strengthen':
      return `You are an elite resume writer. Make this bullet more powerful and impactful.

${baseContext}

INSTRUCTIONS:
- Replace weak verbs with strong, powerful action verbs (Led, Spearheaded, Orchestrated, Transformed)
- Add specific scope (team size, project scale, budget if reasonable to infer)
- Make the accomplishment more impressive without fabricating
- Focus on leadership, initiative, and business impact
- Keep it to 1-2 lines maximum

Respond in JSON format:
{"improvedBullet": "the improved bullet text", "changes": "brief description of what was improved"}`;

    case 'add_metrics':
      return `You are an elite resume writer. Add quantifiable metrics and measurable outcomes to this bullet.

${baseContext}

INSTRUCTIONS:
- Add specific numbers: percentages, dollar amounts, time saved, team sizes
- Include measurable outcomes: revenue impact, efficiency gains, cost reduction
- If exact numbers aren't available, use reasonable professional estimates (e.g., "20+ team members", "~40% improvement")
- Make the impact concrete and quantifiable
- Keep it to 1-2 lines maximum

Respond in JSON format:
{"improvedBullet": "the bullet with metrics added", "changes": "brief description of metrics added"}`;

    case 'regenerate':
    default:
      return `You are an elite resume writer. Completely rewrite this bullet with fresh, compelling language.

${baseContext}

INSTRUCTIONS:
- Start with a completely different action verb
- Restructure the sentence for maximum impact
- Include scope/metrics where reasonable
- Make it ATS-optimized for this specific job
- Keep the core accomplishment but present it more impressively
- Keep it to 1-2 lines maximum

Respond in JSON format:
{"improvedBullet": "the completely rewritten bullet", "changes": "brief description of what was changed"}`;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      bulletId, 
      sectionType, 
      jobDescription, 
      currentText, 
      requirementText,
      action = 'regenerate' // Default to regenerate for backwards compatibility
    } = await req.json();

    console.log('🔄 Refining bullet', { bulletId, sectionType, action });

    const prompt = getPromptForAction(action as ActionType, currentText, jobDescription, requirementText);

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.PREMIUM,
      temperature: 0.7,
      max_tokens: 400,
    }, 'regenerate-bullet', undefined);

    await logAIUsage(metrics);

    const rawContent = cleanCitations(response.choices?.[0]?.message?.content || '').trim();

    if (!rawContent) {
      throw new Error('AI returned empty response');
    }

    // Parse JSON response
    let result: { improvedBullet: string; changes: string };
    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: treat entire response as the bullet
        result = { improvedBullet: rawContent, changes: 'Improved bullet' };
      }
    } catch {
      // If JSON parsing fails, use the raw text
      result = { improvedBullet: rawContent, changes: 'Improved bullet' };
    }

    console.log('✅ Bullet refined successfully', { action, changes: result.changes });

    return new Response(
      JSON.stringify({ 
        success: true, 
        newText: result.improvedBullet,
        improvedBullet: result.improvedBullet,
        changes: result.changes
      }),
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

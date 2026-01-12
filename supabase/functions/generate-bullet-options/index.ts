/**
 * Generate Multiple Bullet Options
 * Returns 3 distinct bullet variations for a requirement
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
    // Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      requirementText, 
      currentBullet, 
      jobDescription, 
      evidenceContext,
      gapExplanation,
      bridgingStrategy 
    } = await req.json();

    console.log('🔄 Generating 3 bullet options for requirement');

    const prompt = `You are an elite executive resume writer with 20+ years of experience placing C-suite and VP-level candidates.

REQUIREMENT TO ADDRESS:
${requirementText}

CURRENT BULLET (if any):
${currentBullet || 'None provided'}

${gapExplanation ? `GAP IDENTIFIED:\n${gapExplanation}\n` : ''}
${bridgingStrategy ? `BRIDGING STRATEGY:\n${bridgingStrategy}\n` : ''}
${evidenceContext ? `SUPPORTING EVIDENCE:\n${evidenceContext}\n` : ''}

JOB CONTEXT:
${jobDescription?.substring(0, 2000) || 'Not provided'}

INSTRUCTIONS:
Generate exactly 3 DISTINCT bullet point options, each with a different strategic angle:

Option A - METRICS-FOCUSED: Lead with quantifiable impact, numbers, percentages, dollar amounts
Option B - SCOPE-FOCUSED: Emphasize breadth of responsibility, team size, geographic reach, stakeholders
Option C - NARRATIVE-FOCUSED: Tell a compelling story of challenge → action → transformation

Each bullet must:
- Be 1-2 lines maximum (under 25 words ideal)
- Start with a powerful action verb
- Directly address the job requirement
- Be ATS-optimized with relevant keywords
- Sound like it came from an actual human executive, not AI

Return a JSON object with this exact structure:
{
  "options": [
    {
      "id": "A",
      "label": "Metrics-Focused",
      "bullet": "The bullet text here",
      "emphasis": "Brief explanation of what makes this option strong"
    },
    {
      "id": "B", 
      "label": "Scope-Focused",
      "bullet": "The bullet text here",
      "emphasis": "Brief explanation of what makes this option strong"
    },
    {
      "id": "C",
      "label": "Narrative-Focused", 
      "bullet": "The bullet text here",
      "emphasis": "Brief explanation of what makes this option strong"
    }
  ]
}`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.PREMIUM, // GPT-5 for highest quality
      temperature: 0.7,
      max_tokens: 1000,
    }, 'generate-bullet-options', undefined);

    await logAIUsage(metrics);

    const content = cleanCitations(response.choices?.[0]?.message?.content || '').trim();

    if (!content) {
      throw new Error('AI returned empty response');
    }

    // Parse the JSON response
    let parsedOptions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedOptions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      // Fallback: create options from text
      parsedOptions = {
        options: [
          { id: 'A', label: 'Metrics-Focused', bullet: content.split('\n')[0] || content, emphasis: 'Primary option' },
          { id: 'B', label: 'Scope-Focused', bullet: content.split('\n')[1] || content, emphasis: 'Alternative angle' },
          { id: 'C', label: 'Narrative-Focused', bullet: content.split('\n')[2] || content, emphasis: 'Story-driven' }
        ]
      };
    }

    console.log('✅ Generated 3 bullet options successfully');

    return new Response(
      JSON.stringify({ success: true, ...parsedOptions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in generate-bullet-options:', error);
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

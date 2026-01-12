/**
 * Micro-Edit Bullet - Targeted bullet point enhancements
 * Handles specific edit types: more-executive, shorter, more-impact, align-jd, signature-win, add-metrics, add-scope, add-stakeholders
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS, cleanCitations } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EditType = 
  | 'more-executive' 
  | 'shorter' 
  | 'more-impact' 
  | 'align-jd' 
  | 'signature-win' 
  | 'add-metrics' 
  | 'add-scope' 
  | 'add-stakeholders'
  | 'add-outcome';

interface MicroEditRequest {
  bulletText: string;
  editType: EditType;
  jobDescription?: string;
  requirementContext?: string;
  roleLevel?: string;
}

const EDIT_INSTRUCTIONS: Record<EditType, string> = {
  'more-executive': `Rewrite to sound more executive-level:
    - Use strategic language (spearheaded, orchestrated, championed, architected)
    - Emphasize business outcomes over tactical execution
    - Show enterprise-scale thinking and cross-functional leadership
    - Remove junior-sounding language`,
  
  'shorter': `Make this bullet more concise while preserving impact:
    - Remove redundant words and filler
    - Aim for 1-2 impactful lines maximum
    - Keep the core achievement and metric
    - Use power verbs`,
  
  'more-impact': `Amplify the impact and impressiveness:
    - Lead with the biggest outcome
    - Quantify wherever possible
    - Show ripple effects (team growth, revenue, efficiency)
    - Make it memorable and compelling`,
  
  'align-jd': `Rewrite to better align with the job description:
    - Use exact keywords and phrases from the JD
    - Mirror the language and priorities
    - Emphasize relevant skills and outcomes
    - Make ATS optimization obvious`,
  
  'signature-win': `Transform into a "signature win" statement:
    - Lead with a bold outcome/number
    - Show innovation or first-of-its-kind achievement
    - Include enterprise context (scope, scale, complexity)
    - Make it quotable for an interview`,
  
  'add-metrics': `Add specific, believable metrics:
    - Include percentages, dollar amounts, or headcount
    - Use placeholder format [X%] or [~$X] if unsure
    - Add timeframe context (quarterly, annual)
    - Make numbers feel authentic for this level`,
  
  'add-scope': `Add scope and scale details:
    - Include team sizes, budget ranges, geographic reach
    - Add business unit or enterprise context
    - Show complexity (multi-stakeholder, cross-functional)
    - Use placeholder [X people] if unsure`,
  
  'add-stakeholders': `Add stakeholder and leadership context:
    - Include who you influenced (C-suite, board, clients)
    - Show cross-functional collaboration
    - Add organizational reach
    - Emphasize executive presence`,
  
  'add-outcome': `Add clear business outcome:
    - Show the "so what" - the business result
    - Connect action to revenue, efficiency, or growth
    - Include downstream effects
    - Make ROI obvious`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { bulletText, editType, jobDescription, requirementContext, roleLevel } = await req.json() as MicroEditRequest;

    if (!bulletText || !editType) {
      return new Response(
        JSON.stringify({ error: 'bulletText and editType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✏️ Micro-editing bullet:', { editType, bulletLength: bulletText.length });

    const editInstruction = EDIT_INSTRUCTIONS[editType] || EDIT_INSTRUCTIONS['more-impact'];
    
    const prompt = `You are an elite executive resume writer. Apply the following edit to this resume bullet.

CURRENT BULLET:
${bulletText}

EDIT TYPE: ${editType.toUpperCase()}

SPECIFIC INSTRUCTIONS:
${editInstruction}

${requirementContext ? `JOB REQUIREMENT CONTEXT:\n${requirementContext}\n` : ''}
${jobDescription ? `JOB DESCRIPTION EXCERPT:\n${jobDescription.substring(0, 1000)}\n` : ''}
${roleLevel ? `ROLE LEVEL: ${roleLevel}\n` : ''}

RULES:
- Apply ONLY the specific edit requested
- Maintain truthfulness - use placeholders like [X%] or [~$X] for unknown metrics
- Keep executive tone throughout
- Output only the revised bullet text, no explanation
- Maximum 2 lines

REVISED BULLET:`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.6,
      max_tokens: 400,
    }, 'micro-edit-bullet', undefined);

    await logAIUsage(metrics);

    const editedBullet = cleanCitations(response.choices?.[0]?.message?.content || '').trim();

    if (!editedBullet) {
      throw new Error('AI returned empty response');
    }

    console.log('✅ Bullet micro-edited successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        editedBullet,
        editType,
        originalBullet: bulletText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in micro-edit-bullet:', error);
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

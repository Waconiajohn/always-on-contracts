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
      bridgingStrategy,
      sectionType, // 'experience' | 'summary' | 'skills'
      targetTone, // 'executive' | 'technical' | 'creative'
      industryContext
    } = await req.json();

    // Determine strategic angles based on section type
    const getStrategicAngles = () => {
      if (sectionType === 'summary') {
        return {
          A: { label: 'Value-Driven', instruction: 'Lead with the unique value proposition and career impact' },
          B: { label: 'Achievement-Focused', instruction: 'Emphasize quantified career achievements and milestones' },
          C: { label: 'Vision-Oriented', instruction: 'Focus on leadership philosophy and future direction' }
        };
      }
      if (sectionType === 'skills') {
        return {
          A: { label: 'Expertise-Level', instruction: 'Group by proficiency level (Expert, Advanced, Proficient)' },
          B: { label: 'Category-Based', instruction: 'Organize by functional area (Technical, Leadership, Tools)' },
          C: { label: 'Impact-Driven', instruction: 'Lead with skills that drove the biggest outcomes' }
        };
      }
      // Default for experience bullets
      return {
        A: { label: 'Metrics-Focused', instruction: 'Lead with quantifiable impact, numbers, percentages, dollar amounts' },
        B: { label: 'Scope-Focused', instruction: 'Emphasize breadth of responsibility, team size, geographic reach' },
        C: { label: 'Narrative-Focused', instruction: 'Tell a compelling story of challenge → action → transformation' }
      };
    };

    const angles = getStrategicAngles();
    const toneGuidance = targetTone === 'executive' 
      ? 'Use C-suite language with strategic focus'
      : targetTone === 'technical'
      ? 'Include specific technologies and methodologies'
      : 'Balance professionalism with authentic voice';

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

TONE GUIDANCE: ${toneGuidance}
${industryContext ? `INDUSTRY CONTEXT: ${industryContext}` : ''}

INSTRUCTIONS:
Generate exactly 3 DISTINCT ${sectionType || 'bullet point'} options, each with a different strategic angle:

Option A - ${angles.A.label.toUpperCase()}: ${angles.A.instruction}
Option B - ${angles.B.label.toUpperCase()}: ${angles.B.instruction}
Option C - ${angles.C.label.toUpperCase()}: ${angles.C.instruction}

Each option must:
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
      "label": "${angles.A.label}",
      "bullet": "The bullet text here",
      "emphasis": "Brief explanation of what makes this option strong",
      "keywordsUsed": ["keyword1", "keyword2"]
    },
    {
      "id": "B", 
      "label": "${angles.B.label}",
      "bullet": "The bullet text here",
      "emphasis": "Brief explanation of what makes this option strong",
      "keywordsUsed": ["keyword1", "keyword2"]
    },
    {
      "id": "C",
      "label": "${angles.C.label}", 
      "bullet": "The bullet text here",
      "emphasis": "Brief explanation of what makes this option strong",
      "keywordsUsed": ["keyword1", "keyword2"]
    }
  ],
  "recommendation": "Which option is best for this specific requirement and why"
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

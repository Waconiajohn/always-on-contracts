/**
 * AI Rewrite Bullet
 * Intelligently rewrites resume bullets with before/after improvements
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
      originalBullet, 
      requirementText, 
      jobDescription,
      mode = 'quick' // 'quick' or 'deep'
    } = await req.json();

    if (!originalBullet) {
      throw new Error('Original bullet is required');
    }

    console.log(`🔄 AI Rewriting bullet (${mode} mode)`);

    const quickPrompt = `You are an expert resume editor. Polish this bullet point for maximum impact.

ORIGINAL BULLET:
${originalBullet}

${requirementText ? `TARGET REQUIREMENT:\n${requirementText}\n` : ''}
${jobDescription ? `JOB CONTEXT:\n${jobDescription.substring(0, 1000)}\n` : ''}

INSTRUCTIONS:
1. Improve clarity and impact without changing core meaning
2. Strengthen the action verb if weak
3. Add or emphasize metrics if implied
4. Ensure ATS-friendly keywords from the job are present
5. Keep it concise (max 2 lines)

Return ONLY valid JSON in this exact format:
{
  "rewrittenBullet": "The improved bullet text",
  "improvements": ["Stronger verb", "Added metrics", "Keyword alignment"]
}`;

    const deepPrompt = `You are an elite executive resume writer. Completely rewrite this bullet with a fresh strategic angle.

ORIGINAL BULLET:
${originalBullet}

${requirementText ? `TARGET REQUIREMENT:\n${requirementText}\n` : ''}
${jobDescription ? `JOB CONTEXT:\n${jobDescription.substring(0, 1500)}\n` : ''}

INSTRUCTIONS:
1. Reframe the achievement with a completely new angle
2. Lead with measurable business impact
3. Use executive-level language and power verbs
4. Directly address the job requirement
5. Make it memorable and specific
6. Keep it to 1-2 impactful lines

The rewrite should feel like a different (better) bullet, not just a polish.

Return ONLY valid JSON in this exact format:
{
  "rewrittenBullet": "The completely rewritten bullet",
  "improvements": ["New strategic angle", "Executive framing", "Direct requirement match", "Quantified impact"]
}`;

    const prompt = mode === 'deep' ? deepPrompt : quickPrompt;
    // Use MINI instead of PREMIUM for faster, more reliable responses
    const model = mode === 'deep' ? LOVABLE_AI_MODELS.MINI : LOVABLE_AI_MODELS.DEFAULT;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }, 'ai-rewrite-bullet', undefined);

    await logAIUsage(metrics);

    // Debug log the response structure
    console.log('[ai-rewrite-bullet] Response check:', {
      hasContent: !!response.choices?.[0]?.message?.content,
      contentLength: response.choices?.[0]?.message?.content?.length,
    });

    const rawContent = response.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      console.error('[ai-rewrite-bullet] Empty content, full response:', JSON.stringify(response.choices?.[0]));
      throw new Error('AI returned empty response');
    }

    const content = cleanCitations(rawContent).trim();

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
      // Fallback: use the content as the bullet
      parsedResult = {
        rewrittenBullet: content.replace(/^["']|["']$/g, ''),
        improvements: ['Enhanced clarity', 'Improved impact']
      };
    }

    // Validate we have the required field
    if (!parsedResult.rewrittenBullet) {
      parsedResult.rewrittenBullet = content;
    }

    console.log('✅ Bullet rewritten successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        rewrittenBullet: parsedResult.rewrittenBullet,
        improvements: parsedResult.improvements || [],
        mode,
        originalBullet
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in ai-rewrite-bullet:', error);
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

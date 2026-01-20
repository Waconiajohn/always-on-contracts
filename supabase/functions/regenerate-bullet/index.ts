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

type ActionType = 'strengthen' | 'add_metrics' | 'regenerate' | 'polish' | 'add_keywords' | 'modernize';

function getPromptForAction(action: ActionType, currentText: string, jobDescription: string, sectionType: string, requirementText?: string): string {
  const jobContext = jobDescription.substring(0, 1500);
  const isSummary = sectionType === 'summary';
  const sectionLabel = isSummary ? 'SUMMARY' : 'BULLET';
  
  const baseContext = `CURRENT ${sectionLabel}:
${currentText}

JOB CONTEXT:
${jobContext}

${requirementText ? `REQUIREMENT BEING ADDRESSED:\n${requirementText}\n` : ''}`;

  // Summary-specific actions
  if (isSummary) {
    switch (action) {
      case 'polish':
        return `You are an elite executive resume writer. Polish this professional summary for impact and clarity.

${baseContext}

INSTRUCTIONS:
- Refine the wording for maximum executive presence
- Ensure it flows smoothly and sounds natural
- Remove any redundancy or filler words
- Make every word count
- Keep the same length (3-4 sentences)
- Maintain professional, confident tone

Respond in JSON format:
{"improvedBullet": "the polished summary", "changes": "brief description of refinements"}`;

      case 'add_keywords':
        return `You are an elite executive resume writer. Enhance this summary with job-specific keywords.

${baseContext}

INSTRUCTIONS:
- Identify the top 5-7 keywords from the job description
- Naturally weave them into the summary
- Don't keyword-stuff - keep it readable and professional
- Ensure the summary aligns with the target role's language
- Keep it to 3-4 sentences

Respond in JSON format:
{"improvedBullet": "the keyword-enhanced summary", "changes": "keywords added: [list them]"}`;

      case 'modernize':
        return `You are an elite executive resume writer. Modernize this summary with current industry language.

${baseContext}

INSTRUCTIONS:
- Update dated terminology to current industry standards
- Use modern business language and frameworks
- Add contemporary leadership concepts where appropriate
- Make it sound current and forward-thinking
- Keep it to 3-4 sentences

Respond in JSON format:
{"improvedBullet": "the modernized summary", "changes": "brief description of updates"}`;

      case 'regenerate':
      default:
        return `You are an elite executive resume writer. Completely rewrite this professional summary.

${baseContext}

INSTRUCTIONS:
- Create a fresh, compelling executive summary
- Lead with your strongest value proposition
- Include scope of leadership (team sizes, budgets, P&L if inferable)
- Align language with the target job description
- Keep it to 3-4 sentences maximum
- Sound human, not AI-generated

Respond in JSON format:
{"improvedBullet": "the rewritten summary", "changes": "brief description of changes"}`;
    }
  }

  // Bullet-specific actions (original behavior)
  switch (action) {
    case 'strengthen':
    case 'polish':
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
    case 'add_keywords':
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

    case 'modernize':
      return `You are an elite resume writer. Modernize this bullet with current industry language.

${baseContext}

INSTRUCTIONS:
- Update dated terminology to current industry standards
- Use modern action verbs and business language
- Add contemporary frameworks or methodologies if relevant
- Make it sound current and forward-thinking
- Keep it to 1-2 lines maximum

Respond in JSON format:
{"improvedBullet": "the modernized bullet", "changes": "brief description of updates"}`;

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

    const prompt = getPromptForAction(action as ActionType, currentText, jobDescription, sectionType, requirementText);

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.PREMIUM,
      temperature: 0.7,
      max_tokens: 400,
    }, 'regenerate-bullet', undefined);

    await logAIUsage(metrics);

    // Extract content from response - handle different response formats
    const choice = response.choices?.[0];
    let rawContent = '';
    
    // Try standard content first
    if (choice?.message?.content) {
      rawContent = choice.message.content;
    }
    // Check for tool_calls response format (sometimes GPT-5 uses this)
    else if (choice?.message?.tool_calls?.[0]?.function?.arguments) {
      rawContent = choice.message.tool_calls[0].function.arguments;
    }
    // Check if there's any text we can salvage
    else if (typeof choice?.message === 'string') {
      rawContent = choice.message;
    }
    
    rawContent = cleanCitations(rawContent).trim();

    if (!rawContent) {
      console.error('Empty AI response. Full response:', JSON.stringify(response, null, 2));
      throw new Error('AI returned empty response. Please try again.');
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
    
    // Validate result has the required field
    if (!result.improvedBullet || result.improvedBullet.trim() === '') {
      throw new Error('AI generated empty bullet. Please try again.');
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

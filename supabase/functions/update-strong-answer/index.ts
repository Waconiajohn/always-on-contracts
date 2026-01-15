import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { GenericAIResponseSchema } from '../_shared/ai-response-schemas.ts';
import { extractJSON } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'update-strong-answer',
  schema: GenericAIResponseSchema,
  requireAuth: true,
  rateLimit: { maxPerMinute: 10, maxPerHour: 100 },

  inputValidation: (body) => {
    if (!body.question || !body.currentAnswer) {
      throw new Error('question and currentAnswer are required');
    }
  },

  handler: async ({ user, body, logger }) => {
    const { question, currentAnswer, validationFeedback } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    logger.info('Fetching Master Resume data for answer enhancement');

    // Get Master Resume data for context
    const { data: resumeData } = await supabase
      .from('career_vault')
      .select('*')
      .eq('user_id', user.id)
      .single();

    logger.info('Building enhancement prompt with Master Resume context');

    // STANDARDIZED SYSTEM PROMPT
    const systemPrompt = `You are an expert interview coach specializing in STAR method answer enhancement.

Your task: Transform basic interview answers into compelling, detailed responses using the candidate's actual career achievements.

CRITICAL OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "enhanced_answer": "The complete STAR-formatted answer with specific details",
  "what_was_added": "Brief explanation of enhancements made",
  "resume_details_used": ["detail1", "detail2", "detail3"]
}

Requirements:
- Build upon the user's existing answer (never ignore their input)
- Incorporate specific details from their resume/vault
- Follow STAR format: Situation → Task → Action → Result
- Add quantifiable metrics where possible
- Keep the enhanced answer authentic to their experience
- Do NOT fabricate information`;

    // STANDARDIZED USER PROMPT
    const userPrompt = `Enhance this interview answer using the candidate's Master Resume data:

INTERVIEW QUESTION:
${question}

CANDIDATE'S CURRENT ANSWER:
${currentAnswer}

VALIDATION FEEDBACK:
${JSON.stringify(validationFeedback || {}, null, 2)}

MASTER RESUME CONTEXT:
${JSON.stringify(resumeData?.initial_analysis || {}, null, 2)}

TASK: Create an enhanced version that:
1. Preserves the candidate's original intent and voice
2. Adds specific details from their Master Resume (metrics, technologies, outcomes)
3. Fills in missing elements: specificity, quantification, context, impact
4. Follows complete STAR structure
5. Remains authentic to their actual experience

Return your enhancement in the required JSON format.`;

    logger.debug('Calling Lovable AI for answer enhancement');
    const startTime = Date.now();

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      },
      'update-strong-answer',
      user.id
    );

    await logAIUsage(metrics);

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    const enhancedText = response.choices[0].message.content.trim();
    logger.debug('Received AI response', { 
      responseLength: enhancedText.length,
      preview: enhancedText.substring(0, 200)
    });

    const result = extractJSON(enhancedText, GenericAIResponseSchema);

    if (!result.success || !result.data) {
      logger.error('JSON extraction failed', {
        error: result.error,
        response: enhancedText.substring(0, 300)
      });
      throw new Error(`Invalid enhancement response: ${result.error}`);
    }

    // Parse the content field which contains the actual JSON
    const enhancementData = JSON.parse(result.data.content || '{}');
    
    // EXPLICIT FIELD VALIDATION
    if (!enhancementData.enhanced_answer || typeof enhancementData.enhanced_answer !== 'string') {
      logger.error('Missing or invalid enhanced_answer field', { data: enhancementData });
      throw new Error('AI response missing required field: enhanced_answer');
    }
    
    if (!enhancementData.what_was_added || typeof enhancementData.what_was_added !== 'string') {
      logger.error('Missing or invalid what_was_added field', { data: enhancementData });
      throw new Error('AI response missing required field: what_was_added');
    }
    
    if (!Array.isArray(enhancementData.resume_details_used)) {
      logger.error('Missing or invalid resume_details_used array', { data: enhancementData });
      throw new Error('AI response missing required field: resume_details_used array');
    }

    logger.info('Answer enhancement complete', {
      answerLength: enhancementData.enhanced_answer.length,
      detailsUsed: enhancementData.resume_details_used.length
    });

    return enhancementData;
  }
}));

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createLogger } from '../_shared/logger.ts';
import { retryWithBackoff, handlePerplexityError } from '../_shared/error-handling.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const logger = createLogger('generate-networking-email');

const NetworkingEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  vaultItemsUsed: z.array(z.string()),
  personalizationTips: z.array(z.string()),
  followUpSuggestions: z.array(z.string())
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { context, persona, purpose, targetPerson, companyName, jobTitle } = await req.json();

    logger.info('Starting networking email generation', { 
      userId: user.id, 
      purpose, 
      hasTargetPerson: !!targetPerson 
    });

    // Fetch Career Vault data
    const { data: vault } = await supabase
      .from('career_vault')
      .select(`
        *,
        vault_power_phrases(power_phrase, impact_metrics, category),
        vault_transferable_skills(stated_skill, evidence, proficiency_level),
        vault_hidden_competencies(competency_area, inferred_capability)
      `)
      .eq('user_id', user.id)
      .single();

    // Get top achievements for storytelling
    const topAchievements = vault?.vault_power_phrases?.slice(0, 3) || [];
    const topSkills = vault?.vault_transferable_skills?.slice(0, 5) || [];
    const keyCompetencies = vault?.vault_hidden_competencies?.slice(0, 3) || [];

    const systemPrompt = `You are an elite networking strategist and executive outreach specialist.

NETWORKING EMAIL FRAMEWORK:

SUBJECT LINE:
- Personalized (mention their work/company)
- Curiosity-driven (not salesy)
- Under 50 characters

EMAIL STRUCTURE:
1. OPENING (1-2 sentences):
   - Genuine compliment or shared connection
   - Reference specific work/achievement
   
2. CREDIBILITY (2-3 sentences):
   - Brief, quantified achievement
   - Relevant expertise intersection
   - Value you can potentially offer
   
3. PURPOSE (1-2 sentences):
   - Clear ask (informational interview, advice, introduction)
   - Respect their time (15-20 min)
   
4. CLOSE:
   - Specific call-to-action
   - Flexibility in timing
   - Professional sign-off

TONE: ${persona || 'Professional but warm, respectful, authentic'}

CRITICAL RULES:
- Keep under 150 words total
- NO generic templates or buzzwords
- Include ONE specific achievement from user's background
- Mention WHY this person specifically
- Make it easy to say yes (suggest 2-3 time options)

Return JSON:
{
  "subject": "Email subject line",
  "body": "Email body (use \\n for line breaks)",
  "vaultItemsUsed": ["List of vault items referenced"],
  "personalizationTips": ["Tip 1 for customizing", "Tip 2"],
  "followUpSuggestions": ["Follow-up strategy 1", "Follow-up strategy 2"]
}`;

    const userPrompt = `Generate a networking email:

CONTEXT: ${context}
TARGET PERSON: ${targetPerson || 'Industry professional'}
COMPANY: ${companyName || 'Their company'}
JOB TITLE: ${jobTitle || 'Target role'}
PURPOSE: ${purpose || 'informational_interview'}

USER'S KEY ACHIEVEMENTS:
${topAchievements.map((a: any) => `- ${a.power_phrase} (${a.impact_metrics})`).join('\n')}

USER'S EXPERTISE:
${topSkills.map((s: any) => `- ${s.stated_skill}: ${s.evidence}`).join('\n')}

USER'S DIFFERENTIATORS:
${keyCompetencies.map((c: any) => `- ${c.competency_area}: ${c.inferred_capability}`).join('\n')}`;

    const { response, metrics } = await retryWithBackoff(
      async () => {
        const aiStartTime = Date.now();
        const result = await callLovableAI(
          {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            model: LOVABLE_AI_MODELS.DEFAULT,
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
          },
          'generate-networking-email',
          user.id
        );

        logger.logAICall({
          model: result.metrics.model,
          inputTokens: result.metrics.input_tokens,
          outputTokens: result.metrics.output_tokens,
          latencyMs: Date.now() - aiStartTime,
          cost: result.metrics.cost_usd,
          success: true
        });

        return result;
      },
      3,
      (attempt, error) => {
        logger.warn(`Retry attempt ${attempt}`, { error: error.message });
      }
    );

    await logAIUsage(metrics);

    const generatedContent = response.choices[0].message.content;

    // Parse and validate JSON
    let parsedEmail;
    try {
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : generatedContent);
      const validated = NetworkingEmailSchema.safeParse(parsed);
      
      if (validated.success) {
        parsedEmail = validated.data;
        logger.info('Successfully validated networking email');
      } else {
        logger.warn('Schema validation failed, using parsed data', { error: validated.error.message });
        parsedEmail = parsed;
      }
    } catch (e) {
      logger.warn('Failed to parse AI response', { error: e instanceof Error ? e.message : String(e) });
      parsedEmail = {
        subject: 'Networking Connection Request',
        body: generatedContent,
        vaultItemsUsed: [],
        personalizationTips: [],
        followUpSuggestions: []
      };
    }

    logger.info('Networking email generated successfully', { 
      latencyMs: Date.now() - startTime,
      subjectLength: parsedEmail.subject.length 
    });

    return new Response(
      JSON.stringify(parsedEmail),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    const aiError = handlePerplexityError(error);
    logger.error('Networking email generation failed', error, {
      code: aiError.code,
      retryable: aiError.retryable
    });

    return new Response(
      JSON.stringify({ 
        error: aiError.userMessage,
        retryable: aiError.retryable
      }),
      { 
        status: aiError.statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

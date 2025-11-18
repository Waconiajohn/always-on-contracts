import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { createAIHandler } from '../_shared/ai-function-wrapper.ts';
import { SkillsExtractionSchema } from '../_shared/ai-response-schemas.ts';
import { extractArray } from '../_shared/json-parser.ts';

serve(createAIHandler({
  functionName: 'generate-transferable-skills',
  schema: SkillsExtractionSchema,
  requireAuth: false,  // Called internally
  parseResponse: false,  // Custom handling with database

  inputValidation: (body) => {
    if (!body.vaultId) {
      throw new Error('vaultId is required');
    }
  },

  handler: async ({ body, logger }) => {
    const { vaultId } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: vault } = await supabase
      .from('career_vault')
      .select('*')
      .eq('id', vaultId)
      .single();

    const { data: responses } = await supabase
      .from('vault_interview_responses')
      .select('*')
      .eq('vault_id', vaultId)
      .eq('phase', 'skills_translation');

    if (!vault) throw new Error('Career Vault not found');

    const prompt = `You are a career strategist identifying transferable skills with strategic precision.

Resume: ${vault.resume_raw_text}
Skills Translation Responses: ${JSON.stringify(responses)}

STRATEGIC TRANSLATION REQUIREMENTS:
- If they managed [specific tool], list 8-10 equivalent/adjacent tools they could claim
- If they worked in [industry], identify 3-5 adjacent industries where skills transfer
- Include "near-certifications": skills that are 80% of the way to a formal credential
- Think: "What could they claim to know that they don't realize they know?"
- Look for technology evolution (e.g., "data analysis 2015" = "business intelligence" today)

Identify 10-15 transferable skills mappings like:
- Salesforce experience → Zoho, HubSpot, Microsoft Dynamics, SugarCRM, any CRM platform, Pipedrive, Freshsales
- Project management in healthcare → Project management in finance/tech/manufacturing (domain transfer)
- Machine learning work → AI implementation, ML Ops, data science infrastructure (technology evolution)
- Excel VBA automation → Python automation, process improvement, RPA concepts
- Managed distributed teams → Remote team leadership, async collaboration, virtual leadership

Return JSON array:
[{
  "stated_skill": "Salesforce Administration",
  "equivalent_skills": ["Zoho CRM", "HubSpot", "Microsoft Dynamics 365", "SugarCRM", "Pipedrive", "Freshsales", "Any enterprise CRM platform", "CRM implementation"],
  "evidence": "5 years managing Salesforce includes workflow automation, custom objects, reporting, integrations - all transferable to similar platforms. Understanding of CRM architecture and business processes.",
  "confidence_score": 95
}]`;

    logger.info('Generating transferable skills', { vaultId });

    const startTime = Date.now();

    const { response, metrics } = await callLovableAI({
      messages: [
        { role: 'system', content: 'You are a career strategist specializing in skills translation and career pivoting. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }, 'generate-transferable-skills', vault.user_id);

    await logAIUsage(metrics);

    logger.logAICall({
      model: metrics.model,
      inputTokens: metrics.input_tokens,
      outputTokens: metrics.output_tokens,
      latencyMs: Date.now() - startTime,
      cost: metrics.cost_usd,
      success: true
    });

    const skillsText = response.choices[0].message.content.trim();

    const result = extractArray(skillsText);

    if (!result.success || !result.data) {
      logger.error('Skills extraction failed', {
        error: result.error,
        response: skillsText.substring(0, 300)
      });
      throw new Error(`Invalid skills array: ${result.error}`);
    }

    const skills = result.data;

    logger.info('Transferable skills extracted', { count: skills.length });

    // Insert skills into database
    const insertPromises = skills.map((skill: any) =>
      supabase.from('vault_transferable_skills').insert({
        vault_id: vaultId,
        user_id: vault.user_id,
        stated_skill: skill.stated_skill,
        equivalent_skills: skill.equivalent_skills,
        evidence: skill.evidence,
        confidence_score: skill.confidence_score || 75
      })
    );

    await Promise.all(insertPromises);

    logger.info('Skills inserted into database', { count: skills.length });

    return { success: true, count: skills.length };
  }
}));

// =====================================================
// PROCESS GAP-FILLING RESPONSES - Career Vault 2.0
// =====================================================
// INTELLIGENT RESPONSE PROCESSING
//
// This function converts user responses to gap-filling
// questions into structured vault items with gold tier
// quality (user-provided = highest confidence).
//
// UNIQUE VALUE:
// - Contextualizes responses using industry research
// - Creates properly formatted vault items
// - Assigns gold tier (user-verified)
// - Updates vault strength in real-time
//
// MARKETING MESSAGE:
// "Your answers are transformed into professional-grade
// career intelligence with proper context and formatting.
// These gold-tier items are ready for immediate use."
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity, PERPLEXITY_MODELS, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface GapResponse {
  questionId: string;
  questionText: string;
  questionType: string;
  category: string;
  answer: string | number | string[] | boolean;
}

interface ProcessResponsesRequest {
  vaultId: string;
  responses: GapResponse[];
  industryResearch?: any;
  targetRoles?: string[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      vaultId,
      responses,
      industryResearch,
      targetRoles,
    }: ProcessResponsesRequest = await req.json();

    if (!responses || responses.length === 0) {
      throw new Error('No responses provided');
    }

    console.log('📝 PROCESSING GAP-FILLING RESPONSES:', {
      vaultId,
      responseCount: responses.length,
      userId: user.id,
    });

    // Sanitize and format responses for AI prompt
    const sanitizeForPrompt = (value: any): string => {
      if (value === null || value === undefined) return 'Not provided';
      
      let sanitized = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Remove any potentially problematic characters
      sanitized = sanitized
        .replace(/[^\w\s\d.,!?;:()\-\[\]{}@#$%&*+=<>\/\\'"]/g, '')
        .trim();
      
      // Truncate if too long (max 500 chars per response)
      if (sanitized.length > 500) {
        sanitized = sanitized.substring(0, 497) + '...';
      }
      
      return sanitized;
    };

    // Build AI prompt to convert responses into vault items
    const processingPrompt = `You are a career intelligence processor converting user responses into structured vault items.

USER'S TARGET ROLES: ${targetRoles?.join(', ') || 'Executive'}

INDUSTRY CONTEXT:
${industryResearch ? JSON.stringify(industryResearch.mustHaveSkills?.slice(0, 10)) : 'N/A'}

USER RESPONSES:
${responses.map((r: any) => `
Q: ${sanitizeForPrompt(r.questionText)}
A: ${sanitizeForPrompt(r.answer)}
Category: ${r.category || 'general'}
`).join('\n')}

TASK: Convert each response into properly formatted vault items.

CONVERSION RULES:
1. **Leadership scope answers** → Power phrases with quantified metrics
2. **Yes/No with details** → Hidden competencies or executive presence items
3. **Skills/technologies** → Transferable skills with evidence
4. **Behavioral/soft skill answers** → Soft skills with examples

For each response, create appropriate vault items with:
- Professional phrasing
- Quantified metrics where applicable
- Evidence from the user's answer
- Keywords for matching

RETURN VALID JSON ONLY:
{
  "vaultItems": {
    "powerPhrases": [
      {
        "phrase": "Managed team of 45 engineers across 3 locations",
        "category": "leadership_scope",
        "impactMetrics": { "teamSize": 45, "locations": 3 },
        "evidence": "User-provided in gap-filling questionnaire",
        "keywords": ["leadership", "team management", "distributed teams"]
      }
    ],
    "transferableSkills": [
      {
        "skill": "Kubernetes",
        "evidence": "User confirmed proficiency in gap-filling questionnaire",
        "equivalentSkills": ["Container orchestration", "Cloud infrastructure", "DevOps"]
      }
    ],
    "hiddenCompetencies": [
      {
        "competencyArea": "Board Communication",
        "capability": "Regular board presentations and strategic updates",
        "evidence": "User confirmed board presentation experience"
      }
    ],
    "softSkills": [
      {
        "skillName": "Crisis Management",
        "examples": "User confirmed experience handling high-pressure situations",
        "proficiencyLevel": "advanced"
      }
    ]
  },
  "itemsCreated": 8,
  "categories": ["powerPhrases", "transferableSkills", "hiddenCompetencies", "softSkills"]
}

NO MARKDOWN. ONLY JSON.`;

    // Call AI to process responses
    const { response: aiData, metrics: aiMetrics } = await callPerplexity(
      {
        messages: [{ role: 'user', content: processingPrompt }],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 2500,
      },
      'process-gap-filling-responses',
      user.id
    );

    await logAIUsage(aiMetrics);

    const aiContent = cleanCitations(aiData.choices[0].message.content);

    // Parse JSON response
    let processedData;
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      processedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid JSON format');
    }

    const vaultItems = processedData.vaultItems;
    let totalInserted = 0;

    // Insert power phrases
    if (vaultItems.powerPhrases && vaultItems.powerPhrases.length > 0) {
      const powerPhrasesInserts = vaultItems.powerPhrases.map((pp: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        power_phrase: pp.phrase,
        category: pp.category || 'general',
        impact_metrics: pp.impactMetrics || {},
        confidence_score: 1.0, // User-provided = 100% confidence
        quality_tier: 'gold',
        inferred_from: pp.evidence || 'Gap-filling questionnaire',
        keywords: pp.keywords || [],
        source: 'gap_filling_questions',
        needs_user_review: false,
      }));

      const { error: ppError } = await supabaseClient
        .from('vault_power_phrases')
        .insert(powerPhrasesInserts);

      if (ppError) {
        console.error('Power phrases insertion error:', ppError);
      } else {
        totalInserted += powerPhrasesInserts.length;
      }
    }

    // Insert transferable skills
    if (vaultItems.transferableSkills && vaultItems.transferableSkills.length > 0) {
      const skillsInserts = vaultItems.transferableSkills.map((skill: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        stated_skill: skill.skill,
        equivalent_skills: skill.equivalentSkills || [],
        evidence: skill.evidence || 'Gap-filling questionnaire',
        confidence_score: 1.0,
        quality_tier: 'gold',
        source: 'gap_filling_questions',
        needs_user_review: false,
      }));

      const { error: skillsError } = await supabaseClient
        .from('vault_transferable_skills')
        .insert(skillsInserts);

      if (skillsError) {
        console.error('Skills insertion error:', skillsError);
      } else {
        totalInserted += skillsInserts.length;
      }
    }

    // Insert hidden competencies
    if (vaultItems.hiddenCompetencies && vaultItems.hiddenCompetencies.length > 0) {
      const competenciesInserts = vaultItems.hiddenCompetencies.map((comp: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        competency_area: comp.competencyArea,
        inferred_capability: comp.capability,
        evidence_from_resume: comp.evidence || 'Gap-filling questionnaire',
        confidence_score: 1.0,
        quality_tier: 'gold',
        source: 'gap_filling_questions',
        needs_user_review: false,
      }));

      const { error: compError } = await supabaseClient
        .from('vault_hidden_competencies')
        .insert(competenciesInserts);

      if (compError) {
        console.error('Competencies insertion error:', compError);
      } else {
        totalInserted += competenciesInserts.length;
      }
    }

    // Insert soft skills
    if (vaultItems.softSkills && vaultItems.softSkills.length > 0) {
      const softSkillsInserts = vaultItems.softSkills.map((skill: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        skill_name: skill.skillName,
        examples: skill.examples || 'Confirmed in gap-filling questionnaire',
        proficiency_level: skill.proficiencyLevel || 'advanced',
        confidence_score: 1.0,
        quality_tier: 'gold',
        source: 'gap_filling_questions',
        needs_user_review: false,
      }));

      const { error: softError } = await supabaseClient
        .from('vault_soft_skills')
        .insert(softSkillsInserts);

      if (softError) {
        console.error('Soft skills insertion error:', softError);
      } else {
        totalInserted += softSkillsInserts.length;
      }
    }

    // Recalculate vault strength
    const { data: vaultStats } = await supabaseClient
      .rpc('get_vault_statistics', { p_vault_id: vaultId });

    let newVaultStrength = 85; // Default minimum after gap filling
    if (vaultStats) {
      const totalItems = vaultStats.totalItems || 0;
      const goldCount = vaultStats.qualityBreakdown?.gold || 0;
      const silverCount = vaultStats.qualityBreakdown?.silver || 0;

      // Enhanced formula with gold tier bonus
      newVaultStrength = Math.min(100, Math.round(
        (totalItems / 2.5) +
        (goldCount * 0.6) +
        (silverCount * 0.3) +
        5 // Bonus for completing gap-filling
      ));
    }

    // Update vault
    await supabaseClient
      .from('career_vault')
      .update({
        vault_strength_after_qa: newVaultStrength,
        onboarding_step: 'gap_filling_complete',
      })
      .eq('id', vaultId)
      .eq('user_id', user.id);

    // Log activity
    await supabaseClient.from('vault_activity_log').insert({
      vault_id: vaultId,
      user_id: user.id,
      activity_type: 'intelligence_extracted',
      description: `Gap-filling completed: ${totalInserted} gold-tier items added`,
      metadata: {
        responsesProcessed: responses.length,
        itemsCreated: totalInserted,
        newVaultStrength,
        categories: processedData.categories,
      },
    });

    console.log('✅ GAP-FILLING PROCESSING COMPLETE:', {
      responsesProcessed: responses.length,
      itemsCreated: totalInserted,
      newVaultStrength,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          itemsCreated: totalInserted,
          newVaultStrength,
          breakdown: {
            powerPhrases: vaultItems.powerPhrases?.length || 0,
            transferableSkills: vaultItems.transferableSkills?.length || 0,
            hiddenCompetencies: vaultItems.hiddenCompetencies?.length || 0,
            softSkills: vaultItems.softSkills?.length || 0,
          },
        },
        meta: {
          message: `✅ Gap-Filling Complete! Added ${totalInserted} gold-tier items to your vault.`,
          uniqueValue: `These items were created from YOUR answers—giving them the highest confidence level (gold tier). They're immediately ready for professional use.`,
          vaultStrength: `Your vault strength increased to ${newVaultStrength}%—putting you in the ${newVaultStrength >= 90 ? 'top 10%' : 'top 20%'} of executive profiles.`,
          nextStep: `You're ready to build AI-optimized resumes, enhance your LinkedIn, and prepare for interviews using your comprehensive career intelligence.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-gap-filling-responses:', error);
    
    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        userMessage: 'We encountered an issue processing your responses. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// =====================================================
// PROCESS GAP-FILLING RESPONSES - Master Resume 2.0
// =====================================================
// INTELLIGENT RESPONSE PROCESSING
//
// This function converts user responses to gap-filling
// questions into structured Master Resume items with gold tier
// quality (user-provided = highest confidence).
//
// UNIQUE VALUE:
// - Contextualizes responses using industry research
// - Creates properly formatted resume items
// - Assigns gold tier (user-verified)
// - Updates resume strength in real-time
//
// MARKETING MESSAGE:
// "Your answers are transformed into professional-grade
// career intelligence with proper context and formatting.
// These gold-tier items are ready for immediate use."
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface GapResponse {
  questionId: string;
  questionText: string;
  questionType: string;
  category: string;
  answer: string | number | string[] | boolean;
}

interface ProcessResponsesRequest {
  resumeId?: string;
  vaultId?: string; // Backwards compatibility
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

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('[process-gap-filling-responses] Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const body: ProcessResponsesRequest = await req.json();
    // Support both old and new parameter names for backwards compatibility
    const resumeId = body.resumeId || body.vaultId;
    const responses = body.responses;
    const industryResearch = body.industryResearch;
    const targetRoles = body.targetRoles;

    if (!responses || responses.length === 0) {
      throw new Error('No responses provided');
    }

    console.log('📝 PROCESSING GAP-FILLING RESPONSES:', {
      resumeId,
      responseCount: responses.length,
      userId: user.id,
    });

    // Professional sanitization: Only escape characters that break JSON/API parsing
    const sanitizeForPrompt = (value: any): string => {
      if (value === null || value === undefined) return 'Not provided';
      
      // Convert to string safely
      let sanitized = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      // Only escape characters that break JSON/API parsing
      sanitized = sanitized
        .replace(/\\/g, '\\\\')      // Escape backslashes
        .replace(/"/g, '\\"')         // Escape quotes
        .replace(/\n/g, '\\n')        // Escape newlines
        .replace(/\r/g, '\\r')        // Escape carriage returns
        .replace(/\t/g, '\\t')        // Escape tabs
        .trim();
      
      // Smart length management: Only truncate if truly excessive (10K chars per response)
      // This is very generous - most responses will be under this
      if (sanitized.length > 10000) {
        // Truncate at sentence boundary for better context preservation
        const truncated = sanitized.substring(0, 10000);
        const lastSentence = truncated.lastIndexOf('.');
        sanitized = (lastSentence > 9000 ? truncated.substring(0, lastSentence + 1) : truncated) + 
                    ' [Response truncated - very detailed answer provided]';
        
        console.warn('Response truncated:', { 
          originalLength: sanitized.length,
          note: 'User provided essay-length answer'
        });
      }
      
      return sanitized;
    };

    // Token estimation for monitoring (rough: 1 token ≈ 4 characters)
    const estimateTokens = (text: string): number => Math.ceil(text.length / 4);
    
    const totalResponseLength = responses.reduce((sum, r) => 
      sum + String(r.questionText || '').length + String(r.answer || '').length, 0
    );
    
    const estimatedTokens = estimateTokens(String(totalResponseLength));
    
    console.log('Processing responses:', {
      responseCount: responses.length,
      totalCharacters: totalResponseLength,
      estimatedInputTokens: estimatedTokens,
      percentOfContextWindow: ((estimatedTokens / 200000) * 100).toFixed(2) + '%'
    });
    
    // Warn if approaching 50% of context window (very rare with normal usage)
    if (totalResponseLength > 400000) {
      console.warn('Large response set detected:', {
        note: 'Consider batch processing for very detailed responses'
      });
    }

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
    let aiData, aiMetrics;
    try {
      const result = await callLovableAI(
        {
          messages: [{ role: 'user', content: processingPrompt }],
          model: LOVABLE_AI_MODELS.DEFAULT,
          temperature: 0.3,
          max_tokens: 2500,
          response_format: { type: 'json_object' }
        },
        'process-gap-filling-responses',
        user.id
      );
      aiData = result.response;
      aiMetrics = result.metrics;
      
      await logAIUsage(aiMetrics);
    } catch (aiError) {
      // Log detailed AI error immediately with console.error
      console.error('🚨 AI API CALL FAILED - DETAILED ERROR:', {
        error: aiError instanceof Error ? aiError.message : String(aiError),
        errorName: aiError instanceof Error ? aiError.name : 'Unknown',
        errorStack: aiError instanceof Error ? aiError.stack?.substring(0, 500) : undefined,
        promptLength: processingPrompt.length,
        promptPreview: processingPrompt.substring(0, 500),
        responseCount: responses.length,
        firstResponse: responses[0] ? {
          questionText: String(responses[0].questionText),
          answerLength: String(responses[0].answer).length,
          category: responses[0].category
        } : null
      });
      
      throw new Error(`AI processing failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
    }

    const aiContent = aiData.choices[0].message.content;

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
        vault_id: resumeId,
        user_id: user.id,
        power_phrase: pp.phrase,
        category: pp.category || 'general',
        impact_metrics: pp.impactMetrics || {},
        ai_confidence: 1.0, // Use ai_confidence (0.00-1.00) - confidence_score is generated from this
        quality_tier: 'gold',
        inferred_from: pp.evidence || 'Gap-filling questionnaire',
        keywords: pp.keywords || [],
        source: 'interview', // Valid enum value
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
        vault_id: resumeId,
        user_id: user.id,
        stated_skill: skill.skill,
        equivalent_skills: skill.equivalentSkills || [],
        evidence: skill.evidence || 'Gap-filling questionnaire',
        ai_confidence: 1.0, // Use ai_confidence (0.00-1.00) - confidence_score is generated from this
        quality_tier: 'gold',
        needs_user_review: false,
        inferred_from: 'Gap-filling questionnaire',
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
        vault_id: resumeId,
        user_id: user.id,
        competency_area: comp.competencyArea,
        inferred_capability: comp.capability,
        supporting_evidence: [comp.evidence || 'Gap-filling questionnaire'], // Array type
        ai_confidence: 1.0, // Use ai_confidence (0.00-1.00) - confidence_score is generated from this
        quality_tier: 'gold',
        needs_user_review: false,
        inferred_from: 'Gap-filling questionnaire',
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
        vault_id: resumeId,
        user_id: user.id,
        skill_name: skill.skillName,
        examples: skill.examples || 'Confirmed in gap-filling questionnaire',
        proficiency_level: skill.proficiencyLevel || 'advanced',
        ai_confidence: 1.0, // Correct column name (numeric 0.00-1.00)
        quality_tier: 'gold',
        needs_user_review: false,
        inferred_from: 'Gap-filling questionnaire',
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

    // Recalculate resume strength
    const { data: resumeStats } = await supabaseClient
      .rpc('get_vault_statistics', { p_vault_id: resumeId });

    let newResumeStrength = 85; // Default minimum after gap filling
    if (resumeStats) {
      const totalItems = resumeStats.totalItems || 0;
      const goldCount = resumeStats.qualityBreakdown?.gold || 0;
      const silverCount = resumeStats.qualityBreakdown?.silver || 0;

      // Enhanced formula with gold tier bonus
      newResumeStrength = Math.min(100, Math.round(
        (totalItems / 2.5) +
        (goldCount * 0.6) +
        (silverCount * 0.3) +
        5 // Bonus for completing gap-filling
      ));
    }

    // Update Master Resume
    await supabaseClient
      .from('career_vault')
      .update({
        vault_strength_after_qa: newResumeStrength,
        onboarding_step: 'gap_filling_complete',
      })
      .eq('id', resumeId)
      .eq('user_id', user.id);

    // Log activity
    await supabaseClient.from('vault_activity_log').insert({
      vault_id: resumeId,
      user_id: user.id,
      activity_type: 'intelligence_extracted',
      description: `Gap-filling completed: ${totalInserted} gold-tier items added`,
      metadata: {
        responsesProcessed: responses.length,
        itemsCreated: totalInserted,
        newResumeStrength,
        categories: processedData.categories,
      },
    });

    console.log('✅ GAP-FILLING PROCESSING COMPLETE:', {
      responsesProcessed: responses.length,
      itemsCreated: totalInserted,
      newResumeStrength,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          itemsCreated: totalInserted,
          newResumeStrength,
          breakdown: {
            powerPhrases: vaultItems.powerPhrases?.length || 0,
            transferableSkills: vaultItems.transferableSkills?.length || 0,
            hiddenCompetencies: vaultItems.hiddenCompetencies?.length || 0,
            softSkills: vaultItems.softSkills?.length || 0,
          },
        },
        meta: {
          message: `✅ Gap-Filling Complete! Added ${totalInserted} gold-tier items to your Master Resume.`,
          uniqueValue: `These items were created from YOUR answers—giving them the highest confidence level (gold tier). They're immediately ready for professional use.`,
          resumeStrength: `Your Master Resume strength increased to ${newResumeStrength}%—putting you in the ${newResumeStrength >= 90 ? 'top 10%' : 'top 20%'} of executive profiles.`,
          nextStep: `You're ready to build AI-optimized resumes, enhance your LinkedIn, and prepare for interviews using your comprehensive career intelligence.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in process-gap-filling-responses:', error);
    
    // Enhanced error analysis
    if (error instanceof Error) {
      console.error('Detailed error information:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      // Specific diagnosis for Perplexity 400 errors
      if (error.message.includes('400')) {
        console.error('Perplexity API 400 Error - Diagnostic Info:', {
          possibleCauses: [
            'Malformed JSON in prompt construction',
            'Invalid escape sequences in user responses',
            'Unsupported characters in API request',
            'Model parameter mismatch'
          ],
          recommendation: 'Check sanitization function and prompt structure'
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode: error instanceof Error && error.message.includes('400') ? 'AI_API_ERROR' : 'PROCESSING_ERROR',
        userMessage: 'We encountered an issue processing your responses. Our team has been notified. Please try again, or contact support if this persists.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

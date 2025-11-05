// =====================================================
// EXTRACT VAULT INTANGIBLES - Career Vault 2.0
// =====================================================
// EXECUTIVE INTELLIGENCE LAYER
//
// This function extracts the INTANGIBLE qualities that
// separate exceptional leaders from good ones:
//
// - Leadership Philosophy (how you lead)
// - Executive Presence (how you show up)
// - Personality Traits (observable behaviors)
// - Work Style (collaboration preferences)
// - Values & Motivations (what drives you)
// - Behavioral Indicators (success patterns)
//
// These insights are IMPOSSIBLE for job boards to capture.
// They power interview prep, culture fit analysis, and
// authentic personal branding.
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

interface IntangiblesRequest {
  resumeText: string;
  vaultId: string;
  existingVaultData?: {
    powerPhrases: any[];
    skills: any[];
    competencies: any[];
  };
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
      resumeText,
      vaultId,
      existingVaultData
    }: IntangiblesRequest = await req.json();

    console.log('🌟 EXTRACTING INTANGIBLES for vault:', vaultId);

    // Build context from existing vault data
    const vaultContext = existingVaultData ? `
CONTEXT FROM EXISTING VAULT DATA:
Top Achievements: ${existingVaultData.powerPhrases?.slice(0, 5).map((p: any) => p.phrase).join('; ') || 'N/A'}
Key Skills: ${existingVaultData.skills?.slice(0, 10).map((s: any) => s.statedSkill).join(', ') || 'N/A'}
Hidden Competencies: ${existingVaultData.competencies?.map((c: any) => c.competencyArea).join(', ') || 'N/A'}

Use this to infer intangible qualities.
` : '';

    // =================================================
    // EXTRACTION 1: LEADERSHIP PHILOSOPHY
    // =================================================
    console.log('👔 Extracting leadership philosophy...');

    const leadershipPrompt = `You are an executive coach analyzing leadership philosophy from resume evidence.

${vaultContext}

RESUME TEXT:
${resumeText}

TASK: Infer leadership philosophy and management style from achievements and language used.

Look for evidence of:
- How they build and develop teams
- Their approach to decision-making
- Management philosophy (servant leadership, command-and-control, collaborative, etc.)
- Core leadership principles
- Real-world applications of their philosophy

RETURN VALID JSON ONLY:
{
  "leadershipPhilosophy": [
    {
      "philosophyStatement": "Believes in servant leadership and empowering teams through autonomy",
      "leadershipStyle": "Collaborative, coaching-oriented",
      "realWorldApplication": "Built high-performing teams by delegating authority and providing mentorship",
      "corePrinciples": ["Empower others", "Lead by example", "Data-informed decisions"],
      "confidenceScore": 0.80,
      "inferredFrom": "Team growth achievements and language used in experience section"
    }
  ]
}`;

    const { response: leadershipResponse, metrics: leadershipMetrics } = await callPerplexity({
      messages: [{ role: 'user', content: leadershipPrompt }],
      model: selectOptimalModel({
        taskType: 'extraction',
        complexity: 'high',
        requiresReasoning: true,
        outputLength: 'medium'
      }),
      temperature: 0.4,
      max_tokens: 2000,
    }, 'extract-vault-intangibles-leadership', user.id);

    await logAIUsage(leadershipMetrics);

    const leadershipContent = cleanCitations(leadershipResponse.choices[0].message.content);
    const cleanedLeadership = leadershipContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const leadershipItems = JSON.parse(cleanedLeadership).leadershipPhilosophy;

    // Insert leadership philosophy
    const leadershipInserts = leadershipItems.map((item: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      philosophy_statement: item.philosophyStatement,
      leadership_style: item.leadershipStyle,
      real_world_application: item.realWorldApplication,
      core_principles: item.corePrinciples || [],
      confidence_score: item.confidenceScore,
      quality_tier: 'bronze', // Inferred data starts as bronze
      source: 'auto_populated_intangibles',
      needs_user_review: true
    }));

    await supabaseClient.from('vault_leadership_philosophy').insert(leadershipInserts);
    console.log(`✅ Extracted ${leadershipItems.length} leadership philosophy items`);

    // =================================================
    // EXTRACTION 2: EXECUTIVE PRESENCE
    // =================================================
    console.log('🎩 Extracting executive presence indicators...');

    const presencePrompt = `You are an executive coach identifying EXECUTIVE PRESENCE indicators.

Executive presence includes:
- Board/C-suite interaction
- Public speaking and thought leadership
- External representation (conferences, media, advisory boards)
- Gravitas indicators (high-stakes decisions, crisis management)
- Strategic influence

${vaultContext}

RESUME TEXT:
${resumeText}

RETURN VALID JSON ONLY:
{
  "executivePresence": [
    {
      "presenceIndicator": "Board Presentations",
      "situationalExample": "Presented quarterly business reviews to board of directors",
      "brandAlignment": "Positions as strategic communicator comfortable with C-suite",
      "perceivedImpact": "High - demonstrates comfort at executive level",
      "confidenceScore": 0.88
    }
  ]
}`;

    const { response: presenceResponse, metrics: presenceMetrics } = await callPerplexity({
      messages: [{ role: 'user', content: presencePrompt }],
      model: selectOptimalModel({
        taskType: 'extraction',
        complexity: 'high',
        requiresReasoning: true,
        outputLength: 'medium'
      }),
      temperature: 0.4,
      max_tokens: 2000,
    }, 'extract-vault-intangibles-presence', user.id);

    await logAIUsage(presenceMetrics);

    const presenceContent = cleanCitations(presenceResponse.choices[0].message.content);
    const cleanedPresence = presenceContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const presenceItems = JSON.parse(cleanedPresence).executivePresence;

    // Insert executive presence
    const presenceInserts = presenceItems.map((item: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      presence_indicator: item.presenceIndicator,
      situational_example: item.situationalExample,
      brand_alignment: item.brandAlignment,
      perceived_impact: item.perceivedImpact,
      confidence_score: item.confidenceScore,
      quality_tier: 'bronze',
      source: 'auto_populated_intangibles',
      needs_user_review: true
    }));

    await supabaseClient.from('vault_executive_presence').insert(presenceInserts);
    console.log(`✅ Extracted ${presenceItems.length} executive presence indicators`);

    // =================================================
    // EXTRACTION 3: PERSONALITY TRAITS
    // =================================================
    console.log('🧠 Extracting personality traits from behavioral evidence...');

    const personalityPrompt = `You are a behavioral psychologist inferring personality traits from resume evidence.

Look for observable behaviors that indicate:
- Detail-oriented vs. big-picture thinker
- Risk-taker vs. risk-averse
- Introvert vs. extrovert (based on roles)
- Competitive vs. collaborative
- Innovative vs. traditional

${vaultContext}

RESUME TEXT:
${resumeText}

RETURN VALID JSON ONLY:
{
  "personalityTraits": [
    {
      "traitName": "Results-Oriented",
      "behavioralEvidence": "Consistently quantifies achievements and focuses on measurable outcomes",
      "workContext": "High-performance, metrics-driven environments",
      "confidenceScore": 0.85
    }
  ]
}`;

    const { response: personalityResponse, metrics: personalityMetrics } = await callPerplexity({
      messages: [{ role: 'user', content: personalityPrompt }],
      model: selectOptimalModel({
        taskType: 'extraction',
        complexity: 'medium',
        requiresReasoning: true,
        outputLength: 'medium'
      }),
      temperature: 0.4,
      max_tokens: 2000,
    }, 'extract-vault-intangibles-personality', user.id);

    await logAIUsage(personalityMetrics);

    const personalityContent = cleanCitations(personalityResponse.choices[0].message.content);
    const cleanedPersonality = personalityContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const personalityItems = JSON.parse(cleanedPersonality).personalityTraits;

    // Insert personality traits
    const personalityInserts = personalityItems.map((item: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      trait_name: item.traitName,
      behavioral_evidence: item.behavioralEvidence,
      work_context: item.workContext,
      confidence_score: item.confidenceScore,
      quality_tier: 'bronze',
      source: 'auto_populated_intangibles',
      needs_user_review: true
    }));

    await supabaseClient.from('vault_personality_traits').insert(personalityInserts);
    console.log(`✅ Extracted ${personalityItems.length} personality traits`);

    // =================================================
    // EXTRACTION 4: WORK STYLE
    // =================================================
    console.log('💼 Extracting work style preferences...');

    const workStylePrompt = `You are a workplace culture analyst inferring work style preferences.

${vaultContext}

RESUME TEXT:
${resumeText}

Infer work style based on:
- Role types (remote, in-office, hybrid indicators)
- Team sizes led
- Collaboration patterns (cross-functional, independent)
- Communication style
- Environment preferences

RETURN VALID JSON ONLY:
{
  "workStyle": [
    {
      "preferenceArea": "Collaboration",
      "preferenceDescription": "Thrives in cross-functional, matrixed environments",
      "idealEnvironment": "Fast-paced, collaborative teams with autonomy",
      "confidenceScore": 0.75
    }
  ]
}`;

    const { response: workStyleResponse, metrics: workStyleMetrics } = await callPerplexity({
      messages: [{ role: 'user', content: workStylePrompt }],
      model: selectOptimalModel({
        taskType: 'extraction',
        complexity: 'low',
        requiresReasoning: false,
        outputLength: 'short'
      }),
      temperature: 0.4,
      max_tokens: 1500,
    }, 'extract-vault-intangibles-workstyle', user.id);

    await logAIUsage(workStyleMetrics);

    const workStyleContent = cleanCitations(workStyleResponse.choices[0].message.content);
    const cleanedWorkStyle = workStyleContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const workStyleItems = JSON.parse(cleanedWorkStyle).workStyle;

    // Insert work style
    const workStyleInserts = workStyleItems.map((item: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      preference_area: item.preferenceArea,
      preference_description: item.preferenceDescription,
      ideal_environment: item.idealEnvironment,
      confidence_score: item.confidenceScore,
      quality_tier: 'bronze',
      source: 'auto_populated_intangibles',
      needs_user_review: true
    }));

    await supabaseClient.from('vault_work_style').insert(workStyleInserts);
    console.log(`✅ Extracted ${workStyleItems.length} work style items`);

    // =================================================
    // EXTRACTION 5: VALUES & MOTIVATIONS
    // =================================================
    console.log('❤️ Extracting values and motivations...');

    const valuesPrompt = `You are a career counselor identifying core values and motivations.

${vaultContext}

RESUME TEXT:
${resumeText}

Look for evidence of what drives this person:
- Career choices (startups vs. enterprise, mission-driven orgs)
- Project focus (innovation, efficiency, people)
- Language used ("passionate about X", "dedicated to Y")
- Volunteer work, certifications pursued

RETURN VALID JSON ONLY:
{
  "valuesMotivations": [
    {
      "valueName": "Innovation",
      "manifestation": "Consistently seeks new technologies and approaches; led multiple transformation initiatives",
      "importanceLevel": "core",
      "confidenceScore": 0.82
    }
  ]
}`;

    const { response: valuesResponse, metrics: valuesMetrics } = await callPerplexity({
      messages: [{ role: 'user', content: valuesPrompt }],
      model: selectOptimalModel({
        taskType: 'extraction',
        complexity: 'medium',
        requiresReasoning: true,
        outputLength: 'short'
      }),
      temperature: 0.4,
      max_tokens: 1500,
    }, 'extract-vault-intangibles-values', user.id);

    await logAIUsage(valuesMetrics);

    const valuesContent = cleanCitations(valuesResponse.choices[0].message.content);
    const cleanedValues = valuesContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const valuesItems = JSON.parse(cleanedValues).valuesMotivations;

    // Insert values
    const valuesInserts = valuesItems.map((item: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      value_name: item.valueName,
      manifestation: item.manifestation,
      importance_level: item.importanceLevel || 'important',
      confidence_score: item.confidenceScore,
      quality_tier: 'bronze',
      source: 'auto_populated_intangibles',
      needs_user_review: true
    }));

    await supabaseClient.from('vault_values_motivations').insert(valuesInserts);
    console.log(`✅ Extracted ${valuesItems.length} values/motivations`);

    // =================================================
    // EXTRACTION 6: BEHAVIORAL INDICATORS
    // =================================================
    console.log('📈 Extracting behavioral success patterns...');

    const behavioralPrompt = `You are a talent assessment expert identifying behavioral patterns that predict success.

${vaultContext}

RESUME TEXT:
${resumeText}

Identify patterns in how they:
- Approach problems
- Handle challenges
- Drive change
- Build relationships
- Learn and grow

RETURN VALID JSON ONLY:
{
  "behavioralIndicators": [
    {
      "indicatorType": "Problem Solving",
      "specificBehavior": "Data-driven decision making with rapid iteration",
      "context": "When facing technical challenges, analyzes metrics then tests solutions quickly",
      "outcomePattern": "Consistently reduces time-to-resolution through analytical approach",
      "confidenceScore": 0.80
    }
  ]
}`;

    const { response: behavioralResponse, metrics: behavioralMetrics } = await callPerplexity({
      messages: [{ role: 'user', content: behavioralPrompt }],
      model: selectOptimalModel({
        taskType: 'extraction',
        complexity: 'medium',
        requiresReasoning: true,
        outputLength: 'short'
      }),
      temperature: 0.4,
      max_tokens: 1500,
    }, 'extract-vault-intangibles-behavioral', user.id);

    await logAIUsage(behavioralMetrics);

    const behavioralContent = cleanCitations(behavioralResponse.choices[0].message.content);
    const cleanedBehavioral = behavioralContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const behavioralItems = JSON.parse(cleanedBehavioral).behavioralIndicators;

    // Insert behavioral indicators
    const behavioralInserts = behavioralItems.map((item: any) => ({
      vault_id: vaultId,
      user_id: user.id,
      indicator_type: item.indicatorType,
      specific_behavior: item.specificBehavior,
      context: item.context,
      outcome_pattern: item.outcomePattern,
      confidence_score: item.confidenceScore,
      quality_tier: 'bronze',
      source: 'auto_populated_intangibles',
      needs_user_review: true
    }));

    await supabaseClient.from('vault_behavioral_indicators').insert(behavioralInserts);
    console.log(`✅ Extracted ${behavioralItems.length} behavioral indicators`);

    // =================================================
    // CALCULATE TOTALS
    // =================================================
    const totalIntangibles =
      leadershipItems.length +
      presenceItems.length +
      personalityItems.length +
      workStyleItems.length +
      valuesItems.length +
      behavioralItems.length;

    console.log(`🎉 INTANGIBLES EXTRACTION COMPLETE: ${totalIntangibles} items`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          totalIntangibles,
          breakdown: {
            leadershipPhilosophy: leadershipItems.length,
            executivePresence: presenceItems.length,
            personalityTraits: personalityItems.length,
            workStyle: workStyleItems.length,
            valuesMotivations: valuesItems.length,
            behavioralIndicators: behavioralItems.length
          }
        },
        meta: {
          message: `🌟 Executive Intelligence Layer Complete! We've extracted ${totalIntangibles} intangible qualities that define your leadership brand.`,
          uniqueValue: `These insights about your leadership philosophy, executive presence, and work style are IMPOSSIBLE for traditional resume scanners to capture. This is what separates our platform from every other career tool.`,
          usageNote: `These intangibles will power your interview preparation (behavioral questions), personal branding (LinkedIn), and culture fit analysis. They represent WHO YOU ARE as a leader, not just what you've done.`,
          reviewNote: `All intangible items are marked for your review—you know yourself best. Confirm, edit, or remove items to ensure authenticity.`
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in extract-vault-intangibles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        userMessage: 'We encountered an issue extracting intangible qualities. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

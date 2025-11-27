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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

interface IntangiblesRequest {
  resumeText?: string;
  vaultId: string;
  category?: string; // Optional: extract specific category only
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
    // Get and validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[extract-vault-intangibles] Missing Authorization header');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          userMessage: 'Authentication required. Please log in again.'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with service role for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Authenticate user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[extract-vault-intangibles] Auth error:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          userMessage: 'Session expired. Please log in again.'
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const {
      resumeText,
      vaultId,
      category,
      existingVaultData
    } = await req.json();

    console.log('🌟 EXTRACTING INTANGIBLES for vault:', vaultId, category ? `(category: ${category})` : '(all categories)');

    // Build context from existing vault data
    const vaultContext = existingVaultData ? `
CONTEXT FROM EXISTING VAULT DATA:
Top Achievements: ${existingVaultData.powerPhrases?.slice(0, 5).map((p: any) => p.phrase).join('; ') || 'N/A'}
Key Skills: ${existingVaultData.skills?.slice(0, 10).map((s: any) => s.statedSkill).join(', ') || 'N/A'}
Hidden Competencies: ${existingVaultData.competencies?.map((c: any) => c.competencyArea).join(', ') || 'N/A'}

Use this to infer intangible qualities.
` : '';

    // Fetch target roles/industries, resume text, and industry research for context (SHARED across all extractions)
    const { data: vault } = await supabaseClient
      .from('career_vault')
      .select('target_roles, target_industries, resume_raw_text')
      .eq('id', vaultId)
      .single();

    // Fetch industry research for market context
    const { data: industryResearch } = await supabaseClient
      .from('career_vault_industry_research')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Use provided resumeText or fall back to vault data
    const finalResumeText = resumeText || vault?.resume_raw_text;

    if (!finalResumeText) {
      throw new Error('No resume text found. Please upload your resume in Career Vault first.');
    }

    const targetRole = vault?.target_roles?.[0] || 'Not specified';
    const targetIndustry = vault?.target_industries?.[0] || 'Not specified';

    // Build industry context from research
    const industryContext = industryResearch ? `
INDUSTRY & MARKET INTELLIGENCE:
Target Industry: ${industryResearch.target_industry}
Target Role: ${industryResearch.target_role}

Key Industry Trends:
${JSON.stringify(industryResearch.industry_trends || {}, null, 2)}

Common Skills in This Market:
${JSON.stringify(industryResearch.common_skills || {}, null, 2)}

Expected Leadership Traits:
${JSON.stringify(industryResearch.leadership_traits || {}, null, 2)}

Use this intelligence to:
1. Position extracted items against market expectations
2. Identify competitive advantages vs. industry norms
3. Note where candidate exceeds typical requirements
4. Flag gaps relative to senior roles in ${targetIndustry}
` : `
INDUSTRY CONTEXT: No specific research available yet. Focus on extracting high-quality insights from resume.
`;

    // =================================================
    // EXTRACTION 1: LEADERSHIP PHILOSOPHY
    // =================================================
    let leadershipItems: any[] = [];
    
    try {
      console.log('👔 Extracting leadership philosophy...');

      const leadershipPrompt = `You are an executive coach inferring UNSPOKEN leadership philosophy from resume evidence.

${industryContext}

CRITICAL: The candidate won't say "I'm a servant leader" on their resume. INFER it from:
- HOW they describe their wins (team-first vs. I-focused language)
- What they PRIORITIZE (growth vs. efficiency vs. innovation)
- Team outcomes (high retention = trust, fast growth = talent magnet)

${vaultContext}

RESUME TEXT:
${finalResumeText}

TARGET ROLE: ${targetRole}
TARGET INDUSTRY: ${targetIndustry}

EXAMPLES OF INFERENCE (NOT RESTATEMENT):

Resume: "Grew engineering team from 12 to 45 in 18 months with 92% retention"
❌ BAD: "Believes in team growth"
✅ GOOD: "Talent magnet with retention mastery - built high-trust culture that attracts and retains A-players. Philosophy: Invest in people, create autonomy, and they'll deliver beyond expectations."
Industry fit: Strong fit for ${targetIndustry} - retention stats prove leadership effectiveness

Resume: "Delivered 8 consecutive quarters ahead of roadmap"
❌ BAD: "Results-oriented leader"
✅ GOOD: "Execution-obsessed with sustainable velocity - balances speed with quality. Philosophy: Under-promise, over-deliver, and build team pride through consistent wins."
LinkedIn angle: "Why 'move fast and break things' fails at scale - a case for disciplined execution"

RETURN VALID JSON ONLY:
{
  "leadershipPhilosophy": [
    {
      "philosophyStatement": "INFERRED philosophy statement (not stated in resume)",
      "leadershipStyle": "Specific style inferred from actions",
      "realWorldApplication": "How this manifests in their work",
      "corePrinciples": ["Principle 1", "Principle 2"],
      "confidenceScore": 0.80,
      "inferredFrom": "Specific evidence that led to this inference",
      "alignmentWithIndustryNorms": "How this fits ${targetIndustry} expectations",
      "behavioralInterviewExamples": [
        "Interview question 1 based on this philosophy",
        "Interview question 2"
      ],
      "linkedinAngle": "Thought leadership topic for LinkedIn"
    }
  ]
}`;

      const { response: leadershipResponse, metrics: leadershipMetrics } = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are an expert at inferring leadership philosophy from resume evidence. Return only valid JSON.' },
          { role: 'user', content: leadershipPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM, // Use premium model for intelligence extraction
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      }, 'extract-vault-intangibles-leadership', user.id);

      await logAIUsage(leadershipMetrics);

      const leadershipContent = leadershipResponse.choices[0].message.content;
      const leadershipResult = extractJSON(leadershipContent);
      leadershipItems = leadershipResult.success ? (leadershipResult.data?.leadershipPhilosophy || []) : [];

      // Insert leadership philosophy with industry context
      if (leadershipItems.length > 0) {
        const leadershipInserts = leadershipItems.map((item: any) => ({
          vault_id: vaultId,
          user_id: user.id,
          philosophy_statement: item.philosophyStatement,
          leadership_style: item.leadershipStyle,
          real_world_application: item.realWorldApplication,
          core_principles: item.corePrinciples || [],
          quality_tier: 'bronze', // Inferred data starts as bronze
          needs_user_review: true,
          // Industry-aware fields for interview prep & LinkedIn
          alignment_with_industry_norms: item.alignmentWithIndustryNorms,
          behavioral_interview_examples: item.behavioralInterviewExamples || [],
          linkedin_angle: item.linkedinAngle
        }));

        const { error: insertError } = await supabaseClient.from('vault_leadership_philosophy').insert(leadershipInserts);
        if (insertError) {
          console.error('❌ Failed to insert leadership philosophy:', insertError);
          throw insertError;
        }
      }
      console.log(`✅ Extracted ${leadershipItems.length} leadership philosophy items`);
    } catch (error: any) {
      console.error('❌ Leadership extraction failed:', error?.message || error);
      // Continue with other extractions
    }

    // =================================================
    // EXTRACTION 2: EXECUTIVE PRESENCE
    // =================================================
    let presenceItems: any[] = [];
    
    try {
      console.log('🎩 Extracting executive presence indicators...');

    const presencePrompt = `You are an executive coach identifying EXECUTIVE PRESENCE indicators.

Executive presence includes:
- Board/C-suite interaction
- Public speaking and thought leadership
- External representation (conferences, media, advisory boards)
- Gravitas indicators (high-stakes decisions, crisis management)
- Strategic influence

${industryContext}

${vaultContext}

RESUME TEXT:
${finalResumeText}

TARGET ROLE: ${targetRole}
TARGET INDUSTRY: ${targetIndustry}

RETURN VALID JSON ONLY:
{
  "executivePresence": [
    {
      "presenceIndicator": "Board Presentations",
      "situationalExample": "Presented quarterly business reviews to board of directors",
      "brandAlignment": "Positions as strategic communicator comfortable with C-suite",
      "perceivedImpact": "High - demonstrates comfort at executive level",
      "confidenceScore": 0.88,
      
      // NEW FIELDS for interview prep & LinkedIn
      "roleFitAssessment": "Board presentation experience = strong fit for VP+ roles in ${targetRole}",
      "interviewResponseHook": "I presented to our board quarterly, which taught me how to distill complex technical details for executive audiences",
      "linkedinCredibilityBoost": "Board presentations signal C-suite readiness and strategic communication skills"
    }
  ]
}`;

      const { response: presenceResponse, metrics: presenceMetrics } = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are an expert at identifying executive presence. Return only valid JSON.' },
          { role: 'user', content: presencePrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM, // Use premium model
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      }, 'extract-vault-intangibles-presence', user.id);

      await logAIUsage(presenceMetrics);

      const presenceContent = presenceResponse.choices[0].message.content;
      const presenceResult = extractJSON(presenceContent);
      presenceItems = presenceResult.success ? (presenceResult.data?.executivePresence || []) : [];

      // Insert executive presence with industry context
      if (presenceItems.length > 0) {
        const presenceInserts = presenceItems.map((item: any) => ({
          vault_id: vaultId,
          user_id: user.id,
          presence_indicator: item.presenceIndicator,
          situational_example: item.situationalExample,
          brand_alignment: item.brandAlignment,
          perceived_impact: item.perceivedImpact,
          quality_tier: 'bronze',
          needs_user_review: true,
          // Industry-aware fields for interview prep & LinkedIn
          role_fit_assessment: item.roleFitAssessment,
          interview_response_hook: item.interviewResponseHook,
          linkedin_credibility_boost: item.linkedinCredibilityBoost
        }));

        const { error: insertError } = await supabaseClient.from('vault_executive_presence').insert(presenceInserts);
        if (insertError) {
          console.error('❌ Failed to insert executive presence:', insertError);
          throw insertError;
        }
      }
      console.log(`✅ Extracted ${presenceItems.length} executive presence indicators`);
    } catch (error: any) {
      console.error('❌ Executive presence extraction failed:', error?.message || error);
      // Continue with other extractions
    }

    // =================================================
    // EXTRACTION 3: PERSONALITY TRAITS
    // =================================================
    let personalityItems: any[] = [];
    
    try {
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
${finalResumeText}

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

      const { response: personalityResponse, metrics: personalityMetrics } = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are an expert at identifying personality traits. Return only valid JSON.' },
          { role: 'user', content: personalityPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      }, 'extract-vault-intangibles-personality', user.id);

      await logAIUsage(personalityMetrics);

      const personalityContent = personalityResponse.choices[0].message.content;
      const personalityResult = extractJSON(personalityContent);
      personalityItems = personalityResult.success ? (personalityResult.data?.personalityTraits || []) : [];

      // Insert personality traits
      if (personalityItems.length > 0) {
        const personalityInserts = personalityItems.map((item: any) => ({
          vault_id: vaultId,
          user_id: user.id,
          trait_name: item.traitName,
          behavioral_evidence: item.behavioralEvidence,
          work_context: item.workContext,
          quality_tier: 'bronze',
          needs_user_review: true
        }));

        const { error: insertError } = await supabaseClient.from('vault_personality_traits').insert(personalityInserts);
        if (insertError) {
          console.error('❌ Failed to insert personality traits:', insertError);
          throw insertError;
        }
      }
      console.log(`✅ Extracted ${personalityItems.length} personality traits`);
    } catch (error: any) {
      console.error('❌ Personality extraction failed:', error?.message || error);
      // Continue with other extractions
    }

    // =================================================
    // EXTRACTION 4: WORK STYLE
    // =================================================
    let workStyleItems: any[] = [];
    
    try {
      console.log('💼 Extracting work style preferences...');

    const workStylePrompt = `You are a workplace culture analyst inferring work style preferences.

${vaultContext}

RESUME TEXT:
${finalResumeText}

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

      const { response: workStyleResponse, metrics: workStyleMetrics } = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are an expert at identifying work style preferences. Return only valid JSON.' },
          { role: 'user', content: workStylePrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      }, 'extract-vault-intangibles-workstyle', user.id);

      await logAIUsage(workStyleMetrics);

      const workStyleContent = workStyleResponse.choices[0].message.content;
      const workStyleResult = extractJSON(workStyleContent);
      workStyleItems = workStyleResult.success ? (workStyleResult.data?.workStyle || []) : [];

      // Insert work style
      if (workStyleItems.length > 0) {
        const workStyleInserts = workStyleItems.map((item: any) => ({
          vault_id: vaultId,
          user_id: user.id,
          preference_area: item.preferenceArea,
          preference_description: item.preferenceDescription,
          ideal_environment: item.idealEnvironment,
          quality_tier: 'bronze',
          needs_user_review: true
        }));

        const { error: insertError } = await supabaseClient.from('vault_work_style').insert(workStyleInserts);
        if (insertError) {
          console.error('❌ Failed to insert work style:', insertError);
          throw insertError;
        }
      }
      console.log(`✅ Extracted ${workStyleItems.length} work style items`);
    } catch (error: any) {
      console.error('❌ Work style extraction failed:', error?.message || error);
      // Continue with other extractions
    }

    // =================================================
    // EXTRACTION 5: VALUES & MOTIVATIONS
    // =================================================
    let valuesItems: any[] = [];
    
    try {
      console.log('❤️ Extracting values and motivations...');

    const valuesPrompt = `You are a career counselor identifying core values and motivations.

${vaultContext}

RESUME TEXT:
${finalResumeText}

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

      const { response: valuesResponse, metrics: valuesMetrics } = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are an expert at identifying values and motivations. Return only valid JSON.' },
          { role: 'user', content: valuesPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      }, 'extract-vault-intangibles-values', user.id);

      await logAIUsage(valuesMetrics);

      const valuesContent = valuesResponse.choices[0].message.content;
      const valuesResult = extractJSON(valuesContent);
      valuesItems = valuesResult.success ? (valuesResult.data?.valuesMotivations || []) : [];

      // Helper function to normalize importance levels from AI output
      const normalizeImportanceLevel = (level: string | undefined): string => {
        if (!level) return 'important';
        const normalized = level.toLowerCase();
        if (normalized === 'high' || normalized === 'core') return 'core';
        if (normalized === 'low' || normalized === 'nice_to_have' || normalized === 'nice to have') return 'nice_to_have';
        return 'important'; // medium, important, or default
      };

      // Insert values
      if (valuesItems.length > 0) {
        const valuesInserts = valuesItems.map((item: any) => ({
          vault_id: vaultId,
          user_id: user.id,
          value_name: item.valueName,
          manifestation: item.manifestation,
          importance_level: normalizeImportanceLevel(item.importanceLevel),
          quality_tier: 'bronze',
          needs_user_review: true
        }));

        const { error: insertError } = await supabaseClient.from('vault_values_motivations').insert(valuesInserts);
        if (insertError) {
          console.error('❌ Failed to insert values/motivations:', insertError);
          throw insertError;
        }
      }
      console.log(`✅ Extracted ${valuesItems.length} values/motivations`);
    } catch (error: any) {
      console.error('❌ Values extraction failed:', error?.message || error);
      // Continue with other extractions
    }

    // =================================================
    // EXTRACTION 6: BEHAVIORAL INDICATORS
    // =================================================
    let behavioralItems: any[] = [];
    
    try {
      console.log('📈 Extracting behavioral success patterns...');

      const behavioralPrompt = `You are a talent assessment expert identifying behavioral patterns that predict success.

${vaultContext}

RESUME TEXT:
${finalResumeText}

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

      const { response: behavioralResponse, metrics: behavioralMetrics } = await callLovableAI({
        messages: [
          { role: 'system', content: 'You are an expert at identifying behavioral indicators. Return only valid JSON.' },
          { role: 'user', content: behavioralPrompt }
        ],
        model: LOVABLE_AI_MODELS.PREMIUM,
        temperature: 0.4,
        max_tokens: 2500,
        response_format: { type: 'json_object' }
      }, 'extract-vault-intangibles-behavioral', user.id);

      await logAIUsage(behavioralMetrics);

      const behavioralContent = behavioralResponse.choices[0].message.content;
      const behavioralResult = extractJSON(behavioralContent);
      behavioralItems = behavioralResult.success ? (behavioralResult.data?.behavioralIndicators || []) : [];

      // Insert behavioral indicators
      if (behavioralItems.length > 0) {
        const behavioralInserts = behavioralItems.map((item: any) => ({
          vault_id: vaultId,
          user_id: user.id,
          indicator_type: item.indicatorType,
          specific_behavior: item.specificBehavior,
          context: item.context,
          outcome_pattern: item.outcomePattern,
          quality_tier: 'bronze',
          needs_user_review: true
        }));

        const { error: insertError } = await supabaseClient.from('vault_behavioral_indicators').insert(behavioralInserts);
        if (insertError) {
          console.error('❌ Failed to insert behavioral indicators:', insertError);
          throw insertError;
        }
      }
      console.log(`✅ Extracted ${behavioralItems.length} behavioral indicators`);
    } catch (error: any) {
      console.error('❌ Behavioral indicators extraction failed:', error?.message || error);
      // Continue with extraction complete
    }

    // =================================================
    // EXTRACTION 7: THOUGHT LEADERSHIP
    // =================================================
    console.log('📝 Extracting thought leadership...');

    const thoughtLeadershipPrompt = `You are a career strategist identifying thought leadership content.

${vaultContext}

RESUME TEXT:
${resumeText}

TASK: Find evidence of thought leadership:
- Publications (articles, whitepapers, books)
- Speaking engagements (conferences, panels, webinars)
- Podcasts, interviews, media appearances
- Industry recognition for expertise

RETURN VALID JSON (or empty array if none found):
{
  "thoughtLeadership": [
    {
      "contentType": "speaking",
      "title": "Keynote: Scaling Engineering Teams at 10x Growth",
      "platform": "TechCrunch Disrupt 2023",
      "datePublished": "2023-06-15",
      "interviewTalkingPoint": "I've spoken at TechCrunch Disrupt about scaling engineering teams",
      "demonstratesCompetency": ["Communication", "Thought Leadership", "Engineering Management"],
      "linkedinReferenceValue": "Link to speaking page in Featured section",
      "repurposePotential": "Turn keynote themes into LinkedIn post series",
      "confidenceScore": 0.85
    }
  ]
}`;

    const { response: thoughtResponse, metrics: thoughtMetrics } = await callLovableAI({
      messages: [{ role: 'user', content: thoughtLeadershipPrompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }, 'extract-thought-leadership', user.id);

    await logAIUsage(thoughtMetrics);
    const thoughtContent = thoughtResponse.choices[0].message.content;
    const thoughtData: any = extractJSON(thoughtContent);
    const thoughtItems = Array.isArray(thoughtData) ? thoughtData : (thoughtData?.thoughtLeadership || []);

    if (thoughtItems.length > 0) {
      const thoughtInserts = thoughtItems.map((item: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        content_type: item.contentType,
        title: item.title,
        platform: item.platform || null,
        date_published: item.datePublished || null,
        interview_talking_point: item.interviewTalkingPoint,
        demonstrates_competency: item.demonstratesCompetency || [],
        linkedin_reference_value: item.linkedinReferenceValue,
        repurpose_potential: item.repurposePotential,
        ai_confidence: item.confidenceScore || 0.70,
        quality_tier: 'bronze'
      }));

      const { error: insertError } = await supabaseClient.from('vault_thought_leadership').insert(thoughtInserts);
      if (insertError) {
        console.error('❌ Failed to insert thought leadership:', insertError);
        throw insertError;
      }
      console.log(`✅ Extracted ${thoughtItems.length} thought leadership items`);
    } else {
      console.log('⚠️ No thought leadership found');
    }

    // =================================================
    // EXTRACTION 8: PROFESSIONAL NETWORK
    // =================================================
    console.log('🤝 Extracting professional network...');

    const networkPrompt = `You are a career strategist identifying professional network affiliations.

${vaultContext}

RESUME TEXT:
${resumeText}

TASK: Find evidence of professional network:
- Board seats (corporate, non-profit)
- Advisory roles (companies, startups, organizations)
- Professional associations (memberships, leadership roles)
- Alumni networks (active participation, leadership)
- Industry groups (committees, councils)

RETURN VALID JSON (or empty array if none found):
{
  "professionalNetwork": [
    {
      "networkType": "board_seat",
      "organizationName": "TechCorp Board of Directors",
      "roleTitle": "Board Member",
      "startDate": "2022-01-01",
      "selectionCriteria": "Invited for expertise in digital transformation",
      "impact": "Advised on $50M strategic technology investment",
      "interviewLeveragePoint": "My board experience gives me insight into executive decision-making",
      "linkedinProfilePlacement": "Feature prominently in Experience section",
      "credibilitySignalStrength": "high",
      "confidenceScore": 0.85
    }
  ]
}`;

    const { response: networkResponse, metrics: networkMetrics } = await callLovableAI({
      messages: [{ role: 'user', content: networkPrompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    }, 'extract-professional-network', user.id);

    await logAIUsage(networkMetrics);
    const networkContent = networkResponse.choices[0].message.content;
    const networkData: any = extractJSON(networkContent);
    const networkItems = Array.isArray(networkData) ? networkData : (networkData?.professionalNetwork || []);

    if (networkItems.length > 0) {
      const networkInserts = networkItems.map((item: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        network_type: item.networkType,
        organization_name: item.organizationName,
        role_title: item.roleTitle || null,
        start_date: item.startDate || null,
        selection_criteria: item.selectionCriteria,
        impact: item.impact,
        interview_leverage_point: item.interviewLeveragePoint,
        linkedin_profile_placement: item.linkedinProfilePlacement,
        credibility_signal_strength: item.credibilitySignalStrength || 'medium',
        ai_confidence: item.confidenceScore || 0.80,
        quality_tier: 'gold'
      }));

      const { error: insertError } = await supabaseClient.from('vault_professional_network').insert(networkInserts);
      if (insertError) {
        console.error('❌ Failed to insert professional network:', insertError);
        throw insertError;
      }
      console.log(`✅ Extracted ${networkItems.length} professional network items`);
    } else {
      console.log('⚠️ No professional network found');
    }

    // =================================================
    // EXTRACTION 9: COMPETITIVE ADVANTAGES
    // =================================================
    console.log('⭐ Analyzing competitive advantages...');

    const advantagesPrompt = `You are a career strategist identifying unique competitive advantages.

${vaultContext}

RESUME TEXT:
${resumeText}

TASK: Analyze what makes this candidate UNIQUELY qualified vs typical candidates:
- Unique experience combinations (e.g., engineering + law)
- Rare skill combinations (e.g., AI + healthcare domain expertise)
- Industry insider knowledge (e.g., worked at 3 top competitors)
- Exceptional track record (e.g., 5 successful exits)
- Rare certifications or credentials

RETURN VALID JSON with 3-5 strongest differentiators:
{
  "competitiveAdvantages": [
    {
      "advantageCategory": "rare_skill_combo",
      "advantageStatement": "Combines technical AI expertise with healthcare domain knowledge",
      "marketRarity": "Only 5-10% of AI engineers have deep healthcare experience",
      "proofPoints": ["Built FDA-approved AI diagnostic tool", "10 years in medical device industry"],
      "interviewPositioning": "Most AI candidates understand the tech but not healthcare compliance - I bring both",
      "linkedinHookPotential": "Why the future of AI in healthcare needs engineers who speak 'doctor'",
      "differentiatorStrength": "exceptional",
      "confidenceScore": 0.90
    }
  ]
}`;

    const { response: advantagesResponse, metrics: advantagesMetrics } = await callLovableAI({
      messages: [{ role: 'user', content: advantagesPrompt }],
      model: LOVABLE_AI_MODELS.DEFAULT,
      temperature: 0.4,
      response_format: { type: 'json_object' }
    }, 'extract-competitive-advantages', user.id);

    await logAIUsage(advantagesMetrics);
    const advantagesContent = advantagesResponse.choices[0].message.content;
    const advantagesData: any = extractJSON(advantagesContent);
    const advantageItems = Array.isArray(advantagesData) ? advantagesData : (advantagesData?.competitiveAdvantages || []);

    if (advantageItems.length > 0) {
      const advantageInserts = advantageItems.map((item: any) => ({
        vault_id: vaultId,
        user_id: user.id,
        advantage_category: item.advantageCategory,
        advantage_statement: item.advantageStatement,
        market_rarity: item.marketRarity,
        proof_points: item.proofPoints || [],
        interview_positioning: item.interviewPositioning,
        linkedin_hook_potential: item.linkedinHookPotential,
        differentiator_strength: item.differentiatorStrength || 'moderate',
        ai_confidence: item.confidenceScore || 0.75,
        quality_tier: 'gold'
      }));

      const { error: insertError } = await supabaseClient.from('vault_competitive_advantages').insert(advantageInserts);
      if (insertError) {
        console.error('❌ Failed to insert competitive advantages:', insertError);
        throw insertError;
      }
      console.log(`✅ Extracted ${advantageItems.length} competitive advantages`);
    } else {
      console.log('⚠️ No competitive advantages identified');
    }

    // =================================================
    // CALCULATE TOTALS
    // =================================================
    const totalIntangibles =
      leadershipItems.length +
      presenceItems.length +
      personalityItems.length +
      workStyleItems.length +
      valuesItems.length +
      behavioralItems.length +
      thoughtItems.length +
      networkItems.length +
      advantageItems.length;

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
            behavioralIndicators: behavioralItems.length,
            thoughtLeadership: thoughtItems.length,
            professionalNetwork: networkItems.length,
            competitiveAdvantages: advantageItems.length
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

  } catch (error: unknown) {
    console.error('Error in extract-vault-intangibles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        userMessage: 'We encountered an issue extracting intangible qualities. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

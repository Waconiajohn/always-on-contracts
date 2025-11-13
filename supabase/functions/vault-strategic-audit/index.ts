// =====================================================
// TIER 2: DEEP STRATEGIC AUDIT
// =====================================================
// User-triggered comprehensive career intelligence report
// Model: sonar-reasoning-pro (deep thinking) - $0.05 per audit
// Purpose: Strategic positioning, skill gaps, market analysis
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface StrategicAuditRequest {
  vaultId: string;
}

interface RoleRecommendation {
  role: string;
  alignmentScore: number; // 0-100
  salaryRange: string;
  demandLevel: string;
  reasoning: string;
  keyRequirements: string[];
  gapsToAddress: string[];
}

interface SkillDevelopment {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  currentLevel: string;
  targetLevel: string;
  resources: {
    name: string;
    type: 'course' | 'certification' | 'book' | 'practice';
    provider: string;
    url?: string;
    estimatedCost: string;
    timeCommitment: string;
    roi: string;
  }[];
  timeline: string;
}

interface VaultQualityInsight {
  category: string;
  strength: string;
  examples: string[];
  opportunities: string[];
}

interface MarketIntelligence {
  targetRole: string;
  marketTrends: string[];
  competitivePositioning: string;
  salaryBenchmark: string;
  demandIndicators: string[];
}

interface ContentStrategy {
  linkedInTopics: string[];
  interviewTalkingPoints: string[];
  thoughtLeadershipAreas: string[];
  networkingRecommendations: string[];
}

interface ActionItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  impact: string;
  steps: string[];
}

interface StrategicAuditResult {
  vaultStrength: number;
  executiveSummary: string;
  strategicPositioning: {
    topRecommendations: RoleRecommendation[];
    marketFit: string;
  };
  skillDevelopmentRoadmap: SkillDevelopment[];
  vaultQualityAnalysis: VaultQualityInsight[];
  competitiveIntelligence: MarketIntelligence[];
  contentStrategy: ContentStrategy;
  ninetyDayActionPlan: ActionItem[];
  generatedAt: string;
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { vaultId }: StrategicAuditRequest = await req.json();

    console.log('🧠 STRATEGIC AUDIT: Starting deep analysis for vault:', vaultId);

    // Fetch ALL vault data for comprehensive analysis
    const [
      vault,
      powerPhrases,
      skills,
      competencies,
      softSkills,
      leadership,
      education,
      executivePresence,
      personalityTraits,
      workStyle,
      valuesMot,
      behavioral,
      technical,
      thoughtLeadership,
      network,
      advantages
    ] = await Promise.all([
      supabase.from('career_vault').select('*').eq('id', vaultId).single(),
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_education').select('*').eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
      supabase.from('vault_personality_traits').select('*').eq('vault_id', vaultId),
      supabase.from('vault_work_style').select('*').eq('vault_id', vaultId),
      supabase.from('vault_values_motivations').select('*').eq('vault_id', vaultId),
      supabase.from('vault_behavioral_indicators').select('*').eq('vault_id', vaultId),
      supabase.from('vault_technical_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_thought_leadership').select('*').eq('vault_id', vaultId),
      supabase.from('vault_professional_network').select('*').eq('vault_id', vaultId),
      supabase.from('vault_competitive_advantages').select('*').eq('vault_id', vaultId),
    ]);

    // Build comprehensive prompt for deep AI analysis
    const prompt = `You are an elite executive career strategist and AI advisor. Conduct a COMPREHENSIVE strategic audit of this career vault data.

**CAREER PROFILE:**
- Target Roles: ${vault.data?.target_roles?.join(', ') || 'Not specified'}
- Target Industries: ${vault.data?.target_industries?.join(', ') || 'Not specified'}
- Career Direction: ${vault.data?.career_direction || 'Not specified'}
- Current Vault Strength: ${vault.data?.vault_strength_after_qa || vault.data?.vault_strength_before_qa || 0}%

**VAULT DATA SUMMARY:**
- Power Phrases (Achievements): ${powerPhrases.data?.length || 0} items
  Top Examples: ${powerPhrases.data?.slice(0, 5).map((p: any) => `"${p.power_phrase}"`).join('; ') || 'None'}

- Transferable Skills: ${skills.data?.length || 0} items
  Top Skills: ${skills.data?.slice(0, 8).map((s: any) => s.stated_skill).join(', ') || 'None'}

- Technical Skills: ${technical.data?.length || 0} items
  Technologies: ${technical.data?.slice(0, 8).map((t: any) => t.skill_name).join(', ') || 'None'}

- Hidden Competencies: ${competencies.data?.length || 0} items
  Examples: ${competencies.data?.slice(0, 3).map((c: any) => c.inferred_capability).join('; ') || 'None'}

- Leadership Philosophy: ${leadership.data?.length || 0} items
  ${leadership.data?.slice(0, 2).map((l: any) => `"${l.philosophy_statement}"`).join('; ') || 'None'}

- Executive Presence: ${executivePresence.data?.length || 0} items
- Soft Skills: ${softSkills.data?.length || 0} items
- Education: ${education.data?.length || 0} items
  ${education.data?.map((e: any) => `${e.degree_type} in ${e.field} from ${e.institution}`).join('; ') || 'None'}

- Personality Traits: ${personalityTraits.data?.length || 0} items
- Work Style: ${workStyle.data?.length || 0} items
- Values & Motivations: ${valuesMot.data?.length || 0} items
- Thought Leadership: ${thoughtLeadership.data?.length || 0} items
- Professional Network: ${network.data?.length || 0} items
- Competitive Advantages: ${advantages.data?.length || 0} items

**YOUR MISSION:**
Provide a DEEP, STRATEGIC analysis that goes far beyond surface-level observations. This is a $0.05 AI audit - make it worth every penny.

Use Perplexity's web search to gather REAL market intelligence for the analysis. Search for:
- Current salary ranges for target roles
- In-demand skills and certifications
- Market trends in target industries
- Competitive positioning data

Return a comprehensive JSON report with these sections:

1. **Executive Summary** (2-3 paragraphs)
   - Overall career positioning assessment
   - Top 3 strategic opportunities
   - Key competitive advantages identified

2. **Strategic Positioning**
   - Top 3-5 role recommendations with:
     - Role title
     - Alignment score (0-100) based on vault data
     - Real salary range from market research
     - Demand level (high/medium/low) with evidence
     - Detailed reasoning (why this role fits)
     - Key requirements they meet
     - Gaps to address before applying

3. **Skill Development Roadmap**
   - 5-8 priority skills to develop
   - For EACH skill provide:
     - Current level vs. target level
     - 2-3 specific resources (courses, certifications, books)
     - Estimated cost and time commitment
     - Expected ROI (salary impact, job opportunities)
     - Timeline (weeks/months)
   - Prioritize by impact (high/medium/low)

4. **Vault Quality Analysis**
   - Review data quality by category
   - Identify strengths (with specific examples)
   - Surface opportunities for improvement
   - Flag any inconsistencies or gaps

5. **Competitive Intelligence**
   - Market benchmarking for target roles
   - Industry trends affecting career trajectory
   - Competitive positioning vs. typical candidates
   - Salary expectations with sources
   - Demand indicators from job market

6. **Content & Positioning Strategy**
   - 5-8 LinkedIn topics to post about (based on expertise)
   - 5-8 interview talking points (strongest stories)
   - 3-5 thought leadership areas to develop
   - Networking recommendations (events, groups, connections)

7. **90-Day Action Plan**
   - 8-12 prioritized action items
   - For EACH action:
     - Specific task description
     - Priority (high/medium/low)
     - Timeframe (week 1-4, month 2, etc.)
     - Expected impact
     - 2-3 concrete steps to complete it
   - Order by impact and urgency

**QUALITY STANDARDS:**
- Be SPECIFIC - no generic advice
- Use REAL data from web search where possible
- Provide ACTIONABLE recommendations with concrete steps
- Include URLs/names of actual courses, certifications, resources
- Base analysis on ACTUAL vault data, not assumptions
- Think deeply about career strategy - this is premium analysis

Return ONLY valid JSON with this structure:
{
  "vaultStrength": 75,
  "executiveSummary": "...",
  "strategicPositioning": {
    "topRecommendations": [...],
    "marketFit": "..."
  },
  "skillDevelopmentRoadmap": [...],
  "vaultQualityAnalysis": [...],
  "competitiveIntelligence": [...],
  "contentStrategy": {...},
  "ninetyDayActionPlan": [...]
}`;

    const startTime = Date.now();

    const aiResponse = await callPerplexity({
      model: 'sonar-reasoning-pro',  // Deep thinking model
      messages: [{
        role: 'system',
        content: 'You are an elite executive career strategist. Use web search to gather real market intelligence. Return only valid JSON, no markdown.'
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.3,
      max_tokens: 8000,  // Allow comprehensive response
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Strategic audit completed in ${duration}ms`);

    // Log AI usage
    await logAIUsage({
      supabase,
      userId: user.id,
      model: 'sonar-reasoning-pro',
      inputTokens: prompt.length / 4,  // Rough estimate
      outputTokens: (aiResponse.content || '').length / 4,
      cost: 0.05,  // Fixed cost per audit
      operation: 'vault-strategic-audit',
      metadata: { vaultId, duration }
    });

    // Parse AI response
    const resultText = aiResponse.content || '{}';
    const cleanedText = resultText.includes('```')
      ? resultText.split('```')[1].replace('json', '').trim()
      : resultText;

    const result: StrategicAuditResult = JSON.parse(cleanedText);
    result.generatedAt = new Date().toISOString();

    // Store strategic audit results
    const { error: insertError } = await supabase
      .from('vault_strategic_audits')
      .insert({
        vault_id: vaultId,
        user_id: user.id,
        vault_strength: result.vaultStrength,
        executive_summary: result.executiveSummary,
        strategic_positioning: result.strategicPositioning,
        skill_roadmap: result.skillDevelopmentRoadmap,
        vault_quality: result.vaultQualityAnalysis,
        competitive_intel: result.competitiveIntelligence,
        content_strategy: result.contentStrategy,
        action_plan: result.ninetyDayActionPlan,
        generated_at: result.generatedAt
      });

    if (insertError) {
      console.error('Failed to store strategic audit:', insertError);
    }

    console.log('📊 Strategic Audit Complete:', {
      vaultStrength: result.vaultStrength,
      recommendations: result.strategicPositioning?.topRecommendations?.length || 0,
      skillsToDeveLop: result.skillDevelopmentRoadmap?.length || 0,
      actionItems: result.ninetyDayActionPlan?.length || 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ STRATEGIC AUDIT FAILED:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { responseText, questionText, vaultId, milestone_id = null } = await req.json();

    console.log(`[EXTRACT-VAULT-INTELLIGENCE] Analyzing response (${responseText.length} chars)...`);

    const prompt = `Analyze this interview response and extract career intelligence across ALL 20 categories with executive-level rigor.

QUESTION ASKED:
${questionText}

USER'S RESPONSE:
${responseText}

Extract intelligence across these 20 categories (MUST extract from ALL applicable categories):

**Core Intelligence (3):**
1. powerPhrases: Action-packed achievements with quantifiable impact (e.g., "Increased revenue by 45% ($2.3M) by...")
2. transferableSkills: Core competencies applicable across roles (e.g., stakeholder management, data analysis, strategic planning)
3. hiddenCompetencies: Rare, valuable skills not obvious from titles (e.g., crisis management, change leadership, M&A integration)

**Expanded Intelligence (10):**
4. businessImpacts: Quantified business results with P&L impact
5. leadershipEvidence: Leading teams, influencing outcomes, developing talent
6. technicalDepth: Technologies, tools, methodologies mastered
7. projects: Major initiatives with scope, scale, and results
8. industryExpertise: Domain knowledge and market insights
9. problemSolving: Complex problems solved with structured approach
10. stakeholderMgmt: Managing relationships at all levels (board, executives, customers)
11. careerNarrative: Career progression, transitions, strategic moves
12. competitiveAdvantages: Unique differentiators vs peers
13. communication: Presentation, writing, influence through communication

**Intangibles Intelligence (7):**
14. softSkills: Emotional intelligence, adaptability, resilience, empathy, conflict resolution
15. leadershipPhilosophy: Core beliefs about leadership, coaching approach, management style
16. executivePresence: Gravitas, credibility, how they command a room, personal brand
17. personalityTraits: Core characteristics (decisive, collaborative, innovative, analytical)
18. workStyle: Preferred work environment, autonomy vs collaboration, fast-paced vs methodical
19. values: Core principles, ethical standards, what drives career decisions
20. behavioralIndicators: Decision-making patterns, stress responses, learning style

Return as JSON with ALL applicable categories:
{
  "powerPhrases": [{ "phrase": "...", "context": "..." }],
  "transferableSkills": [{ "skill": "...", "level": "expert|advanced|proficient", "evidence": "..." }],
  "hiddenCompetencies": [{ "competency": "...", "description": "...", "potential": "..." }],
  "businessImpacts": [{ "impact": "...", "metrics": {...}, "context": "...", "business_area": "..." }],
  "leadershipEvidence": [{ "example": "...", "team_size": 0, "type": "...", "outcome": "..." }],
  "technicalDepth": [{ "technology": "...", "proficiency": "...", "achievements": "..." }],
  "projects": [{ "name": "...", "role": "...", "duration_months": 0, "results": "..." }],
  "industryExpertise": [{ "industry": "...", "knowledge": "...", "insights": "..." }],
  "problemSolving": [{ "problem": "...", "approach": "...", "solution": "...", "results": "..." }],
  "stakeholderMgmt": [{ "example": "...", "stakeholder_types": [...], "strategies": "..." }],
  "careerNarrative": [{ "stage": "...", "transition": "...", "direction": "..." }],
  "competitiveAdvantages": [{ "type": "...", "description": "...", "evidence": "..." }],
  "communication": [{ "type": "...", "example": "...", "impact": "..." }],
  "softSkills": [{ "skill_name": "...", "evidence": "...", "context": "..." }],
  "leadershipPhilosophy": [{ "philosophy_statement": "...", "supporting_evidence": "..." }],
  "executivePresence": [{ "presence_indicator": "...", "evidence": "..." }],
  "personalityTraits": [{ "trait_name": "...", "evidence": "..." }],
  "workStyle": [{ "style_aspect": "...", "evidence": "..." }],
  "values": [{ "value_name": "...", "evidence": "..." }],
  "behavioralIndicators": [{ "indicator_type": "...", "evidence": "..." }]
}

CRITICAL: Extract from ALL categories where evidence exists. Do NOT leave categories empty if there's ANY relevant intelligence. Be generous in extraction - this is for an executive's career vault.`;

    console.log('[EXTRACT-VAULT-INTELLIGENCE] Using Perplexity for deep analysis...');
    
    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: 'You are an expert career intelligence analyst extracting structured data from executive interview responses across ALL 20 intelligence categories. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.5,
        max_tokens: 4000,
        return_citations: false,
      },
      'extract-vault-intelligence',
      user.id
    );

    await logAIUsage(metrics);

    let intelligence;
    
    try {
      const content = response.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      intelligence = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      console.error('[EXTRACT-VAULT-INTELLIGENCE] Failed to parse:', e);
      intelligence = {};
    }

    console.log('[EXTRACT-VAULT-INTELLIGENCE] Categories extracted:', Object.keys(intelligence).filter(k => intelligence[k]?.length > 0));

    const insertPromises = [];
    let totalExtracted = 0;

    // Helper to determine quality tier based on content
    const determineQualityTier = (item: any): string => {
      const content = JSON.stringify(item).toLowerCase();
      if (content.includes('$') || content.includes('%') || content.includes('revenue') || content.includes('p&l')) {
        return 'executive';
      }
      if (content.includes('team') || content.includes('led') || content.includes('managed')) {
        return 'senior';
      }
      return 'mid';
    };

    // Core Intelligence (3)
    if (intelligence.powerPhrases?.length > 0) {
      totalExtracted += intelligence.powerPhrases.length;
      insertPromises.push(
        ...intelligence.powerPhrases.map((pp: any) =>
          supabase.from('vault_power_phrases').insert({
            vault_id: vaultId,
            user_id: user.id,
            milestone_id,
            power_phrase: pp.phrase,
            context: pp.context,
            category: 'achievement',
            confidence_score: 85,
            keywords: [],
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Interview response - Question: "${questionText.substring(0, 80)}..."`,
            ai_confidence: 0.70
          })
        )
      );
    }

    if (intelligence.transferableSkills?.length > 0) {
      totalExtracted += intelligence.transferableSkills.length;
      insertPromises.push(
        ...intelligence.transferableSkills.map((skill: any) =>
          supabase.from('vault_transferable_skills').insert({
            vault_id: vaultId,
            user_id: user.id,
            milestone_id,
            stated_skill: skill.skill,
            equivalent_skills: [],
            evidence: skill.evidence,
            confidence_score: 80,
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Interview response - Inferred from: "${skill.evidence?.substring(0, 80)}..."`,
            ai_confidence: 0.65
          })
        )
      );
    }

    if (intelligence.hiddenCompetencies?.length > 0) {
      totalExtracted += intelligence.hiddenCompetencies.length;
      insertPromises.push(
        ...intelligence.hiddenCompetencies.map((comp: any) =>
          supabase.from('vault_hidden_competencies').insert({
            vault_id: vaultId,
            user_id: user.id,
            milestone_id,
            competency_area: comp.competency,
            supporting_evidence: [],
            inferred_capability: comp.description,
            confidence_score: 75,
            certification_equivalent: comp.potential,
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Interview response - Inferred competency: "${comp.description?.substring(0, 80)}..."`,
            ai_confidence: 0.65
          })
        )
      );
    }

    // Intangibles Intelligence (7) - CRITICAL: These were missing!
    if (intelligence.softSkills?.length > 0) {
      totalExtracted += intelligence.softSkills.length;
      insertPromises.push(
        ...intelligence.softSkills.map((soft: any) =>
          supabase.from('vault_soft_skills').insert({
            vault_id: vaultId,
            user_id: user.id,
            skill_name: soft.skill_name,
            examples: soft.evidence || soft.context || '',
            impact: soft.impact || null,
            proficiency_level: soft.proficiency_level || determineQualityTier(soft),
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Interview response - Inferred from behavior: "${(soft.evidence || soft.context || '').substring(0, 80)}..."`,
            ai_confidence: 0.60
          })
        )
      );
    }

    if (intelligence.leadershipPhilosophy?.length > 0) {
      totalExtracted += intelligence.leadershipPhilosophy.length;
      insertPromises.push(
        ...intelligence.leadershipPhilosophy.map((phil: any) =>
          supabase.from('vault_leadership_philosophy').insert({
            vault_id: vaultId,
            user_id: user.id,
            philosophy_statement: phil.philosophy_statement,
            leadership_style: phil.leadership_style || null,
            real_world_application: phil.supporting_evidence || null,
            core_principles: phil.core_principles || null,
            quality_tier: 'assumed',
            needs_user_review: true,
            inferred_from: `Interview response - Inferred leadership approach`,
            ai_confidence: 0.55
          })
        )
      );
    }

    if (intelligence.executivePresence?.length > 0) {
      totalExtracted += intelligence.executivePresence.length;
      insertPromises.push(
        ...intelligence.executivePresence.map((pres: any) =>
          supabase.from('vault_executive_presence').insert({
            vault_id: vaultId,
            user_id: user.id,
            presence_indicator: pres.presence_indicator,
            situational_example: pres.evidence || '',
            brand_alignment: pres.brand_alignment || null,
            perceived_impact: pres.perceived_impact || null
          })
        )
      );
    }

    if (intelligence.personalityTraits?.length > 0) {
      totalExtracted += intelligence.personalityTraits.length;
      insertPromises.push(
        ...intelligence.personalityTraits.map((trait: any) =>
          supabase.from('vault_personality_traits').insert({
            vault_id: vaultId,
            user_id: user.id,
            trait_name: trait.trait_name,
            behavioral_evidence: trait.evidence || '',
            work_context: trait.work_context || null,
            strength_or_growth: trait.strength_or_growth || null
          })
        )
      );
    }

    if (intelligence.workStyle?.length > 0) {
      totalExtracted += intelligence.workStyle.length;
      insertPromises.push(
        ...intelligence.workStyle.map((style: any) =>
          supabase.from('vault_work_style').insert({
            vault_id: vaultId,
            user_id: user.id,
            preference_area: style.style_aspect || style.preference_area || '',
            preference_description: style.evidence || '',
            examples: style.examples || null,
            ideal_environment: style.ideal_environment || null
          })
        )
      );
    }

    if (intelligence.values?.length > 0) {
      totalExtracted += intelligence.values.length;
      insertPromises.push(
        ...intelligence.values.map((value: any) =>
          supabase.from('vault_values_motivations').insert({
            vault_id: vaultId,
            user_id: user.id,
            value_name: value.value_name,
            manifestation: value.evidence || '',
            importance_level: value.importance_level || null,
            career_decisions_influenced: value.career_decisions_influenced || null
          })
        )
      );
    }

    if (intelligence.behavioralIndicators?.length > 0) {
      totalExtracted += intelligence.behavioralIndicators.length;
      insertPromises.push(
        ...intelligence.behavioralIndicators.map((indicator: any) =>
          supabase.from('vault_behavioral_indicators').insert({
            vault_id: vaultId,
            user_id: user.id,
            indicator_type: indicator.indicator_type,
            specific_behavior: indicator.evidence || '',
            context: indicator.context || null,
            outcome_pattern: indicator.outcome_pattern || null
          })
        )
      );
    }

    console.log(`[EXTRACT-VAULT-INTELLIGENCE] Inserting ${totalExtracted} intelligence items...`);
    await Promise.all(insertPromises);

    // Update milestone intelligence counter if applicable
    if (milestone_id) {
      await supabase
        .from('vault_resume_milestones')
        .update({ intelligence_extracted: totalExtracted })
        .eq('id', milestone_id);
    }

    // Update career vault totals
    const { data: counts } = await supabase.rpc('count_vault_intelligence', { vault_id_param: vaultId });
    
    if (counts) {
      await supabase
        .from('career_vault')
        .update({
          total_power_phrases: counts.power_phrases || 0,
          total_transferable_skills: counts.transferable_skills || 0,
          total_hidden_competencies: counts.hidden_competencies || 0,
          total_soft_skills: counts.soft_skills || 0,
          total_leadership_philosophy: counts.leadership_philosophy || 0,
          total_executive_presence: counts.executive_presence || 0,
          total_personality_traits: counts.personality_traits || 0,
          total_work_style: counts.work_style || 0,
          total_values: counts.values || 0,
          total_behavioral_indicators: counts.behavioral_indicators || 0,
        })
        .eq('id', vaultId);
    }

    console.log(`[EXTRACT-VAULT-INTELLIGENCE] Success! Extracted ${totalExtracted} items`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalExtracted,
        categories: Object.keys(intelligence).filter(k => intelligence[k]?.length > 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EXTRACT-VAULT-INTELLIGENCE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

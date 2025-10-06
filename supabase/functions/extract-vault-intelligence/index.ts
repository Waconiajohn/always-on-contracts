import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) throw new Error('Unauthorized');

    const { responseText, questionText, vaultId } = await req.json();

    console.log('[EXTRACT-VAULT-INTELLIGENCE] Analyzing response:', responseText.substring(0, 100) + '...');

    const systemPrompt = `You are an expert career intelligence analyst. Extract structured intelligence from interview responses across ALL 20 categories (13 original + 7 intangibles).`;

    const prompt = `Analyze this interview response and extract career intelligence across ALL 20 categories.

QUESTION ASKED:
${questionText}

USER'S RESPONSE:
${responseText}

Extract intelligence across these categories:

**Core Intelligence (Original 3):**
1. powerPhrases: Action-packed achievement statements with strong verbs
2. transferableSkills: Core competencies applicable across roles
3. hiddenCompetencies: Unique capabilities that might be undervalued

**Expanded Intelligence (Original 10):**
4. businessImpacts: Quantified business results with metrics
5. leadershipEvidence: Leadership and management examples
6. technicalDepth: Technical skills, tools, technologies
7. projects: Detailed project experiences
8. industryExpertise: Domain knowledge and insights
9. problemSolving: Complex problems solved using structured approaches
10. stakeholderMgmt: Stakeholder relationship and influence examples
11. careerNarrative: Career progression insights
12. competitiveAdvantages: Unique differentiators
13. communication: Communication and collaboration examples

**PHASE 3 - Intangibles Intelligence (New 7):**
14. softSkills: Emotional intelligence, adaptability, resilience, empathy, conflict resolution
15. leadershipPhilosophy: Core beliefs about leadership, management style, coaching approach
16. executivePresence: Gravitas, communication impact, credibility, personal brand signals
17. personalityTraits: MBTI-like traits, strengths/weaknesses, behavioral patterns
18. workStyle: Preferred work environment, collaboration style, autonomy vs teamwork
19. values: Core principles, ethical standards, career motivators, what drives decisions
20. behavioralIndicators: Decision-making patterns, stress responses, learning style

Return as JSON with ALL applicable categories:
{
  "powerPhrases": [{ "phrase": "...", "context": "..." }],
  "transferableSkills": [{ "skill": "...", "level": "...", "evidence": "..." }],
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
  "softSkills": [{ "skill_name": "...", "examples": "...", "impact": "...", "proficiency_level": "..." }],
  "leadershipPhilosophy": [{ "philosophy_statement": "...", "leadership_style": "...", "core_principles": [...], "real_world_application": "..." }],
  "executivePresence": [{ "presence_indicator": "...", "situational_example": "...", "perceived_impact": "...", "brand_alignment": "..." }],
  "personalityTraits": [{ "trait_name": "...", "behavioral_evidence": "...", "work_context": "...", "strength_or_growth": "strength|growth_area" }],
  "workStyle": [{ "preference_area": "...", "preference_description": "...", "examples": "...", "ideal_environment": "..." }],
  "values": [{ "value_name": "...", "importance_level": "core|important|nice_to_have", "manifestation": "...", "career_decisions_influenced": "..." }],
  "behavioralIndicators": [{ "indicator_type": "...", "specific_behavior": "...", "context": "...", "outcome_pattern": "..." }]
}

Only include categories where you found relevant intelligence. Empty arrays are acceptable.`;

    // Use Gemini 2.5 Flash for intelligence extraction
    console.log('[EXTRACT-VAULT-INTELLIGENCE] Using Gemini 2.5 Flash for analysis...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EXTRACT-VAULT-INTELLIGENCE] AI error:', response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    let intelligence;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      intelligence = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('[EXTRACT-VAULT-INTELLIGENCE] Failed to parse:', e);
      intelligence = {};
    }

    console.log('[EXTRACT-VAULT-INTELLIGENCE] Extracted intelligence:', JSON.stringify(intelligence, null, 2).substring(0, 500) + '...');

    const insertPromises = [];
    let totalExtracted = 0;

    // Core Intelligence (Original 3)
    if (intelligence.powerPhrases?.length > 0) {
      totalExtracted += intelligence.powerPhrases.length;
      insertPromises.push(
        ...intelligence.powerPhrases.map((pp: any) =>
          supabase.from('vault_power_phrases').insert({
            vault_id: vaultId,
            user_id: user.id,
            power_phrase: pp.phrase,
            context: pp.context,
            category: 'achievement',
            confidence_score: 80,
            keywords: []
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
            stated_skill: skill.skill,
            equivalent_skills: [],
            evidence: skill.evidence,
            confidence_score: 75
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
            competency_area: comp.competency,
            supporting_evidence: [],
            inferred_capability: comp.description,
            confidence_score: 70,
            certification_equivalent: comp.potential
          })
        )
      );
    }

    // Expanded Intelligence (Original 10)
    if (intelligence.businessImpacts?.length > 0) {
      totalExtracted += intelligence.businessImpacts.length;
      insertPromises.push(
        ...intelligence.businessImpacts.map((impact: any) =>
          supabase.from('vault_business_impacts').insert({
            vault_id: vaultId,
            user_id: user.id,
            impact_summary: impact.impact,
            quantified_metrics: impact.metrics,
            context: impact.context,
            business_area: impact.business_area,
            confidence_score: 85
          })
        )
      );
    }

    if (intelligence.leadershipEvidence?.length > 0) {
      totalExtracted += intelligence.leadershipEvidence.length;
      insertPromises.push(
        ...intelligence.leadershipEvidence.map((lead: any) =>
          supabase.from('vault_leadership_evidence').insert({
            vault_id: vaultId,
            user_id: user.id,
            leadership_example: lead.example,
            team_size: lead.team_size,
            leadership_type: lead.type,
            outcome: lead.outcome,
            confidence_score: 82
          })
        )
      );
    }

    if (intelligence.technicalDepth?.length > 0) {
      totalExtracted += intelligence.technicalDepth.length;
      insertPromises.push(
        ...intelligence.technicalDepth.map((tech: any) =>
          supabase.from('vault_technical_depth').insert({
            vault_id: vaultId,
            user_id: user.id,
            technology: tech.technology,
            proficiency_level: tech.proficiency,
            achievements: tech.achievements,
            confidence_score: 78
          })
        )
      );
    }

    if (intelligence.projects?.length > 0) {
      totalExtracted += intelligence.projects.length;
      insertPromises.push(
        ...intelligence.projects.map((proj: any) =>
          supabase.from('vault_projects').insert({
            vault_id: vaultId,
            user_id: user.id,
            project_name: proj.name,
            role: proj.role,
            duration_months: proj.duration_months,
            results: proj.results,
            confidence_score: 80
          })
        )
      );
    }

    if (intelligence.industryExpertise?.length > 0) {
      totalExtracted += intelligence.industryExpertise.length;
      insertPromises.push(
        ...intelligence.industryExpertise.map((exp: any) =>
          supabase.from('vault_industry_expertise').insert({
            vault_id: vaultId,
            user_id: user.id,
            industry: exp.industry,
            knowledge_area: exp.knowledge,
            insights: exp.insights,
            confidence_score: 77
          })
        )
      );
    }

    if (intelligence.problemSolving?.length > 0) {
      totalExtracted += intelligence.problemSolving.length;
      insertPromises.push(
        ...intelligence.problemSolving.map((prob: any) =>
          supabase.from('vault_problem_solving').insert({
            vault_id: vaultId,
            user_id: user.id,
            problem_description: prob.problem,
            approach: prob.approach,
            solution: prob.solution,
            results: prob.results,
            confidence_score: 83
          })
        )
      );
    }

    if (intelligence.stakeholderMgmt?.length > 0) {
      totalExtracted += intelligence.stakeholderMgmt.length;
      insertPromises.push(
        ...intelligence.stakeholderMgmt.map((stake: any) =>
          supabase.from('vault_stakeholder_mgmt').insert({
            vault_id: vaultId,
            user_id: user.id,
            situation_example: stake.example,
            stakeholder_types: stake.stakeholder_types,
            strategies_used: stake.strategies,
            confidence_score: 79
          })
        )
      );
    }

    if (intelligence.careerNarrative?.length > 0) {
      totalExtracted += intelligence.careerNarrative.length;
      insertPromises.push(
        ...intelligence.careerNarrative.map((narr: any) =>
          supabase.from('vault_career_narrative').insert({
            vault_id: vaultId,
            user_id: user.id,
            career_stage: narr.stage,
            transition_details: narr.transition,
            future_direction: narr.direction,
            confidence_score: 76
          })
        )
      );
    }

    if (intelligence.competitiveAdvantages?.length > 0) {
      totalExtracted += intelligence.competitiveAdvantages.length;
      insertPromises.push(
        ...intelligence.competitiveAdvantages.map((adv: any) =>
          supabase.from('vault_competitive_advantages').insert({
            vault_id: vaultId,
            user_id: user.id,
            advantage_type: adv.type,
            advantage_description: adv.description,
            supporting_evidence: adv.evidence,
            confidence_score: 81
          })
        )
      );
    }

    if (intelligence.communication?.length > 0) {
      totalExtracted += intelligence.communication.length;
      insertPromises.push(
        ...intelligence.communication.map((comm: any) =>
          supabase.from('vault_communication').insert({
            vault_id: vaultId,
            user_id: user.id,
            communication_type: comm.type,
            example: comm.example,
            impact: comm.impact,
            confidence_score: 78
          })
        )
      );
    }

    // PHASE 3 - Intangibles Intelligence (New 7)
    if (intelligence.softSkills?.length > 0) {
      totalExtracted += intelligence.softSkills.length;
      insertPromises.push(
        ...intelligence.softSkills.map((soft: any) =>
          supabase.from('vault_soft_skills').insert({
            vault_id: vaultId,
            user_id: user.id,
            skill_name: soft.skill_name,
            examples: soft.examples,
            impact: soft.impact,
            proficiency_level: soft.proficiency_level,
            confidence_score: 75
          })
        )
      );
    }

    if (intelligence.leadershipPhilosophy?.length > 0) {
      totalExtracted += intelligence.leadershipPhilosophy.length;
      insertPromises.push(
        ...intelligence.leadershipPhilosophy.map((leadPhil: any) =>
          supabase.from('vault_leadership_philosophies').insert({
            vault_id: vaultId,
            user_id: user.id,
            philosophy_statement: leadPhil.philosophy_statement,
            leadership_style: leadPhil.leadership_style,
            core_principles: leadPhil.core_principles,
            real_world_application: leadPhil.real_world_application,
            confidence_score: 77
          })
        )
      );
    }

    if (intelligence.executivePresence?.length > 0) {
      totalExtracted += intelligence.executivePresence.length;
      insertPromises.push(
        ...intelligence.executivePresence.map((execPres: any) =>
          supabase.from('vault_executive_presence').insert({
            vault_id: vaultId,
            user_id: user.id,
            presence_indicator: execPres.presence_indicator,
            situational_example: execPres.situational_example,
            perceived_impact: execPres.perceived_impact,
            brand_alignment: execPres.brand_alignment,
            confidence_score: 79
          })
        )
      );
    }

    if (intelligence.personalityTraits?.length > 0) {
      totalExtracted += intelligence.personalityTraits.length;
      insertPromises.push(
        ...intelligence.personalityTraits.map((persTrait: any) =>
          supabase.from('vault_personality_traits').insert({
            vault_id: vaultId,
            user_id: user.id,
            trait_name: persTrait.trait_name,
            behavioral_evidence: persTrait.behavioral_evidence,
            work_context: persTrait.work_context,
            strength_or_growth: persTrait.strength_or_growth,
            confidence_score: 76
          })
        )
      );
    }

    if (intelligence.workStyle?.length > 0) {
      totalExtracted += intelligence.workStyle.length;
      insertPromises.push(
        ...intelligence.workStyle.map((workStyle: any) =>
          supabase.from('vault_work_styles').insert({
            vault_id: vaultId,
            user_id: user.id,
            preference_area: workStyle.preference_area,
            preference_description: workStyle.preference_description,
            examples: workStyle.examples,
            ideal_environment: workStyle.ideal_environment,
            confidence_score: 78
          })
        )
      );
    }

    if (intelligence.values?.length > 0) {
      totalExtracted += intelligence.values.length;
      insertPromises.push(
        ...intelligence.values.map((value: any) =>
          supabase.from('vault_values').insert({
            vault_id: vaultId,
            user_id: user.id,
            value_name: value.value_name,
            importance_level: value.importance_level,
            manifestation: value.manifestation,
            career_decisions_influenced: value.career_decisions_influenced,
            confidence_score: 80
          })
        )
      );
    }

    if (intelligence.behavioralIndicators?.length > 0) {
      totalExtracted += intelligence.behavioralIndicators.length;
      insertPromises.push(
        ...intelligence.behavioralIndicators.map((behavInd: any) =>
          supabase.from('vault_behavioral_indicators').insert({
            vault_id: vaultId,
            user_id: user.id,
            indicator_type: behavInd.indicator_type,
            specific_behavior: behavInd.specific_behavior,
            context: behavInd.context,
            outcome_pattern: behavInd.outcome_pattern,
            confidence_score: 77
          })
        )
      );
    }

    await Promise.all(insertPromises);

    // Get counts for all categories
    const [
      ppCount, tsCount, hcCount, biCount, leCount,
      tdCount, projCount, ieCount, psCount, smCount,
      cnCount, caCount, commCount, ssCount, lpCount,
      epCount, ptCount, wsCount, vCount, bi2Count
    ] = await Promise.all([
      supabase.from('vault_power_phrases').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_business_impacts').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_leadership_evidence').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_technical_depth').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_projects').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_industry_expertise').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_problem_solving').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_stakeholder_mgmt').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_career_narrative').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_competitive_advantages').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_communication').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophies').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_personality_traits').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_work_styles').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_values').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId),
      supabase.from('vault_behavioral_indicators').select('id', { count: 'exact', head: true }).eq('vault_id', vaultId)
    ]);

    const totalCounts = {
      power_phrases: ppCount.count || 0,
      transferable_skills: tsCount.count || 0,
      hidden_competencies: hcCount.count || 0,
      business_impacts: biCount.count || 0,
      leadership_evidence: leCount.count || 0,
      technical_depth: tdCount.count || 0,
      projects: projCount.count || 0,
      industry_expertise: ieCount.count || 0,
      problem_solving: psCount.count || 0,
      stakeholder_mgmt: smCount.count || 0,
      career_narrative: cnCount.count || 0,
      competitive_advantages: caCount.count || 0,
      communication: commCount.count || 0,
      soft_skills: ssCount.count || 0,
      leadership_philosophies: lpCount.count || 0,
      executive_presence: epCount.count || 0,
      personality_traits: ptCount.count || 0,
      work_styles: wsCount.count || 0,
      values: vCount.count || 0,
      behavioral_indicators: bi2Count.count || 0
    };

    // Update vault with new counts
    await supabase
      .from('career_vault')
      .update({
        total_power_phrases: totalCounts.power_phrases,
        total_transferable_skills: totalCounts.transferable_skills,
        total_hidden_competencies: totalCounts.hidden_competencies,
        total_business_impacts: totalCounts.business_impacts,
        total_leadership_evidence: totalCounts.leadership_evidence,
        total_technical_depth: totalCounts.technical_depth,
        total_projects: totalCounts.projects,
        total_industry_expertise: totalCounts.industry_expertise,
        total_problem_solving: totalCounts.problem_solving,
        total_stakeholder_mgmt: totalCounts.stakeholder_mgmt,
        total_career_narrative: totalCounts.career_narrative,
        total_competitive_advantages: totalCounts.competitive_advantages,
        total_communication: totalCounts.communication,
        total_soft_skills: totalCounts.soft_skills,
        total_leadership_philosophies: totalCounts.leadership_philosophies,
        total_executive_presence: totalCounts.executive_presence,
        total_personality_traits: totalCounts.personality_traits,
        total_work_styles: totalCounts.work_styles,
        total_values: totalCounts.values,
        total_behavioral_indicators: totalCounts.behavioral_indicators,
        last_updated_at: new Date().toISOString()
      })
      .eq('id', vaultId);

    console.log('[EXTRACT-VAULT-INTELLIGENCE] Extracted', totalExtracted, 'intelligence items');

    return new Response(JSON.stringify({
      success: true,
      extracted: totalExtracted,
      counts: totalCounts
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[EXTRACT-VAULT-INTELLIGENCE] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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

    const { responseText, questionText, warChestId } = await req.json();

    console.log('[EXTRACT-INTELLIGENCE] Analyzing response:', responseText.substring(0, 100) + '...');

    const systemPrompt = `You are an expert career intelligence analyst. Extract structured intelligence from interview responses across ALL 13 categories.`;

    const prompt = `Analyze this interview response and extract career intelligence across ALL 13 categories.

QUESTION ASKED:
${questionText}

USER'S RESPONSE:
${responseText}

Extract intelligence across these categories:

**Core (Original 3):**
1. powerPhrases: Action-packed achievement statements with strong verbs
2. transferableSkills: Core competencies applicable across roles
3. hiddenCompetencies: Unique capabilities that might be undervalued

**Expanded (New 10):**
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
  "communication": [{ "type": "...", "example": "...", "impact": "..." }]
}

Only include categories where you found relevant intelligence. Empty arrays are acceptable.`;

    // Use Gemini 2.5 Flash Thinking for deep intelligence extraction
    console.log('[EXTRACT-INTELLIGENCE] Using Gemini 2.5 Flash Thinking for deep analysis...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-thinking',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[EXTRACT-INTELLIGENCE] AI error:', response.status, errorText);
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;

    let intelligence;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      intelligence = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('[EXTRACT-INTELLIGENCE] Failed to parse:', e);
      intelligence = {};
    }

    console.log('[EXTRACT-INTELLIGENCE] Extracted intelligence:', JSON.stringify(intelligence, null, 2).substring(0, 500) + '...');

    // Insert extracted intelligence across ALL categories
    const insertPromises = [];
    let totalExtracted = 0;

    // Core Intelligence (Original 3)
    if (intelligence.powerPhrases?.length > 0) {
      totalExtracted += intelligence.powerPhrases.length;
      insertPromises.push(
        ...intelligence.powerPhrases.map((pp: any) =>
          supabase.from('war_chest_power_phrases').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            phrase: pp.phrase,
            context: pp.context
          })
        )
      );
    }

    if (intelligence.transferableSkills?.length > 0) {
      totalExtracted += intelligence.transferableSkills.length;
      insertPromises.push(
        ...intelligence.transferableSkills.map((skill: any) =>
          supabase.from('war_chest_transferable_skills').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            skill_name: skill.skill,
            proficiency_level: skill.level,
            evidence: skill.evidence
          })
        )
      );
    }

    if (intelligence.hiddenCompetencies?.length > 0) {
      totalExtracted += intelligence.hiddenCompetencies.length;
      insertPromises.push(
        ...intelligence.hiddenCompetencies.map((comp: any) =>
          supabase.from('war_chest_hidden_competencies').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            competency: comp.competency,
            description: comp.description,
            potential_value: comp.potential
          })
        )
      );
    }

    // Expanded Intelligence (New 10)
    if (intelligence.businessImpacts?.length > 0) {
      totalExtracted += intelligence.businessImpacts.length;
      insertPromises.push(
        ...intelligence.businessImpacts.map((impact: any) =>
          supabase.from('war_chest_business_impact').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            impact_statement: impact.impact,
            metrics: impact.metrics || {},
            context: impact.context,
            business_area: impact.business_area
          })
        )
      );
    }

    if (intelligence.leadershipEvidence?.length > 0) {
      totalExtracted += intelligence.leadershipEvidence.length;
      insertPromises.push(
        ...intelligence.leadershipEvidence.map((lead: any) =>
          supabase.from('war_chest_leadership_evidence').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            leadership_example: lead.example,
            team_size: lead.team_size,
            leadership_type: lead.type,
            outcome: lead.outcome
          })
        )
      );
    }

    if (intelligence.technicalDepth?.length > 0) {
      totalExtracted += intelligence.technicalDepth.length;
      insertPromises.push(
        ...intelligence.technicalDepth.map((tech: any) =>
          supabase.from('war_chest_technical_depth').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            technology: tech.technology,
            proficiency_level: tech.proficiency,
            specific_achievements: tech.achievements
          })
        )
      );
    }

    if (intelligence.projects?.length > 0) {
      totalExtracted += intelligence.projects.length;
      insertPromises.push(
        ...intelligence.projects.map((proj: any) =>
          supabase.from('war_chest_projects').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            project_name: proj.name,
            role: proj.role,
            duration_months: proj.duration_months,
            results_achieved: proj.results
          })
        )
      );
    }

    if (intelligence.industryExpertise?.length > 0) {
      totalExtracted += intelligence.industryExpertise.length;
      insertPromises.push(
        ...intelligence.industryExpertise.map((ind: any) =>
          supabase.from('war_chest_industry_expertise').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            industry: ind.industry,
            specific_knowledge: ind.knowledge,
            market_insights: ind.insights
          })
        )
      );
    }

    if (intelligence.problemSolving?.length > 0) {
      totalExtracted += intelligence.problemSolving.length;
      insertPromises.push(
        ...intelligence.problemSolving.map((prob: any) =>
          supabase.from('war_chest_problem_solving').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            problem_description: prob.problem,
            approach_taken: prob.approach,
            solution_implemented: prob.solution,
            results: prob.results
          })
        )
      );
    }

    if (intelligence.stakeholderMgmt?.length > 0) {
      totalExtracted += intelligence.stakeholderMgmt.length;
      insertPromises.push(
        ...intelligence.stakeholderMgmt.map((stake: any) =>
          supabase.from('war_chest_stakeholder_mgmt').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            relationship_building_example: stake.example,
            stakeholder_types: stake.stakeholder_types || [],
            influence_strategies: stake.strategies
          })
        )
      );
    }

    if (intelligence.careerNarrative?.length > 0) {
      totalExtracted += intelligence.careerNarrative.length;
      insertPromises.push(
        ...intelligence.careerNarrative.map((narr: any) =>
          supabase.from('war_chest_career_narrative').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            career_stage: narr.stage,
            key_transition: narr.transition,
            strategic_direction: narr.direction
          })
        )
      );
    }

    if (intelligence.competitiveAdvantages?.length > 0) {
      totalExtracted += intelligence.competitiveAdvantages.length;
      insertPromises.push(
        ...intelligence.competitiveAdvantages.map((comp: any) =>
          supabase.from('war_chest_competitive_advantages').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            advantage_type: comp.type,
            description: comp.description,
            evidence: comp.evidence
          })
        )
      );
    }

    if (intelligence.communication?.length > 0) {
      totalExtracted += intelligence.communication.length;
      insertPromises.push(
        ...intelligence.communication.map((comm: any) =>
          supabase.from('war_chest_communication').insert({
            war_chest_id: warChestId,
            user_id: user.id,
            communication_type: comm.type,
            example: comm.example,
            impact: comm.impact
          })
        )
      );
    }

    await Promise.all(insertPromises);
    console.log(`[EXTRACT-INTELLIGENCE] Successfully inserted ${totalExtracted} intelligence items`);

    // Get updated counts for ALL categories
    const [
      ppCount, tsCount, hcCount,
      biCount, leCount, tdCount, pjCount, ieCount, psCount, smCount, cnCount, caCount, ceCount
    ] = await Promise.all([
      supabase.from('war_chest_power_phrases').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_transferable_skills').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_hidden_competencies').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_business_impact').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_leadership_evidence').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_technical_depth').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_projects').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_industry_expertise').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_problem_solving').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_stakeholder_mgmt').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_career_narrative').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_competitive_advantages').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
      supabase.from('war_chest_communication').select('id', { count: 'exact', head: true }).eq('war_chest_id', warChestId),
    ]);

    // Update the war chest with ALL new counts
    await supabase
      .from('career_war_chest')
      .update({
        total_power_phrases: ppCount.count || 0,
        total_transferable_skills: tsCount.count || 0,
        total_hidden_competencies: hcCount.count || 0,
        total_business_impacts: biCount.count || 0,
        total_leadership_examples: leCount.count || 0,
        total_technical_skills: tdCount.count || 0,
        total_projects: pjCount.count || 0,
        total_industry_expertise: ieCount.count || 0,
        total_problem_solving: psCount.count || 0,
        total_stakeholder_examples: smCount.count || 0,
        total_career_narrative: cnCount.count || 0,
        total_competitive_advantages: caCount.count || 0,
        total_communication_examples: ceCount.count || 0,
        last_updated_at: new Date().toISOString(),
      })
      .eq('id', warChestId);

    const totalIntelligence = (ppCount.count || 0) + (tsCount.count || 0) + (hcCount.count || 0) +
      (biCount.count || 0) + (leCount.count || 0) + (tdCount.count || 0) + (pjCount.count || 0) +
      (ieCount.count || 0) + (psCount.count || 0) + (smCount.count || 0) + (cnCount.count || 0) +
      (caCount.count || 0) + (ceCount.count || 0);

    console.log(`[EXTRACT-INTELLIGENCE] Total intelligence in War Chest: ${totalIntelligence}`);

    return new Response(JSON.stringify({
      success: true,
      totalExtracted,
      totalIntelligence
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[EXTRACT-INTELLIGENCE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

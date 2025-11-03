// =====================================================
// GENERATE COMPLETION BENCHMARK - Career Vault 2.0
// =====================================================
// COMPETITIVE POSITIONING ANALYSIS
//
// This function compares your completed vault against
// industry benchmarks to show exactly where you stand
// vs top executives in your target roles.
//
// UNIQUE VALUE:
// - Percentile ranking (top X% of executives)
// - Strengths vs Opportunities breakdown
// - Gap analysis with impact estimates
// - Actionable recommendations with priorities
//
// MARKETING MESSAGE:
// "Unlike resume builders that just say 'looks good',
// we show EXACTLY how your career intelligence compares
// to the top 10% of executives in your industry—with
// specific recommendations to close any gaps."
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

interface BenchmarkRequest {
  vaultId: string;
  targetRoles: string[];
  targetIndustries: string[];
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

    const {
      vaultId,
      targetRoles,
      targetIndustries,
    }: BenchmarkRequest = await req.json();

    console.log('📊 GENERATING COMPLETION BENCHMARK:', {
      vaultId,
      targetRoles,
      targetIndustries,
      userId: user.id,
    });

    // Fetch vault statistics
    const { data: vaultStats } = await supabase
      .rpc('get_vault_statistics', { p_vault_id: vaultId });

    if (!vaultStats) {
      throw new Error('Could not fetch vault statistics');
    }

    // Fetch industry research for benchmarks
    const { data: industryResearch } = await supabase
      .from('vault_industry_research')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })
      .limit(1);

    const benchmarks = industryResearch?.[0]?.results || {};

    // Fetch actual vault items for detailed analysis
    const [powerPhrases, skills, competencies, softSkills, leadershipPhilosophy, executivePresence] = await Promise.all([
      supabase.from('vault_power_phrases').select('*').eq('vault_id', vaultId),
      supabase.from('vault_transferable_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_hidden_competencies').select('*').eq('vault_id', vaultId),
      supabase.from('vault_soft_skills').select('*').eq('vault_id', vaultId),
      supabase.from('vault_leadership_philosophy').select('*').eq('vault_id', vaultId),
      supabase.from('vault_executive_presence').select('*').eq('vault_id', vaultId),
    ]);

    // Build AI prompt for benchmark analysis
    const benchmarkPrompt = `You are an executive career intelligence analyst comparing a completed career vault against industry standards.

TARGET ROLES: ${targetRoles.join(', ')}
TARGET INDUSTRIES: ${targetIndustries.join(', ')}

VAULT STATISTICS:
- Total Items: ${vaultStats.totalItems || 0}
- Quality Breakdown: ${JSON.stringify(vaultStats.qualityBreakdown || {})}
- Category Coverage: ${JSON.stringify(vaultStats.categoryBreakdown || {})}
- Vault Strength: ${vaultStats.vaultStrength || 0}%

INDUSTRY BENCHMARKS:
- Must-Have Skills: ${benchmarks.mustHaveSkills?.slice(0, 20).join(', ') || 'N/A'}
- Preferred Skills: ${benchmarks.preferredSkills?.slice(0, 15).join(', ') || 'N/A'}
- Leadership Competencies: ${benchmarks.executiveCompetencies?.slice(0, 10).join(', ') || 'N/A'}
- Expected Experience Level: ${benchmarks.seniorityExpectations || 'N/A'}

ACTUAL VAULT CONTENTS SUMMARY:
- Power Phrases: ${powerPhrases.data?.length || 0} items
- Transferable Skills: ${skills.data?.length || 0} items
- Hidden Competencies: ${competencies.data?.length || 0} items
- Soft Skills: ${softSkills.data?.length || 0} items
- Leadership Philosophy: ${leadershipPhilosophy.data?.length || 0} items
- Executive Presence: ${executivePresence.data?.length || 0} items

SAMPLE POWER PHRASES (top 5):
${powerPhrases.data?.slice(0, 5).map((pp: any) => `- ${pp.power_phrase}`).join('\n') || 'None'}

SAMPLE SKILLS (top 10):
${skills.data?.slice(0, 10).map((s: any) => `- ${s.stated_skill}`).join('\n') || 'None'}

TASK: Perform competitive positioning analysis.

ANALYSIS REQUIREMENTS:
1. **Percentile Calculation**: Based on vault strength, quality tier distribution, and category coverage, estimate where this executive ranks vs peers (top X%)
2. **Strengths**: Identify 5-7 areas where vault EXCEEDS industry standards
3. **Opportunities**: Identify 3-5 areas where vault MEETS standards but could be enhanced
4. **Gaps**: Identify 2-4 critical areas where vault FALLS SHORT vs top performers
5. **Recommendations**: Provide 5-8 specific, actionable recommendations with impact estimates

PERCENTILE GUIDANCE:
- 95-100% vault strength + 40+ gold items = Top 5%
- 90-94% vault strength + 30+ gold items = Top 10%
- 85-89% vault strength + 20+ gold items = Top 15%
- 80-84% vault strength + 15+ gold items = Top 20%
- 75-79% vault strength = Top 25%
- Below 75% = Top 30%+

RETURN VALID JSON ONLY (no markdown, no explanations):
{
  "percentileRanking": {
    "percentile": 10,
    "ranking": "top 10%",
    "comparisonStatement": "You rank higher than 90% of executives in your target roles"
  },
  "overallScore": {
    "vaultStrength": 92,
    "qualityScore": 88,
    "coverageScore": 95,
    "competitivenessRating": "Elite"
  },
  "strengths": [
    {
      "area": "Quantified Leadership Impact",
      "description": "Your vault contains 45 power phrases with specific metrics—exceeding the industry average of 25-30",
      "advantage": "Places you in top 15% for demonstrated executive impact",
      "examples": ["Reduced costs by 40% ($2M annually)", "Led team of 45 engineers"]
    }
  ],
  "opportunities": [
    {
      "area": "Industry-Specific Certifications",
      "description": "You have solid technical skills but could add 2-3 industry certifications",
      "impact": "Would increase credibility score by ~5%",
      "priority": "medium",
      "estimatedEffort": "1-2 weeks to add to profile"
    }
  ],
  "gaps": [
    {
      "area": "Board-Level Communication",
      "description": "No evidence of board presentations or C-suite stakeholder management",
      "impact": "Critical for VP+ roles—missing this puts you at 60th percentile vs 90th",
      "priority": "high",
      "howToFill": "Add specific examples of executive presentations or board communications"
    }
  ],
  "recommendations": [
    {
      "title": "Add Board Communication Examples",
      "description": "Include 2-3 specific instances where you presented to boards or senior executives",
      "impact": "high",
      "estimatedBoost": "+5-8% vault strength",
      "timeToImplement": "10 minutes",
      "category": "executive_presence"
    }
  ],
  "competitiveInsights": {
    "vsTopPerformers": "You match top performers in quantified achievements but trail in strategic leadership narrative",
    "marketPosition": "Strong technical executive profile—ready for Director to VP roles",
    "differentiators": ["Exceptional metrics documentation", "Clear career progression story"],
    "areasToWatch": ["Industry certifications becoming more common", "AI/ML skills increasingly expected"]
  }
}

NO MARKDOWN. ONLY JSON.`;

    // Call AI for benchmark analysis
    const { response, metrics } = await callPerplexity(
      {
        messages: [{ role: 'user', content: benchmarkPrompt }],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.3,
        max_tokens: 3000,
      },
      'generate-completion-benchmark',
      user.id
    );

    await logAIUsage(metrics);

    const aiContent = response.choices[0].message.content;

    // Parse JSON response
    let benchmarkAnalysis;
    try {
      const cleanedContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      benchmarkAnalysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('AI returned invalid JSON format');
    }

    // Store benchmark analysis in database
    const { error: insertError } = await supabase
      .from('vault_gap_analysis')
      .insert({
        vault_id: vaultId,
        user_id: user.id,
        analysis_type: 'completion_benchmark',
        identified_gaps: benchmarkAnalysis.gaps || [],
        competitive_insights: benchmarkAnalysis.competitiveInsights || {},
        recommendations: benchmarkAnalysis.recommendations || [],
        percentile_ranking: benchmarkAnalysis.percentileRanking?.percentile || 50,
        vault_strength_at_analysis: vaultStats.vaultStrength || 0,
      });

    if (insertError) {
      console.error('Failed to store benchmark analysis:', insertError);
      // Don't fail the request, just log
    }

    // Log activity
    await supabase.from('vault_activity_log').insert({
      vault_id: vaultId,
      user_id: user.id,
      activity_type: 'benchmark_generated',
      description: `Completion benchmark generated: ${benchmarkAnalysis.percentileRanking?.ranking || 'N/A'}`,
      metadata: {
        percentile: benchmarkAnalysis.percentileRanking?.percentile,
        vaultStrength: vaultStats.vaultStrength,
        strengthsCount: benchmarkAnalysis.strengths?.length || 0,
        gapsCount: benchmarkAnalysis.gaps?.length || 0,
      },
    });

    console.log('✅ BENCHMARK ANALYSIS COMPLETE:', {
      percentile: benchmarkAnalysis.percentileRanking?.percentile,
      strengths: benchmarkAnalysis.strengths?.length,
      gaps: benchmarkAnalysis.gaps?.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: benchmarkAnalysis,
        meta: {
          message: `🎯 Competitive Analysis Complete! You rank in the ${benchmarkAnalysis.percentileRanking?.ranking || 'top tier'} of executives.`,
          uniqueValue: `Unlike resume builders that just say "looks good", we show EXACTLY where you stand vs industry leaders—with ${benchmarkAnalysis.recommendations?.length || 0} specific recommendations to reach elite status.`,
          competitiveEdge: benchmarkAnalysis.percentileRanking?.percentile >= 90
            ? `You're in ELITE territory (${benchmarkAnalysis.percentileRanking?.ranking}). Your vault rivals the best executive profiles we've analyzed.`
            : benchmarkAnalysis.percentileRanking?.percentile >= 75
            ? `You're in STRONG position (${benchmarkAnalysis.percentileRanking?.ranking}). A few strategic additions could push you to elite status.`
            : `You have a SOLID foundation (${benchmarkAnalysis.percentileRanking?.ranking}). Our recommendations will accelerate you to top-tier status.`,
          nextStep: `Use these insights to fine-tune your vault, then leverage your intelligence for resume optimization, LinkedIn enhancement, and interview prep.`,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-completion-benchmark:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        userMessage: 'We encountered an issue generating your competitive benchmark. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

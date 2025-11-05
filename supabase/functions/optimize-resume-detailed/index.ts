import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResumeOptimizationResult {
  success: boolean;
  optimizedResume: string;
  analysis: {
    skillsMatchScore: number;
    experienceMatchScore: number;
    achievementsScore: number;
    keywordDensityScore: number;
    formatScore: number;
    overallScore: number;
  };
  improvements: string[];
  missingKeywords: string[];
  recommendations: string[];
}

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

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { resumeText, jobDescription } = await req.json();

    // Validate input
    if (!resumeText || resumeText.length < 100) {
      throw new Error('Resume must be at least 100 characters');
    }
    if (!jobDescription || jobDescription.length < 50) {
      throw new Error('Job description must be at least 50 characters');
    }

    console.log('[OPTIMIZE-RESUME] Starting for user:', user.id);

    // Fetch ALL Career Vault intelligence (get-vault-data fetches all 10 tables)
    const { data: intelligenceData, error: intelligenceError } = await supabase.functions.invoke(
      'get-vault-data',
      { 
        body: { userId: user.id },
        headers: { Authorization: authHeader } 
      }
    );

    const intelligence = intelligenceError ? null : intelligenceData?.data?.intelligence;
    
    if (intelligence) {
      console.log('[OPTIMIZE-RESUME] Career Vault loaded:', {
        powerPhrases: intelligence.counts.powerPhrases,
        businessImpacts: intelligence.counts.businessImpacts,
        confirmedSkills: intelligence.counts.technicalSkills
      });
    }

    // Build Career Vault context
    let vaultContext = '';
    if (intelligence) {
      const confirmedSkills = intelligence.technicalDepth.map((t: any) => 
        `${t.skill_name} (${t.proficiency_level}, ${t.years_experience || 'experienced'})`
      ).join(', ');

      const quantifiedAchievements = intelligence.businessImpacts.slice(0, 10).map((b: any) => 
        `- ${b.metric_type}: ${b.metric_value} | ${b.context || 'verified achievement'}`
      ).join('\n');

      const powerPhraseBank = intelligence.powerPhrases.slice(0, 15).map((p: any) => 
        `"${p.phrase}" (${p.category})`
      ).join(', ');

      vaultContext = `
CAREER VAULT INTELLIGENCE (Verified Career Data):

CONFIRMED SKILLS (${intelligence.counts.technicalSkills}):
${confirmedSkills}

QUANTIFIED ACHIEVEMENTS DATABASE (${intelligence.counts.businessImpacts} total, top 10):
${quantifiedAchievements}

ATS KEYWORD BANK (${intelligence.counts.powerPhrases} proven phrases, top 15):
${powerPhraseBank}

LEADERSHIP EVIDENCE (${intelligence.counts.leadershipExamples} examples):
${intelligence.leadershipEvidence.slice(0, 5).map((l: any) => `- ${l.evidence_type}: ${l.description}`).join('\n')}

INDUSTRY EXPERTISE:
${intelligence.industryExpertise.slice(0, 5).map((i: any) => `- ${i.industry_name} (${i.depth_level})`).join('\n')}

COMPETITIVE ADVANTAGES:
${intelligence.competitiveAdvantages.slice(0, 3).map((a: any) => `- ${a.advantage_description}`).join('\n')}

**OPTIMIZATION MANDATE:**
- Prioritize confirmed skills from Career Vault over inferred skills
- Use exact quantified achievements (metrics are verified, not estimated)
- Incorporate proven power phrases for ATS optimization
- Leverage competitive advantages to differentiate from other candidates
- Maintain consistency with established career narrative
`;
    }

    console.log('[OPTIMIZE-RESUME] Calling Perplexity API...');

    const { response, metrics } = await callPerplexity({
      messages: [
        {
          role: 'system',
          content: `ROLE: You are an elite resume optimization expert with 15+ years optimizing executive resumes for Fortune 500 roles and high-value contracts. You understand ATS systems, human recruiter psychology, and executive positioning.

EXPERTISE AREAS:
- ATS keyword optimization (beat 95%+ of applicant tracking systems)
- Executive presence and leadership positioning
- Achievement quantification and impact storytelling
- Industry-specific terminology and credibility signals
- Contract/consulting positioning for premium rates

${intelligence ? `
CRITICAL: You have access to this candidate's verified Career Vault intelligence. This is real, validated career data - not generic advice. Use it strategically:
- When Career Vault shows quantified metrics, use them exactly as provided
- Prioritize confirmed skills over suggested/inferred skills
- Use proven power phrases from the keyword bank
- Reference verified leadership evidence and industry expertise
- Highlight competitive advantages explicitly
` : ''}

ANALYSIS FRAMEWORK:
Phase 1 - ATS OPTIMIZATION (40% weight)
- Keyword density analysis (target: 8-12 critical keywords)
- Skills section alignment with job requirements
- Job title and role description matching
- Format compatibility (ATS-friendly structure)
${intelligence ? '- Integration of Career Vault keyword bank' : ''}

Phase 2 - HUMAN READER IMPACT (40% weight)
- Executive summary strength (hook within 3 seconds)
- Achievement quantification (numbers, %, $, impact scale)
- Leadership indicators (team size, budget, scope)
- Industry credibility signals (company names, project scale)
${intelligence ? '- Showcase verified quantified achievements from Career Vault' : ''}

Phase 3 - EXECUTIVE POSITIONING (20% weight)
- Strategic thinking evidence
- Business impact (revenue, efficiency, transformation)
- Thought leadership indicators
- Premium positioning (contractor: bill rate justification)
${intelligence ? '- Leverage competitive advantages from Career Vault' : ''}

OUTPUT REQUIREMENTS:
1. Overall scores (0-100) for each phase
2. Top 5 specific improvements with before/after examples
3. Missing critical keywords with suggested placement
4. 3-5 concrete recommendations ranked by impact
${intelligence ? '5. Validation of Career Vault data usage in optimized resume' : ''}

TONE: Direct, specific, actionable. No generic advice. Return valid JSON only.`
        },
        {
          role: 'user',
          content: `Optimize this resume for maximum impact against the target role.

CURRENT RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

${vaultContext}

DELIVERABLES:
1. Comprehensive scoring across all three phases
2. Specific keyword gaps with integration strategy
3. Achievement enhancement suggestions (add metrics where missing, prioritize Career Vault verified metrics)
4. Executive positioning improvements
5. Final recommendations prioritized by ROI
${intelligence ? '6. Confirmation of which Career Vault intelligence was leveraged' : ''}

FORMAT: Return detailed JSON matching the expected schema with optimizedResume, analysis (with all score fields), improvements array, missingKeywords array, and recommendations array.`
        }
      ],
      model: selectOptimalModel({
        taskType: 'analysis',
        complexity: 'high',
        requiresReasoning: true,
        outputLength: 'long'
      }),
      temperature: 0.7,
      max_tokens: 4000,
    }, 'optimize-resume-detailed', user.id);

    await logAIUsage(metrics);

    let result;
    try {
      const content = cleanCitations(response.choices[0].message.content || '{}');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      result = {};
    }

    const optimizationResult: ResumeOptimizationResult = {
      success: true,
      optimizedResume: result.optimizedResume || resumeText,
      analysis: result.analysis || {
        skillsMatchScore: 75,
        experienceMatchScore: 75,
        achievementsScore: 75,
        keywordDensityScore: 75,
        formatScore: 75,
        overallScore: 75
      },
      improvements: result.improvements || [],
      missingKeywords: result.missingKeywords || [],
      recommendations: result.recommendations || []
    };

    console.log('[OPTIMIZE-RESUME] Optimization complete, overall score:', optimizationResult.analysis.overallScore);

    // Store optimization result as an artifact
    await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        kind: 'rewrittenResume',
        content: optimizationResult.optimizedResume,
        metadata: {
          analysis: optimizationResult.analysis,
          improvements: optimizationResult.improvements,
          missingKeywords: optimizationResult.missingKeywords,
          recommendations: optimizationResult.recommendations,
          vaultUsed: !!intelligence
        },
        quality_score: optimizationResult.analysis.overallScore,
        ats_score: optimizationResult.analysis.keywordDensityScore,
        competitiveness_score: optimizationResult.analysis.skillsMatchScore
      });

    return new Response(
      JSON.stringify(optimizationResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in optimize-resume-detailed function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export interface GapAnalysisResult {
  overallFit: number;
  strengths: Array<{
    category: string;
    description: string;
    evidence: string[];
  }>;
  gaps: Array<{
    category: string;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    recommendations: string[];
  }>;
  keywordAnalysis: {
    matched: string[];
    missing: string[];
    coverage: number;
  };
  recommendations: string[];
  hiddenStrengths?: string[];
  transferableSkillBridges?: Array<{
    gap: string;
    bridgingSkill: string;
    explanation: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

    const { resumeText, jobDescription, provider = 'lovable' } = await req.json();

    if (!resumeText || !jobDescription) {
      throw new Error('Resume text and job description are required');
    }

    console.log('[GAP-ANALYSIS] Starting for user:', user.id);

    // Fetch Career Vault intelligence
    const { data: intelligenceData, error: intelligenceError } = await supabase.functions.invoke(
      'get-vault-intelligence',
      { headers: { Authorization: authHeader } }
    );

    const intelligence = intelligenceError ? null : intelligenceData?.intelligence;
    
    if (intelligence) {
      console.log('[GAP-ANALYSIS] Career Vault loaded:', {
        confirmedSkills: intelligence.counts.technicalSkills,
        hiddenCompetencies: intelligence.counts.hiddenCompetencies,
        transferableSkills: intelligence.counts.transferableSkills
      });
    }

    // Build Career Vault context
    let vaultContext = '';
    if (intelligence) {
      const confirmedSkills = intelligence.technicalDepth.map((t: any) => 
        `${t.skill_name} (${t.proficiency_level}, ${t.years_experience || 'experienced'})`
      ).join(', ');

      const hiddenCompetencies = intelligence.hiddenCompetencies.map((h: any) => 
        `${h.competency_name}: ${h.evidence_summary}`
      ).join('\n- ');

      const transferableSkills = intelligence.transferableSkills.map((ts: any) => 
        `${ts.skill_name} - Can transfer from ${ts.original_context} to ${ts.applicable_contexts?.join(', ') || 'new contexts'}`
      ).join('\n- ');

      const businessImpacts = intelligence.businessImpacts.slice(0, 8).map((b: any) => 
        `${b.metric_type}: ${b.metric_value}`
      ).join('; ');

      vaultContext = `
CAREER VAULT INTELLIGENCE (Verified Career Data):

CONFIRMED SKILLS (${intelligence.counts.technicalSkills} validated):
${confirmedSkills}

HIDDEN COMPETENCIES (${intelligence.counts.hiddenCompetencies} discovered):
- ${hiddenCompetencies}

TRANSFERABLE SKILLS (${intelligence.counts.transferableSkills} identified):
- ${transferableSkills}

QUANTIFIED BUSINESS IMPACTS (proof of capability):
${businessImpacts}

LEADERSHIP EVIDENCE:
${intelligence.leadershipEvidence.slice(0, 5).map((l: any) => `- ${l.evidence_type}: ${l.description}`).join('\n')}

PROJECTS PORTFOLIO:
${intelligence.projects.slice(0, 5).map((p: any) => `- ${p.project_name}: ${p.outcome || 'delivered'}`).join('\n')}

**GAP ANALYSIS MANDATE:**
1. SEPARATE "Stated Gaps" vs "Hidden Strengths" - use Career Vault hidden competencies
2. For each gap, check if a transferable skill can bridge it
3. Recommend Career Vault intelligence to emphasize (which power phrases, metrics, etc.)
4. Never mark a confirmed skill as a gap - these are validated capabilities
5. Highlight hidden competencies that aren't obvious in the resume but exist in Career Vault
`;
    }

    const apiUrl = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : LOVABLE_API_KEY;
    const model = provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash';

    console.log(`[GAP-ANALYSIS] Using ${provider} AI`);

    const requestBody: any = {
      model,
      messages: [
        {
          role: 'system',
          content: `ROLE: You are an executive recruiter with 20+ years evaluating candidates for senior roles. You conduct rigorous gap analyses that determine hiring decisions.

${intelligence ? `
CRITICAL: You have access to this candidate's Career Vault intelligence - verified career data including:
- ${intelligence.counts.technicalSkills} confirmed skills (not guesses)
- ${intelligence.counts.hiddenCompetencies} hidden competencies (capabilities not obvious in resume)
- ${intelligence.counts.transferableSkills} transferable skills (can bridge gaps)
- Quantified business impacts as proof of capability

USE THIS INTELLIGENCE TO:
1. Avoid marking confirmed skills as gaps
2. Identify hidden strengths that compensate for apparent weaknesses
3. Suggest transferable skill bridges for real gaps
4. Provide Career Vault recommendations (which intelligence to emphasize)
` : ''}

EVALUATION DIMENSIONS:

1. TECHNICAL SKILLS (25% weight)
   - Required vs. possessed technical capabilities
   - Tool/platform proficiency
   - Certifications and credentials
   - Years of hands-on experience per skill
   ${intelligence ? '- CHECK AGAINST CONFIRMED SKILLS FROM CAREER VAULT' : ''}

2. EXPERIENCE ALIGNMENT (30% weight)
   - Role level match (individual contributor vs. leadership)
   - Industry relevance and depth
   - Company scale experience (startup vs. enterprise)
   - Direct vs. transferable experience
   ${intelligence ? '- CONSIDER TRANSFERABLE SKILLS FROM CAREER VAULT' : ''}

3. ACHIEVEMENT PROFILE (25% weight)
   - Quantified impact matching job scope
   - Leadership/team management experience
   - Budget/revenue responsibility alignment
   - Innovation and transformation track record
   ${intelligence ? '- REFERENCE BUSINESS IMPACTS FROM CAREER VAULT AS EVIDENCE' : ''}

4. INDUSTRY & DOMAIN KNOWLEDGE (20% weight)
   - Sector expertise match
   - Regulatory/compliance knowledge
   - Market and competitive intelligence
   - Client/stakeholder management

SEVERITY CLASSIFICATION:
- CRITICAL GAP: Hard requirement completely missing (NOT in confirmed skills, NO transferable skill bridge)
- MODERATE GAP: Important skill/experience with partial match (or bridgeable via transferable skills)
- MINOR GAP: Nice-to-have missing or easily trainable

${intelligence ? `
HIDDEN STRENGTHS IDENTIFICATION:
Look for hidden competencies in Career Vault that aren't obvious in resume but fulfill job requirements.
Example: Resume doesn't mention "stakeholder management" but Career Vault shows evidence of this capability.
` : ''}

KEYWORD ANALYSIS RULES:
- Identify exact keyword matches (case-insensitive)
- Flag synonym matches (e.g., "led" vs "managed")
- Calculate keyword density: (matched keywords / total required) * 100
- Recommend strategic keyword placement

RECOMMENDATIONS FRAMEWORK:
1. IMMEDIATE WINS: Resume wording changes (no new skills needed) - use Career Vault power phrases
2. HIDDEN STRENGTHS: Career Vault competencies to emphasize that address gaps
3. TRANSFERABLE BRIDGES: How existing transferable skills can fill gaps
4. SHORT-TERM GAPS: Skills acquirable in 1-3 months
5. STRATEGIC GAPS: May require role change or significant training

OUTPUT REQUIREMENTS:
- Overall fit score (0-100) with confidence level
- Strength inventory (top 5 with evidence from Career Vault when available)
- Gap inventory (ranked by severity with mitigation strategies)
- Hidden strengths array (competencies from Career Vault that aren't obvious)
- Transferable skill bridges (how existing skills can fill gaps)
- Keyword analysis (found, missing, density score)
- 5-7 prioritized recommendations including Career Vault emphasis strategy

TONE: Direct, evidence-based, constructive. Flag deal-breakers clearly. Return valid JSON only.`
        },
        {
          role: 'user',
          content: `Conduct a comprehensive executive-level gap analysis.

CANDIDATE RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

${vaultContext}

ANALYSIS REQUIREMENTS:
1. Score across all four evaluation dimensions
2. Identify all critical, moderate, and minor gaps (accounting for confirmed skills and transferable bridges)
3. Extract and compare keywords (required vs. present)
4. Provide evidence-based strengths assessment (prioritize Career Vault verified data)
5. Identify hidden strengths from Career Vault that aren't obvious in resume
6. For each gap, check if a transferable skill can bridge it
7. Deliver prioritized, actionable recommendations including Career Vault intelligence strategy

FORMAT: Return detailed JSON with complete scoring, gap classification, hidden strengths, transferable skill bridges, and strategic recommendations matching the schema (overallFit number, strengths array, gaps array, keywordAnalysis object, recommendations array, hiddenStrengths array, transferableSkillBridges array).`
        }
      ],
      max_tokens: 2000
    };

    if (provider === 'openai') {
      requestBody.temperature = 0.5;
      requestBody.response_format = { type: "json_object" };
    }

    console.log('[GAP-ANALYSIS] Calling AI API...');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API error:', response.status, error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content || '{}';
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      result = {};
    }

    const gapAnalysisResult: GapAnalysisResult = {
      overallFit: result.overallFit || 0,
      strengths: result.strengths || [],
      gaps: result.gaps || [],
      keywordAnalysis: result.keywordAnalysis || {
        matched: [],
        missing: [],
        coverage: 0
      },
      recommendations: result.recommendations || [],
      hiddenStrengths: result.hiddenStrengths || [],
      transferableSkillBridges: result.transferableSkillBridges || []
    };

    console.log('[GAP-ANALYSIS] Complete:', {
      overallFit: gapAnalysisResult.overallFit,
      gaps: gapAnalysisResult.gaps.length,
      hiddenStrengths: gapAnalysisResult.hiddenStrengths?.length || 0
    });

    // Store gap analysis as an artifact
    await supabase
      .from('artifacts')
      .insert({
        user_id: user.id,
        kind: 'gapAnalysis',
        content: JSON.stringify(gapAnalysisResult),
        metadata: {
          overallFit: gapAnalysisResult.overallFit,
          gapCount: gapAnalysisResult.gaps.length,
          strengthCount: gapAnalysisResult.strengths.length,
          keywordCoverage: gapAnalysisResult.keywordAnalysis.coverage,
          vaultUsed: !!intelligence,
          hiddenStrengthsFound: gapAnalysisResult.hiddenStrengths?.length || 0
        },
        quality_score: gapAnalysisResult.overallFit,
        competitiveness_score: gapAnalysisResult.keywordAnalysis.coverage
      });

    return new Response(
      JSON.stringify(gapAnalysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in gap-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

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

    console.log('Performing gap analysis for user:', user.id);

    const apiUrl = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://ai.gateway.lovable.dev/v1/chat/completions';
    
    const apiKey = provider === 'openai' ? OPENAI_API_KEY : LOVABLE_API_KEY;
    const model = provider === 'openai' ? 'gpt-4o-mini' : 'google/gemini-2.5-flash';

    console.log(`Using ${provider} AI for gap analysis`);

    const requestBody: any = {
      model,
      messages: [
        {
          role: 'system',
          content: `ROLE: You are an executive recruiter with 20+ years evaluating candidates for senior roles. You conduct rigorous gap analyses that determine hiring decisions.

EVALUATION DIMENSIONS:

1. TECHNICAL SKILLS (25% weight)
   - Required vs. possessed technical capabilities
   - Tool/platform proficiency
   - Certifications and credentials
   - Years of hands-on experience per skill

2. EXPERIENCE ALIGNMENT (30% weight)
   - Role level match (individual contributor vs. leadership)
   - Industry relevance and depth
   - Company scale experience (startup vs. enterprise)
   - Direct vs. transferable experience

3. ACHIEVEMENT PROFILE (25% weight)
   - Quantified impact matching job scope
   - Leadership/team management experience
   - Budget/revenue responsibility alignment
   - Innovation and transformation track record

4. INDUSTRY & DOMAIN KNOWLEDGE (20% weight)
   - Sector expertise match
   - Regulatory/compliance knowledge
   - Market and competitive intelligence
   - Client/stakeholder management

SEVERITY CLASSIFICATION:
- CRITICAL GAP: Hard requirement completely missing (deal-breaker)
- MODERATE GAP: Important skill/experience with partial match
- MINOR GAP: Nice-to-have missing or easily trainable

KEYWORD ANALYSIS RULES:
- Identify exact keyword matches (case-insensitive)
- Flag synonym matches (e.g., "led" vs "managed")
- Calculate keyword density: (matched keywords / total required) * 100
- Recommend strategic keyword placement

RECOMMENDATIONS FRAMEWORK:
1. IMMEDIATE WINS: Resume wording changes (no new skills needed)
2. SHORT-TERM GAPS: Skills acquirable in 1-3 months
3. STRATEGIC GAPS: May require role change or significant training
4. POSITIONING SHIFTS: How to reframe existing experience

OUTPUT REQUIREMENTS:
- Overall fit score (0-100) with confidence level
- Strength inventory (top 5 with evidence)
- Gap inventory (ranked by severity with mitigation strategies)
- Keyword analysis (found, missing, density score)
- 5-7 prioritized recommendations with expected impact

TONE: Direct, evidence-based, constructive. Flag deal-breakers clearly. Return valid JSON only.`
        },
        {
          role: 'user',
          content: `Conduct a comprehensive executive-level gap analysis.

CANDIDATE RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

ANALYSIS REQUIREMENTS:
1. Score across all four evaluation dimensions
2. Identify all critical, moderate, and minor gaps
3. Extract and compare keywords (required vs. present)
4. Provide evidence-based strengths assessment
5. Deliver prioritized, actionable recommendations

FORMAT: Return detailed JSON with complete scoring, gap classification, and strategic recommendations matching the schema (overallFit number, strengths array, gaps array, keywordAnalysis object, recommendations array).`
        }
      ],
      max_tokens: 2000
    };

    if (provider === 'openai') {
      requestBody.temperature = 0.5;
      requestBody.response_format = { type: "json_object" };
    }

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
      // Handle both JSON object and JSON wrapped in markdown
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
      recommendations: result.recommendations || []
    };

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
          keywordCoverage: gapAnalysisResult.keywordAnalysis.coverage
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

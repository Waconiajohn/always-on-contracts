/**
 * Analyze Resume Gaps Edge Function
 * Comprehensive gap analysis between resume and job requirements
 * Returns prioritized gaps with bridging strategies
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/jsonParser.ts';

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
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      resumeText, 
      jobDescription, 
      currentSkills,
      currentBullets,
      userId 
    } = await req.json();

    console.log('🔍 Analyzing resume gaps against job requirements');

    const prompt = `You are an expert executive career strategist and resume analyst. Perform a comprehensive gap analysis between this candidate's resume and the target job requirements.

CANDIDATE'S RESUME:
${resumeText?.substring(0, 4000) || 'Not provided'}

CURRENT SKILLS:
${Array.isArray(currentSkills) ? currentSkills.join(', ') : currentSkills || 'Not provided'}

CURRENT EXPERIENCE BULLETS:
${Array.isArray(currentBullets) ? currentBullets.slice(0, 10).join('\n') : currentBullets || 'Not provided'}

TARGET JOB DESCRIPTION:
${jobDescription?.substring(0, 3000) || 'Not provided'}

ANALYSIS REQUIRED:

1. HARD SKILL GAPS: Technical skills mentioned in JD but missing from resume
2. SOFT SKILL GAPS: Leadership, communication, and interpersonal skills needed
3. EXPERIENCE GAPS: Types of experience or accomplishments the candidate lacks
4. KEYWORD GAPS: ATS-critical terms missing from the resume
5. BRIDGING STRATEGIES: How to address each gap using transferable experience

For each gap, provide:
- Severity: critical (dealbreaker), high (important), medium (nice-to-have)
- Bridging strategy: How to address this with existing experience
- Suggested bullet: A concrete bullet point they could add
- Evidence to gather: What the candidate should recall from their experience

Return JSON:
{
  "overallFitScore": 75,
  "gapSummary": "Brief 2-sentence summary of main gaps",
  "hardSkillGaps": [
    {
      "skill": "Python",
      "severity": "high",
      "mentionCount": 5,
      "bridgingStrategy": "Highlight SQL and data analysis experience as foundation",
      "suggestedBullet": "Leveraged SQL and analytical frameworks to deliver data-driven insights, with demonstrated aptitude for Python adoption",
      "evidenceToGather": "Any scripting, automation, or data analysis work you've done"
    }
  ],
  "softSkillGaps": [
    {
      "skill": "Cross-functional leadership",
      "severity": "medium",
      "bridgingStrategy": "Emphasize existing collaboration examples",
      "suggestedBullet": "Partnered with product, engineering, and design teams to deliver integrated solutions",
      "evidenceToGather": "Projects where you worked with multiple departments"
    }
  ],
  "experienceGaps": [
    {
      "area": "Enterprise SaaS experience",
      "severity": "critical",
      "bridgingStrategy": "Emphasize B2B experience and complex sales cycles",
      "suggestedBullet": "Drove enterprise-scale solutions serving Fortune 500 clients with multi-year engagements",
      "evidenceToGather": "Largest clients, longest contracts, most complex deals"
    }
  ],
  "keywordGaps": [
    {
      "keyword": "stakeholder management",
      "frequency": 3,
      "category": "leadership",
      "suggestedPlacement": "In your leadership bullets, add 'stakeholder' before 'management'",
      "naturalPhrasing": "Managed relationships with C-suite stakeholders across global regions"
    }
  ],
  "strengthsToLeverage": [
    {
      "strength": "Strong quantified achievements",
      "recommendation": "Lead with your revenue and growth metrics in every bullet"
    }
  ],
  "prioritizedActions": [
    {
      "priority": 1,
      "action": "Add Python-adjacent experience",
      "impact": "Addresses most critical skill gap",
      "timeEstimate": "10 minutes"
    }
  ]
}`;

    const { response, metrics } = await callLovableAI({
      messages: [{ role: 'user', content: prompt }],
      model: LOVABLE_AI_MODELS.PREMIUM,
      temperature: 0.3,
      max_tokens: 4000
    }, 'analyze-resume-gaps', userId);

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    let analysis;
    
    try {
      analysis = extractJSON(rawContent);
    } catch (parseError) {
      console.error('Failed to parse gap analysis:', parseError);
      // Return structured fallback
      analysis = {
        overallFitScore: 0,
        gapSummary: "Unable to complete analysis. Please try again.",
        hardSkillGaps: [],
        softSkillGaps: [],
        experienceGaps: [],
        keywordGaps: [],
        strengthsToLeverage: [],
        prioritizedActions: []
      };
    }

    console.log('✅ Gap analysis completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in analyze-resume-gaps:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

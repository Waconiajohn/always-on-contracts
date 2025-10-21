import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      section_type,
      section_guidance,
      job_analysis_research,
      vault_items = [],
      job_title,
      industry,
      seniority = 'mid-level',
      ats_keywords = { critical: [], important: [], nice_to_have: [] },
      requirements = []
    } = await req.json();

    console.log(`Generating dual versions for ${section_type}`);

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Step 1: Generate IDEAL version (Pure AI, no vault)
    console.log('Generating ideal version...');
    const idealPrompt = `You are an expert resume writer. Create a ${section_type} section for a ${seniority} ${job_title} in ${industry}.

CRITICAL CONTEXT - Real job market research:
${job_analysis_research}

SECTION GUIDANCE:
${section_guidance}

CRITICAL ATS KEYWORDS (MUST include naturally):
${ats_keywords.critical.join(', ')}

Important keywords: ${ats_keywords.important.join(', ')}

REQUIREMENTS TO ADDRESS:
${requirements.slice(0, 10).join('\n- ')}

${section_type === 'skills' ? `
CRITICAL: For skills section, return ONLY a simple comma-separated list. NO descriptions, NO categories, NO bullet points.
Example format: "Python, JavaScript, AWS, Team Leadership, Project Management, Data Analysis, Agile"
` : ''}

Create an INDUSTRY STANDARD version that:
1. Addresses the core problem from research
2. Includes ALL critical ATS keywords naturally
3. Follows ${section_type} best practices for ${industry}
4. Uses quantified achievements (use realistic industry benchmarks)
5. Demonstrates competitive strength

Return ONLY the content, no explanations.`;

    const idealResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: idealPrompt }],
        temperature: 0.6,
        max_tokens: 1500
      })
    });

    if (!idealResponse.ok) {
      throw new Error(`Ideal generation failed: ${idealResponse.status}`);
    }

    const idealData = await idealResponse.json();
    const idealContent = idealData.choices?.[0]?.message?.content || '';

    // Step 2: Generate PERSONALIZED version (AI + Vault)
    console.log('Generating personalized version...');
    
    // Prepare vault context
    const vaultContext = vault_items.length > 0
      ? vault_items.map((item: any, idx: number) => `
[Vault Item ${idx + 1}] ${item.vaultCategory}:
${JSON.stringify(item.content, null, 2)}
Match Score: ${item.matchScore}%
Addresses: ${item.satisfiesRequirements.join(', ')}
Keywords: ${item.atsKeywords.join(', ')}
`).join('\n')
      : 'No vault data available - use industry standards';

    const personalizedPrompt = `You are an expert resume writer. Create a PERSONALIZED ${section_type} section for THIS SPECIFIC CANDIDATE.

CRITICAL CONTEXT - Real job market research:
${job_analysis_research}

SECTION GUIDANCE:
${section_guidance}

CANDIDATE'S CAREER VAULT DATA:
${vaultContext}

CRITICAL ATS KEYWORDS (MUST include naturally):
${ats_keywords.critical.join(', ')}

Important keywords: ${ats_keywords.important.join(', ')}

REQUIREMENTS TO ADDRESS:
${requirements.slice(0, 10).join('\n- ')}

${section_type === 'skills' ? `
CRITICAL: For skills section, return ONLY a simple comma-separated list. NO descriptions, NO categories, NO bullet points.
Example format: "Python, JavaScript, AWS, Team Leadership, Project Management, Data Analysis, Agile"
` : ''}

Create a PERSONALIZED version that:
1. Uses ACTUAL achievements from the candidate's vault
2. Includes ALL critical ATS keywords naturally
3. Leverages candidate's unique strengths and metrics
4. Addresses the core problem from research
5. Demonstrates competitive advantage through real accomplishments

${vault_items.length === 0 ? 'NOTE: No vault data available. Create based on industry standards but in first person.' : 'Use ONLY information from the vault data. Do not fabricate achievements.'}

Return ONLY the content, no explanations.`;

    const personalizedResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: personalizedPrompt }],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    if (!personalizedResponse.ok) {
      throw new Error(`Personalized generation failed: ${personalizedResponse.status}`);
    }

    const personalizedData = await personalizedResponse.json();
    const personalizedContent = personalizedData.choices?.[0]?.message?.content || '';

    // Step 3: Calculate quality scores for both versions
    const calculateQualityScore = (content: string) => {
      const contentLower = content.toLowerCase();
      
      // ATS keyword matching
      const criticalMatched = ats_keywords.critical.filter((kw: string) =>
        contentLower.includes(kw.toLowerCase())
      );
      const importantMatched = ats_keywords.important.filter((kw: string) =>
        contentLower.includes(kw.toLowerCase())
      );
      
      const atsScore = Math.round(
        (criticalMatched.length / Math.max(ats_keywords.critical.length, 1)) * 50 +
        (importantMatched.length / Math.max(ats_keywords.important.length, 1)) * 30 +
        20 // Base score
      );

      // Requirements coverage
      const reqsCovered = requirements.filter((req: any) => {
        if (typeof req === 'string') {
          return contentLower.includes(req.toLowerCase());
        }
        return false;
      });
      const reqScore = requirements.length > 0
        ? Math.round((reqsCovered.length / requirements.length) * 100)
        : 80;

      // Competitive strength indicators
      const hasNumbers = /\d+[%$KkMm+]/.test(content);
      const actionVerbs = ['led', 'managed', 'developed', 'achieved', 'increased', 'created', 'delivered'];
      const hasActionVerbs = actionVerbs.some(verb => contentLower.includes(verb));
      const competitiveScore = (hasNumbers ? 40 : 0) + (hasActionVerbs ? 40 : 0) + 20;

      const overallScore = Math.round(
        atsScore * 0.4 + reqScore * 0.3 + competitiveScore * 0.3
      );

      return {
        overallScore,
        atsMatchPercentage: atsScore,
        requirementsCoverage: reqScore,
        competitiveStrength: Math.min(5, Math.max(1, Math.round(competitiveScore / 20))),
        keywordsMatched: [...criticalMatched, ...importantMatched],
        requirementsAddressed: reqsCovered
      };
    };

    const idealQuality = calculateQualityScore(idealContent);
    const personalizedQuality = calculateQualityScore(personalizedContent);

    // Determine recommendation
    const scoreDiff = personalizedQuality.overallScore - idealQuality.overallScore;
    const vaultStrength = vault_items.length > 0
      ? Math.min(100, (vault_items.reduce((sum: number, item: any) => sum + (item.matchScore || 50), 0) / vault_items.length))
      : 0;

    let recommendation: 'ideal' | 'personalized' | 'blend';
    let recommendationReason: string;

    if (vault_items.length === 0 || vaultStrength < 40) {
      recommendation = 'ideal';
      recommendationReason = 'Limited vault data - Industry Standard recommended';
    } else if (scoreDiff > 10) {
      recommendation = 'personalized';
      recommendationReason = 'Your vault creates a stronger, more competitive section';
    } else if (scoreDiff < -10) {
      recommendation = 'ideal';
      recommendationReason = 'Industry standard has better ATS optimization';
    } else {
      recommendation = 'blend';
      recommendationReason = 'Both versions are strong - AI can blend the best elements';
    }

    console.log(`Generation complete. Recommendation: ${recommendation}`);

    return new Response(
      JSON.stringify({
        success: true,
        idealVersion: {
          content: idealContent,
          quality: idealQuality
        },
        personalizedVersion: {
          content: personalizedContent,
          quality: personalizedQuality,
          vaultItemsUsed: vault_items.length
        },
        comparison: {
          recommendation,
          recommendationReason,
          scoreDifference: scoreDiff,
          vaultStrength
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-dual-resume-section:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate dual versions'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

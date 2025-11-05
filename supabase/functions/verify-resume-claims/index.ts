import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeContent, jobDescription } = await req.json();

    console.log('Verifying resume claims with Perplexity...');

    const verificationPrompt = `You are a fact-checker for professional resumes. Analyze the following resume content and verify the factual accuracy of key claims.

Resume Content:
${resumeContent}

Job Context:
${jobDescription}

Please:
1. Identify 5-10 key quantifiable claims or achievements
2. Verify if these claims are realistic and plausible for the industry/role
3. Flag any claims that seem exaggerated or unrealistic
4. Provide suggestions for improving flagged claims

Return your analysis in this exact JSON structure:
{
  "confidence": <0-100 overall confidence score>,
  "verifiedClaims": [
    {
      "claim": "<the claim>",
      "verified": true,
      "confidence": <0-100>
    }
  ],
  "flaggedClaims": [
    {
      "claim": "<the claim>",
      "issue": "<what seems problematic>",
      "suggestion": "<how to improve it>"
    }
  ],
  "recommendations": [
    "<general recommendation 1>",
    "<general recommendation 2>"
  ]
}`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume fact-checker. Return only valid JSON.'
          },
          {
            role: 'user',
            content: verificationPrompt
          }
        ],
        model: selectOptimalModel({
          taskType: 'analysis',
          complexity: 'medium',
          requiresReasoning: true,
          outputLength: 'medium'
        }),
        temperature: 0.2,
        max_tokens: 2000,
        return_citations: true,
        search_recency_filter: 'month'
      },
      'verify-resume-claims'
    );

    await logAIUsage(metrics);

    console.log('Perplexity response received');

    let verificationResult;
    try {
      const content = cleanCitations(response.choices[0].message.content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing Perplexity response:', parseError);
      verificationResult = {
        confidence: 70,
        verifiedClaims: [],
        flaggedClaims: [],
        recommendations: ['Unable to fully verify claims. Please review manually.']
      };
    }

    const citations = response.citations?.map((citation: any) => ({
      title: citation.title || 'Source',
      url: citation.url || '',
      snippet: citation.text || ''
    })) || [];

    const result = {
      ...verificationResult,
      citations
    };

    console.log('Verification complete:', {
      confidence: result.confidence,
      verifiedCount: result.verifiedClaims.length,
      flaggedCount: result.flaggedClaims.length,
      citationsCount: citations.length
    });

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-resume-claims:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        verifiedClaims: [],
        flaggedClaims: [],
        citations: [],
        recommendations: ['Verification failed. Please review resume manually.']
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

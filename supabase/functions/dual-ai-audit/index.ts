import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  content: string;
  contentType: 'resume' | 'linkedin_profile' | 'linkedin_post' | 'interview_answer';
  context?: {
    jobDescription?: string;
    careerVaultData?: any;
    industryContext?: string;
  };
}

interface AuditResult {
  primary_analysis: {
    content: string;
    strengths: string[];
    improvements: string[];
    score: number;
  };
  verification_analysis: {
    verified_claims: Array<{
      claim: string;
      verified: boolean;
      confidence: number;
      sources?: string[];
    }>;
    unverified_statements: string[];
    factual_accuracy_score: number;
  };
  consensus: {
    final_recommendations: string[];
    confidence_level: number;
    areas_of_agreement: string[];
    areas_requiring_attention: string[];
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

    if (!LOVABLE_API_KEY || !PERPLEXITY_API_KEY) {
      throw new Error('Missing required API keys');
    }

    const { content, contentType, context }: AuditRequest = await req.json();

    console.log(`[DUAL-AI-AUDIT] Starting audit for ${contentType}`);

    // Step 1: Primary AI Analysis (Gemini via Lovable AI)
    const primaryPrompt = buildPrimaryPrompt(content, contentType, context);
    
    const primaryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach and content strategist. Provide detailed, actionable analysis.'
          },
          {
            role: 'user',
            content: primaryPrompt
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!primaryResponse.ok) {
      const errorText = await primaryResponse.text();
      console.error('[DUAL-AI-AUDIT] Primary AI error:', errorText);
      throw new Error(`Primary AI analysis failed: ${errorText}`);
    }

    const primaryData = await primaryResponse.json();
    const primaryAnalysis = primaryData.choices[0].message.content;

    console.log('[DUAL-AI-AUDIT] Primary analysis complete');

    // Step 2: Perplexity Fact-Checking
    const verificationPrompt = buildVerificationPrompt(content, contentType, primaryAnalysis, context);
    
    const verificationResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a fact-checking AI. Verify claims using current market data and industry standards.'
          },
          {
            role: 'user',
            content: verificationPrompt
          }
        ],
        temperature: 0.2,
      }),
    });

    if (!verificationResponse.ok) {
      const errorText = await verificationResponse.text();
      console.error('[DUAL-AI-AUDIT] Perplexity error:', errorText);
      throw new Error(`Verification analysis failed: ${errorText}`);
    }

    const verificationData = await verificationResponse.json();
    const verificationAnalysis = verificationData.choices[0].message.content;

    console.log('[DUAL-AI-AUDIT] Verification complete');

    // Step 3: Synthesize Results
    const synthesisPrompt = buildSynthesisPrompt(primaryAnalysis, verificationAnalysis, contentType);
    
    const synthesisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are synthesizing two AI analyses. Provide a balanced, actionable consensus.'
          },
          {
            role: 'user',
            content: synthesisPrompt
          }
        ],
        temperature: 0.5,
      }),
    });

    const synthesisData = await synthesisResponse.json();
    const consensusAnalysis = synthesisData.choices[0].message.content;

    console.log('[DUAL-AI-AUDIT] Synthesis complete');

    const result: AuditResult = {
      primary_analysis: parsePrimaryAnalysis(primaryAnalysis),
      verification_analysis: parseVerificationAnalysis(verificationAnalysis),
      consensus: parseConsensusAnalysis(consensusAnalysis)
    };

    return new Response(
      JSON.stringify({ success: true, audit: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DUAL-AI-AUDIT] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function buildPrimaryPrompt(content: string, contentType: string, context?: any): string {
  const basePrompts = {
    resume: `Analyze this resume comprehensively:

RESUME CONTENT:
${content}

${context?.jobDescription ? `TARGET JOB:
${context.jobDescription}` : ''}

Provide analysis in this JSON structure:
{
  "strengths": ["strength 1", "strength 2", ...],
  "improvements": ["improvement 1", "improvement 2", ...],
  "score": 85,
  "analysis": "detailed analysis text"
}`,

    linkedin_profile: `Analyze this LinkedIn profile for optimization:

PROFILE CONTENT:
${content}

${context?.industryContext ? `INDUSTRY: ${context.industryContext}` : ''}

Provide analysis with strengths, improvements, and overall score.`,

    linkedin_post: `Analyze this LinkedIn post for engagement and professionalism:

POST CONTENT:
${content}

Evaluate clarity, engagement potential, professionalism, and factual claims.`,

    interview_answer: `Evaluate this interview answer:

ANSWER:
${content}

${context?.careerVaultData ? `CANDIDATE BACKGROUND: ${JSON.stringify(context.careerVaultData)}` : ''}

Rate the STAR structure, specificity, impact, and authenticity.`
  };

  return basePrompts[contentType as keyof typeof basePrompts] || basePrompts.resume;
}

function buildVerificationPrompt(content: string, contentType: string, primaryAnalysis: string, context?: any): string {
  return `Fact-check the following content and the primary analysis:

ORIGINAL CONTENT:
${content}

PRIMARY AI ANALYSIS:
${primaryAnalysis}

${context?.industryContext ? `INDUSTRY CONTEXT: ${context.industryContext}` : ''}

Your task:
1. Identify all factual claims (skills, achievements, industry standards mentioned)
2. Verify each claim against current market data
3. Flag unverified or questionable statements
4. Provide confidence scores (0-100) for each claim
5. Note any exaggerations or misrepresentations

Return JSON with:
{
  "verified_claims": [{"claim": "...", "verified": true/false, "confidence": 85, "sources": ["..."]}],
  "unverified_statements": ["..."],
  "factual_accuracy_score": 85
}`;
}

function buildSynthesisPrompt(primaryAnalysis: string, verificationAnalysis: string, contentType: string): string {
  return `Synthesize these two AI analyses into actionable recommendations:

PRIMARY ANALYSIS (Gemini):
${primaryAnalysis}

FACT-CHECK ANALYSIS (Perplexity):
${verificationAnalysis}

Create a consensus that:
1. Highlights areas where both AIs agree
2. Flags areas requiring attention (unverified claims, improvements needed)
3. Provides 5-7 specific, prioritized recommendations
4. Assigns an overall confidence level (0-100)

Return JSON with:
{
  "final_recommendations": ["1. ...", "2. ...", ...],
  "confidence_level": 85,
  "areas_of_agreement": ["..."],
  "areas_requiring_attention": ["..."]
}`;
}

function parsePrimaryAnalysis(analysis: string): any {
  try {
    // Try to parse as JSON first
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('[DUAL-AI-AUDIT] Failed to parse as JSON, using text analysis');
  }

  // Fallback: extract from text
  return {
    content: analysis,
    strengths: extractListItems(analysis, 'strength'),
    improvements: extractListItems(analysis, 'improvement'),
    score: extractScore(analysis)
  };
}

function parseVerificationAnalysis(analysis: string): any {
  try {
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('[DUAL-AI-AUDIT] Failed to parse verification as JSON');
  }

  return {
    verified_claims: [],
    unverified_statements: extractListItems(analysis, 'unverified'),
    factual_accuracy_score: extractScore(analysis)
  };
}

function parseConsensusAnalysis(analysis: string): any {
  try {
    const jsonMatch = analysis.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.log('[DUAL-AI-AUDIT] Failed to parse consensus as JSON');
  }

  return {
    final_recommendations: extractListItems(analysis, 'recommendation'),
    confidence_level: extractScore(analysis),
    areas_of_agreement: extractListItems(analysis, 'agreement'),
    areas_requiring_attention: extractListItems(analysis, 'attention')
  };
}

function extractListItems(text: string, keyword: string): string[] {
  const lines = text.split('\n');
  const items: string[] = [];
  
  for (const line of lines) {
    if (line.toLowerCase().includes(keyword) || line.match(/^\d+\./)) {
      const cleaned = line.replace(/^\d+\.|\*|-/g, '').trim();
      if (cleaned.length > 10) {
        items.push(cleaned);
      }
    }
  }
  
  return items.slice(0, 10); // Max 10 items
}

function extractScore(text: string): number {
  const scoreMatch = text.match(/score[:\s]+(\d+)/i) || text.match(/(\d+)\/100/);
  return scoreMatch ? parseInt(scoreMatch[1]) : 75;
}

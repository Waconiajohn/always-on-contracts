import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationRequest {
  original_content: string;
  rewritten_content: string;
  section_name: string;
  evidence_claims: Array<{
    claim: string;
    source: string;
    confidence: string;
  }>;
}

interface ValidationIssue {
  type: 'hallucination' | 'exaggeration' | 'unsupported_claim' | 'missing_evidence';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  original_text?: string;
  problematic_text: string;
  suggestion: string;
}

interface ValidationResponse {
  is_valid: boolean;
  confidence_score: number;
  issues: ValidationIssue[];
  summary: string;
  recommendation: 'approve' | 'revise' | 'reject';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { original_content, rewritten_content, section_name, evidence_claims } = 
      await req.json() as ValidationRequest;

    if (!original_content || !rewritten_content) {
      return new Response(
        JSON.stringify({ error: 'Missing required content fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evidenceContext = evidence_claims?.length > 0
      ? `\n\nVERIFIED EVIDENCE CLAIMS:\n${evidence_claims.map((c, i) => 
          `${i + 1}. "${c.claim}" (Source: ${c.source}, Confidence: ${c.confidence})`
        ).join('\n')}`
      : '';

    const prompt = `You are a resume validation expert focused on preventing hallucination and exaggeration. Your job is to compare rewritten resume content against the original and verify all claims are supported.

SECTION: ${section_name}

ORIGINAL CONTENT:
${original_content}

REWRITTEN CONTENT:
${rewritten_content}
${evidenceContext}

VALIDATION RULES:
1. HALLUCINATION: Any claim in rewritten that has NO basis in original (critical)
2. EXAGGERATION: Numbers/metrics inflated beyond original (critical)
3. UNSUPPORTED_CLAIM: Vague claims without evidence (warning)
4. MISSING_EVIDENCE: Important achievements from original omitted (info)

For each issue found, identify:
- The exact problematic text
- Why it's problematic
- How to fix it

Respond with JSON matching this schema:
{
  "is_valid": boolean,
  "confidence_score": number (0-100),
  "issues": [
    {
      "type": "hallucination" | "exaggeration" | "unsupported_claim" | "missing_evidence",
      "severity": "critical" | "warning" | "info",
      "description": "explanation",
      "original_text": "what was in original (if applicable)",
      "problematic_text": "exact text from rewritten",
      "suggestion": "how to fix"
    }
  ],
  "summary": "brief overall assessment",
  "recommendation": "approve" | "revise" | "reject"
}

CRITICAL: Be strict. Any made-up metrics, titles, or achievements = hallucination. If rewritten says "increased revenue by 40%" but original says "improved revenue", that's exaggeration.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a resume validation expert. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    const validation: ValidationResponse = JSON.parse(content);

    // Ensure proper structure
    const result: ValidationResponse = {
      is_valid: validation.is_valid ?? true,
      confidence_score: validation.confidence_score ?? 80,
      issues: (validation.issues || []).map(issue => ({
        type: issue.type || 'unsupported_claim',
        severity: issue.severity || 'warning',
        description: issue.description || 'Issue detected',
        original_text: issue.original_text,
        problematic_text: issue.problematic_text || '',
        suggestion: issue.suggestion || 'Review and revise',
      })),
      summary: validation.summary || 'Validation complete',
      recommendation: validation.recommendation || 'revise',
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Validation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

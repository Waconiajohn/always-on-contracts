import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ValidationSchema, parseAndValidate } from '../_shared/rb-schemas.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

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

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  try {
    // Authentication check
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Use centralized schema validation with error handling
    let result;
    try {
      result = parseAndValidate(ValidationSchema, content, "rb-validate-rewrite");
    } catch (parseError) {
      console.error("Schema validation failed:", parseError);
      // Return a safe fallback response
      result = {
        is_valid: false,
        confidence_score: 0,
        issues: [{
          type: "unsupported_claim" as const,
          severity: "warning" as const,
          description: "Unable to validate - please review manually",
          problematic_text: "",
          suggestion: "Review the rewritten content for accuracy"
        }],
        summary: "Validation could not be completed",
        recommendation: "revise" as const
      };
    }

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

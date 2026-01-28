import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { MicroEditSchema, parseAndValidate } from '../_shared/rb-schemas.ts';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

interface MicroEditRequest {
  bullet_text: string;
  edit_instruction: string;
  context?: {
    job_title?: string;
    company?: string;
    section_name?: string;
    surrounding_bullets?: string[];
  };
  evidence_claims?: Array<{
    claim: string;
    source: string;
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

    const { bullet_text, edit_instruction, context, evidence_claims } =
      await req.json() as MicroEditRequest;

    if (!bullet_text || !edit_instruction) {
      return new Response(
        JSON.stringify({ error: 'Missing bullet_text or edit_instruction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evidenceContext = (evidence_claims && evidence_claims.length > 0)
      ? `\n\nAVAILABLE EVIDENCE (you may ONLY use these facts):\n${evidence_claims.map((c, i) => 
          `${i + 1}. "${c.claim}" (from ${c.source})`
        ).join('\n')}`
      : '';

    const jobContext = context?.job_title 
      ? `\nTARGET ROLE: ${context.job_title}${context.company ? ` at ${context.company}` : ''}`
      : '';

    const prompt = `You are a precision resume editor. Make a SINGLE targeted edit to a bullet point.

CURRENT BULLET:
"${bullet_text}"

EDIT INSTRUCTION:
${edit_instruction}
${jobContext}
${evidenceContext}

EDITING RULES:
1. Make ONLY the requested change - preserve everything else
2. NEVER add metrics/numbers not in original or evidence
3. NEVER change job titles, company names, or dates
4. Keep similar length unless instructed otherwise
5. Maintain professional resume tone
6. If instruction is unclear, make minimal safe changes

Respond with JSON:
{
  "original": "the input bullet",
  "edited": "the modified bullet",
  "changes_made": ["list of specific changes"],
  "evidence_used": ["which evidence claims were incorporated, if any"],
  "confidence": number 0-100
}

If the edit cannot be made safely (e.g., would require hallucination), return the original unchanged with confidence: 0 and explain in changes_made.`;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise resume editor. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
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
      result = parseAndValidate(MicroEditSchema, content, "rb-micro-edit");
    } catch (parseError) {
      console.error("Schema validation failed:", parseError);
      // Return original text unchanged on parse failure
      result = {
        original: bullet_text,
        edited: bullet_text,
        changes_made: ["Edit could not be processed - returning original"],
        evidence_used: [],
        confidence: 0
      };
    }

    // Ensure defaults for original field
    const finalResult = {
      ...result,
      original: result.original || bullet_text,
      edited: result.edited || bullet_text,
    };

    return new Response(
      JSON.stringify(finalResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Micro-edit error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Micro-edit failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

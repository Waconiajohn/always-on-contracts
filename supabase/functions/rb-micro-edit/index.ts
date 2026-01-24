import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

interface MicroEditResponse {
  original: string;
  edited: string;
  changes_made: string[];
  evidence_used: string[];
  confidence: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bullet_text, edit_instruction, context, evidence_claims } = 
      await req.json() as MicroEditRequest;

    if (!bullet_text || !edit_instruction) {
      return new Response(
        JSON.stringify({ error: 'Missing bullet_text or edit_instruction' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const evidenceContext = evidence_claims?.length > 0
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

    const edit: MicroEditResponse = JSON.parse(content);

    // Ensure proper structure
    const result: MicroEditResponse = {
      original: edit.original || bullet_text,
      edited: edit.edited || bullet_text,
      changes_made: edit.changes_made || [],
      evidence_used: edit.evidence_used || [],
      confidence: edit.confidence ?? 80,
    };

    return new Response(
      JSON.stringify(result),
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

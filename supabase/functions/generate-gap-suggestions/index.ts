import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      requirement,
      matchScore,
      existingEvidence,
      careerVaultData,
      jobContext
    } = await req.json();

    if (!requirement) {
      return new Response(
        JSON.stringify({ error: 'Requirement is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `You are a career advisor helping a job seeker address gaps in their resume.

JOB REQUIREMENT:
${requirement}

CURRENT MATCH SCORE: ${matchScore || 0}%

${existingEvidence ? `EXISTING EVIDENCE (that's not strong enough):\n${existingEvidence}\n` : 'No existing evidence found in their career history.'}

${careerVaultData ? `CAREER VAULT DATA:\n${JSON.stringify(careerVaultData, null, 2)}\n` : ''}

${jobContext ? `JOB CONTEXT:\n${jobContext}\n` : ''}

TASK:
Generate 3-5 actionable, specific suggestions to help this candidate better address this requirement.

SUGGESTION TYPES:
1. **Reframe Existing Experience**: How to reword or reposition something they've already done
2. **Add Missing Context**: What additional details or projects they should mention
3. **Skill Development**: Specific certifications, courses, or skills to acquire
4. **Project Ideas**: Concrete projects or initiatives they could add to their resume
5. **Transferable Skills**: How to highlight related skills that demonstrate this capability

FORMAT YOUR RESPONSE AS A JSON ARRAY:
[
  {
    "type": "reframe|context|skill|project|transferable",
    "suggestion": "Specific, actionable suggestion here",
    "impact": "How this helps address the requirement",
    "effort": "low|medium|high"
  }
]

Be specific, practical, and realistic. Focus on quick wins (low effort) first.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a career advisor. Return only valid JSON array of suggestions, no markdown or explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let suggestionsText = data.choices[0]?.message?.content?.trim() || '[]';
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = suggestionsText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonMatch) {
      suggestionsText = jsonMatch[1];
    }
    
    const suggestions = JSON.parse(suggestionsText);

    return new Response(
      JSON.stringify({ 
        suggestions,
        requirement,
        matchScore
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-gap-suggestions:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        suggestions: [] // Return empty array as fallback
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

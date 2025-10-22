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
    const { requirement, vault_items, job_title, industry, seniority } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert career coach and resume writer helping candidates address job requirements they don't fully match. Generate 3 strategic solutions for a requirement gap.

Context:
- Job Title: ${job_title}
- Industry: ${industry}
- Seniority: ${seniority}
- Unmatched Requirement: ${requirement}
- Available Vault Items: ${JSON.stringify(vault_items.slice(0, 3))}

Generate 3 different approaches:
1. **pure_ai**: Industry-standard response based on what top performers would say
2. **vault_based**: Reframe existing vault experience to partially address this
3. **alternative**: Use transferable skills or "working knowledge" positioning

Return JSON with this structure:
{
  "solutions": [
    {
      "approach": "pure_ai",
      "title": "Industry Standard Approach",
      "content": "2-3 bullet points showing how someone would address this requirement",
      "reasoning": "Why this works in your industry"
    },
    {
      "approach": "vault_based",
      "title": "Your Experience Reframed",
      "content": "2-3 bullet points connecting vault items to this requirement",
      "reasoning": "How your existing experience relates"
    },
    {
      "approach": "alternative",
      "title": "Transferable Skills Angle",
      "content": "2-3 bullet points emphasizing learning ability and adjacent skills",
      "reasoning": "Why this positioning is acceptable"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate gap solutions for: ${requirement}` }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-gap-solutions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

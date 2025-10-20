import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      requirement,
      vault_items = [],
      job_title,
      industry,
      seniority = 'mid-level'
    } = await req.json();

    console.log(`Generating gap solutions for: ${requirement}`);

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare vault context
    const vaultContext = vault_items.length > 0
      ? vault_items.map((item: any, idx: number) => `
[Similar Experience ${idx + 1}]:
${JSON.stringify(item.content, null, 2)}
Match: ${item.matchScore}%`).join('\n')
      : 'No similar vault data available';

    const prompt = `You are a career strategist helping a candidate address a job requirement they don't fully meet.

REQUIREMENT: "${requirement}"

JOB CONTEXT:
- Title: ${job_title}
- Industry: ${industry}
- Level: ${seniority}

CANDIDATE'S RELATED EXPERIENCE:
${vaultContext}

Generate 3 different approaches to address this gap:

1. PURE AI APPROACH (💎 Industry Standard):
   - Create a professional statement based on industry best practices
   - What someone who DOES have this qualification would typically say
   - Use industry-standard language and benchmarks
   - Make it sound credible but aspirational

2. VAULT-BASED APPROACH (⭐ From Your Experience):
   - Reframe the candidate's existing vault experience to partially satisfy this requirement
   - Find the closest match in their background
   - Emphasize transferable skills and parallel experiences
   - Be honest but strategic about the connection
   ${vault_items.length === 0 ? '(Note: No vault data - suggest what experience to add)' : ''}

3. ALTERNATIVE FRAMING (🎯 Transferable):
   - Position as "working knowledge" or "exposure to" rather than "expertise in"
   - Emphasize willingness to learn and related competencies
   - Show how other skills compensate for this specific gap
   - Frame as an opportunity for growth

For each approach, provide:
- A brief title (5-7 words)
- The actual content to use (2-3 sentences, first person)
- A reasoning statement (1 sentence explaining why this works)

Return ONLY valid JSON:
{
  "solutions": [
    {
      "approach": "pure_ai",
      "title": "...",
      "content": "...",
      "reasoning": "..."
    },
    {
      "approach": "vault_based",
      "title": "...",
      "content": "...",
      "reasoning": "..."
    },
    {
      "approach": "alternative",
      "title": "...",
      "content": "...",
      "reasoning": "..."
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON response
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    console.log(`Generated ${parsed.solutions?.length || 0} solutions`);

    return new Response(
      JSON.stringify(parsed),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error in generate-gap-solutions:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate gap solutions',
        solutions: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

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

    // Detect requirement type
    const reqLower = requirement.toLowerCase();
    const isEducation = reqLower.includes('degree') || reqLower.includes('bachelor') || reqLower.includes('master') || reqLower.includes('phd');
    const hasEquivalentOption = reqLower.includes('equivalent') || reqLower.includes('or ');
    
    // Build context-aware vault summary
    const vaultSummary = vault_items.slice(0, 5).map((item: any) => {
      const content = item.content || item;
      return `- ${content.stated_skill || content.skill || content.text || ''}: ${content.evidence || content.description || ''}`.substring(0, 200);
    }).join('\n');

    const systemPrompt = `You are a strategic resume writer creating SPECIFIC, ACTIONABLE resume bullet points (not generic advice).

CRITICAL: Your output must be actual resume content the user can copy-paste, NOT coaching advice or abstract suggestions.

Context:
- Job Title: ${job_title} (${seniority} level)
- Industry: ${industry}
- Requirement: ${requirement}
${isEducation ? '- THIS IS AN EDUCATION REQUIREMENT' : '- THIS IS A SKILL/EXPERIENCE REQUIREMENT'}
${hasEquivalentOption ? '- Requirement allows "equivalent experience" alternative' : ''}

User's Experience:
${vaultSummary || 'Limited vault data available'}

Generate 3 SPECIFIC resume bullet points (not advice):

1. **pure_ai** - Industry Standard: Write 2-3 actual resume bullets showing how ${seniority}-level ${job_title}s typically present ${isEducation ? 'their education or equivalent credentials' : 'this capability'}. Use action verbs, metrics, and specifics.

2. **vault_based** - Adapted from User's Vault: Transform the user's actual vault experience into 2-3 resume bullets that ${isEducation && hasEquivalentOption ? 'position their experience as degree-equivalent' : 'demonstrate this requirement'}. Use their real evidence.

3. **alternative** - ${isEducation ? 'Equivalent Credentials' : 'Transferable Approach'}: Write 2-3 resume bullets showing ${isEducation ? 'certifications, coursework, or self-directed learning' : 'adjacent experience or rapid learning ability'}.

Return JSON:
{
  "solutions": [
    {
      "approach": "pure_ai",
      "title": "Industry Standard",
      "content": "• Bullet point 1 with action verb, context, and result\n• Bullet point 2...",
      "reasoning": "1-sentence explanation of why this positioning works"
    },
    {
      "approach": "vault_based", 
      "title": "Your Experience Reframed",
      "content": "• Bullet using their actual experience...",
      "reasoning": "1-sentence on how their vault maps to requirement"
    },
    {
      "approach": "alternative",
      "title": "${isEducation ? 'Equivalent Credentials' : 'Transferable Skills'}",
      "content": "• Bullet emphasizing ${isEducation ? 'learning & certifications' : 'adaptability & adjacent skills'}...",
      "reasoning": "1-sentence on why this works for ${seniority} roles"
    }
  ]
}

RULES:
- Write ACTUAL resume bullets, not advice like "Highlight X" or "Emphasize Y"
- Use specific action verbs: Led, Architected, Optimized, Drove, Implemented
- Include metrics where logical (%, $, timeframes, team size)
- Each bullet must be 1-2 lines maximum
- Focus on outcomes and business impact
${isEducation ? '- For education: If they lack degree but have experience, position years of work as equivalent' : '- For skills: Focus on results achieved using adjacent/transferable capabilities'}`;

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

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
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[Boolean AI] Generating boolean search with', messages.length, 'messages');

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
            content: `You are a Boolean Search Expert helping users create precise job search strings for Google Jobs and LinkedIn.

Your role:
1. Ask ONE question at a time to gather details about their ideal job search
2. Be conversational and friendly
3. After gathering enough info (3-5 exchanges), generate a powerful boolean search string
4. Use proper boolean operators: AND, OR, NOT, parentheses, and quotes

Key questions to ask (ONE AT A TIME):
- What job title(s) are you targeting? (e.g., "Product Manager", "Software Engineer")
- What required skills or technologies? (e.g., Python, Agile, AWS)
- Any terms to EXCLUDE? (e.g., "junior", "intern")
- Specific industries or company types? (e.g., SaaS, healthcare, startup)
- Experience level preferences?

Boolean search best practices:
- Use OR for synonyms: ("Product Manager" OR "Program Manager")
- Use AND to require terms: ("Product Manager" AND Agile)
- Use NOT to exclude: ("Software Engineer" NOT junior)
- Use quotes for exact phrases: "Full Stack Developer"
- Group with parentheses: ("Product Manager" OR "Program Manager") AND (Agile OR Scrum)

Example output:
"('Product Manager' OR 'Program Manager') AND (Agile OR Scrum OR 'Product Strategy') NOT junior NOT intern"

When you have enough information, generate the boolean string and explain what it does.`
          },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('[Boolean AI] Error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'I apologize, I could not generate a response.';

    console.log('[Boolean AI] Generated response');
    
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Boolean AI] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to generate boolean search' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

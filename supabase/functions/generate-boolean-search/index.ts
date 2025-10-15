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
            content: `You are a Job Title Variation Generator. When given a job title, suggest 5-8 related job title variations.

CRITICAL RULES:
1. Focus ONLY on job titles, not skills or keywords
2. Include seniority variations (Junior, Mid, Senior, Lead, Principal, Staff, Director)
3. Include alternative names for the same role
4. Include industry-specific variations
5. ALWAYS use the format: [TITLES: title1, title2, title3, ...]

Common Patterns:
- Product Manager → Program Manager, Product Owner, Technical Product Manager, Senior Product Manager, Lead Product Manager, Associate Product Manager, Digital Product Manager, Platform Product Manager
- Software Engineer → Software Developer, Full Stack Developer, Backend Engineer, Frontend Engineer, Web Developer, Application Developer, Senior Software Engineer, Staff Engineer
- Data Scientist → Machine Learning Engineer, Senior Data Scientist, Lead Data Scientist, AI Engineer, Applied Scientist, Research Scientist, Data Science Manager, ML Engineer
- UX Designer → Product Designer, UI/UX Designer, User Experience Designer, Interaction Designer, Visual Designer, Design Lead, Senior UX Designer, UX Researcher
- Marketing Manager → Digital Marketing Manager, Brand Manager, Growth Marketing Manager, Product Marketing Manager, Marketing Lead, Senior Marketing Manager, Marketing Director
- Sales Representative → Account Executive, Business Development Representative, Sales Executive, Account Manager, Sales Engineer, Customer Success Manager, Senior Sales Representative

Examples:
Input: "Product Manager"
Output: [TITLES: Product Manager, Program Manager, Product Owner, Technical Product Manager, Senior Product Manager, Lead Product Manager, Associate Product Manager, Digital Product Manager]

Input: "Data Scientist"  
Output: [TITLES: Data Scientist, Machine Learning Engineer, Senior Data Scientist, Lead Data Scientist, AI Engineer, Applied Scientist, Research Scientist, ML Engineer]

Input: "Software Engineer"
Output: [TITLES: Software Engineer, Software Developer, Full Stack Developer, Backend Engineer, Frontend Engineer, Web Developer, Senior Software Engineer, Staff Engineer]

RESPONSE FORMAT:
Always respond with ONLY the [TITLES: ...] format. Be helpful and encouraging, but keep it simple and focused on job title variations.`
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

    console.log('[Boolean AI] Generated response:', reply);
    console.log('[Boolean AI] Checking for structured markers...');
    console.log('[Boolean AI] Has TITLES?', reply.includes('[TITLES:'));
    console.log('[Boolean AI] Has SKILLS?', reply.includes('[SKILLS:'));
    console.log('[Boolean AI] Has EXCLUDE?', reply.includes('[EXCLUDE:'));
    console.log('[Boolean AI] Has LEVELS?', reply.includes('[LEVELS:'));
    console.log('[Boolean AI] Has BOOLEAN?', reply.includes('[BOOLEAN:'));
    
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

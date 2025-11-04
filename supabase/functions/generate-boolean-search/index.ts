import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callPerplexity, cleanCitations, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

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

    console.log('[Boolean AI] Generating boolean search with', messages.length, 'messages');

    const systemPrompt = `You are a Job Title Variation Generator. When given a job title, suggest 5-8 related job title variations.

CRITICAL RULES:
1. Focus ONLY on job titles, not skills or keywords
2. Include seniority variations (Junior, Mid, Senior, Lead, Principal, Staff, Director)
3. Include alternative names for the same role
4. Include industry-specific variations

Common Patterns:
- Product Manager → Program Manager, Product Owner, Technical Product Manager, Senior Product Manager, Lead Product Manager, Associate Product Manager, Digital Product Manager, Platform Product Manager
- Software Engineer → Software Developer, Full Stack Developer, Backend Engineer, Frontend Engineer, Web Developer, Application Developer, Senior Software Engineer, Staff Engineer
- Data Scientist → Machine Learning Engineer, Senior Data Scientist, Lead Data Scientist, AI Engineer, Applied Scientist, Research Scientist, Data Science Manager, ML Engineer`;

    const tools = [{
      type: "function" as const,
      function: {
        name: "suggest_job_titles",
        description: "Return 5-8 job title variations for boolean search",
        parameters: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: { type: "string" },
              description: "Array of job title variations including seniority levels and alternatives"
            }
          },
          required: ["titles"],
          additionalProperties: false
        }
      }
    }];

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        model: PERPLEXITY_MODELS.SMALL,
        temperature: 0.5,
        max_tokens: 500,
        return_citations: false,
        tools,
        tool_choice: { type: "function", function: { name: "suggest_job_titles" } }
      },
      'generate-boolean-search'
    );

    await logAIUsage(metrics);

    // Parse structured output from tool call
    const toolCall = response.choices[0].message.tool_calls?.[0];
    let reply: string;
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        const titles = parsed.titles || [];
        reply = JSON.stringify({ titles });
        console.log('[Boolean AI] Structured output:', { titles });
      } catch (e) {
        console.error('[Boolean AI] Failed to parse tool call:', e);
        reply = 'I apologize, I could not generate a response.';
      }
    } else {
      // Fallback to text response
      reply = cleanCitations(response.choices[0].message.content) || 'I apologize, I could not generate a response.';
      console.log('[Boolean AI] Fallback text response:', reply);
    }
    
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

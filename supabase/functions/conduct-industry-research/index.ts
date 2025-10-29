import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { targetRole, targetIndustry } = await req.json();
    console.log('[INDUSTRY RESEARCH] Starting research for:', { targetRole, targetIndustry });

    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    // Conduct comprehensive industry research using Perplexity
    const researchPrompt = `You are an expert career intelligence researcher. Conduct comprehensive research on ${targetRole} positions in the ${targetIndustry} industry.

Provide detailed information on:
1. **Common Skills & Competencies**: What skills do top performers in this role typically have?
2. **Key Achievements & Metrics**: What kinds of quantifiable achievements are valued? What metrics matter most?
3. **Leadership & Soft Skills**: What behavioral traits and leadership qualities are expected?
4. **Industry Trends**: What are the current trends affecting this role in this industry?
5. **Career Progression**: What career paths are typical for this role?

Focus on actionable, specific insights that would help someone build a competitive career profile.`;

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert career intelligence researcher. Provide detailed, actionable research based on current market data.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('[INDUSTRY RESEARCH] Perplexity API error:', errorText);
      throw new Error(`Perplexity API error: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const researchContent = perplexityData.choices[0].message.content;

    console.log('[INDUSTRY RESEARCH] Research completed successfully');

    // Store research in database for future reference
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      await supabase.from('career_vault_industry_research').insert({
        user_id: user.id,
        target_role: targetRole,
        target_industry: targetIndustry,
        research_content: researchContent,
        research_provider: 'perplexity'
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        research: {
          targetRole,
          targetIndustry,
          content: researchContent,
          commonSkills: extractSection(researchContent, 'Skills'),
          keyMetrics: extractSection(researchContent, 'Achievements'),
          leadershipTraits: extractSection(researchContent, 'Leadership'),
          industryTrends: extractSection(researchContent, 'Trends')
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[INDUSTRY RESEARCH] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function extractSection(content: string, keyword: string): string[] {
  // Simple extraction - looks for bullet points or numbered lists near keyword
  const lines = content.split('\n');
  const relevant: string[] = [];
  let capturing = false;

  for (const line of lines) {
    if (line.toLowerCase().includes(keyword.toLowerCase())) {
      capturing = true;
      continue;
    }
    if (capturing && (line.trim().startsWith('-') || line.trim().startsWith('•') || /^\d+\./.test(line.trim()))) {
      relevant.push(line.trim().replace(/^[-•\d.]\s*/, ''));
    }
    if (capturing && line.trim() === '') {
      if (relevant.length > 0) break;
    }
  }

  return relevant.slice(0, 5); // Return top 5 items
}

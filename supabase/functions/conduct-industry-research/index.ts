import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
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
    const { targetRole, targetIndustry } = await req.json();
    console.log('[INDUSTRY RESEARCH] Starting research for:', { targetRole, targetIndustry });

    // Conduct comprehensive industry research using Lovable AI
    const systemPrompt = `You are an expert career intelligence researcher. Provide detailed, actionable research based on current market data. Return ONLY valid JSON with structured research insights.

CRITICAL: Focus on actionable, specific insights for building a competitive career profile.`;

    const userPrompt = `Conduct comprehensive research on ${targetRole} positions in the ${targetIndustry} industry.

Provide detailed information on:
1. **Common Skills & Competencies**: What skills do top performers in this role typically have?
2. **Key Achievements & Metrics**: What kinds of quantifiable achievements are valued? What metrics matter most?
3. **Leadership & Soft Skills**: What behavioral traits and leadership qualities are expected?
4. **Industry Trends**: What are the current trends affecting this role in this industry?
5. **Career Progression**: What career paths are typical for this role?

Focus on actionable, specific insights that would help someone build a competitive career profile.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.2,
        max_tokens: 2000
      },
      'conduct-industry-research'
    );

    await logAIUsage(metrics);

    const researchContent = response.choices[0].message.content;
    console.log('[conduct-industry-research] Raw AI response:', researchContent.substring(0, 500));

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

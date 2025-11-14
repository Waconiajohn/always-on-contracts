import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { callPerplexity } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { selectOptimalModel } from '../_shared/model-optimizer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription, companyResearch, vaultId } = await req.json();
    
    if (!jobDescription || !vaultId) {
      throw new Error('Job description and vault ID required');
    }

    // Get vault data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: vault, error: vaultError } = await supabase
      .from('career_vault')
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Failed to fetch vault data');
    }

    console.log('[30-60-90-PLAN] Generating plan for:', jobDescription.slice(0, 100));

    const prompt = `Job Description:
${jobDescription}

${companyResearch ? `Company Context:
${JSON.stringify(companyResearch, null, 2)}` : ''}

Candidate Background:
- Target Roles: ${vault.target_roles?.join(', ') || 'Not specified'}
- Industries: ${vault.target_industries?.join(', ') || 'Not specified'}

Create a detailed 30-60-90 day onboarding plan tailored to this role and company.

Return JSON with this structure:
{
  "first_30_days": {
    "learning_objectives": ["..."],
    "relationships": ["..."],
    "technical_goals": ["..."]
  },
  "days_31_60": {
    "early_wins": ["..."],
    "contributions": ["..."],
    "feedback_loops": ["..."]
  },
  "days_61_90": {
    "value_creation": ["..."],
    "integration": ["..."],
    "long_term_planning": ["..."]
  }
}`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a career strategist helping candidates create actionable 30-60-90 day onboarding plans. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'medium',
          requiresReasoning: true
        }),
        temperature: 0.7,
        max_tokens: 2000,
        return_citations: false,
      },
      'generate-30-60-90-plan'
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No plan generated');
    }

    const planData = JSON.parse(jsonMatch[0]);

    console.log('[30-60-90-PLAN] Generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        plan: planData,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[30-60-90-PLAN] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

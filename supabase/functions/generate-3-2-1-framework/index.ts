import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
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
      .select(`
        *,
        vault_power_phrases(*),
        vault_transferable_skills(*),
        vault_hidden_competencies(*)
      `)
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Failed to fetch vault data');
    }

    console.log('[3-2-1-FRAMEWORK] Generating framework for vault:', vaultId);

    const prompt = `Job Description:
${jobDescription}

${companyResearch ? `Company Research:
Overview: ${companyResearch.overview || ''}
Growth Plans: ${companyResearch.growth_plans || ''}
Risks: ${companyResearch.risks || ''}` : ''}

Candidate Evidence:
- Power Phrases: ${vault.vault_power_phrases?.slice(0, 10).map((p: any) => p.phrase).join('; ') || 'None'}
- Key Skills: ${vault.vault_transferable_skills?.slice(0, 10).map((s: any) => s.stated_skill).join('; ') || 'None'}
- Competencies: ${vault.vault_hidden_competencies?.slice(0, 5).map((c: any) => c.competency_area).join('; ') || 'None'}

Create the 3-2-1 Framework:
- 3 EXAMPLES: Résumé-based proof of meeting major job requirements
- 2 QUESTIONS: Smart, researched questions about the business/role
- 1 CLOSING: Confident closing statement

Return JSON with this structure:
{
  "examples": [
    {"requirement": "...", "proof_story": "...", "why_works": "..."}
  ],
  "questions": [
    {"question": "...", "why_smart": "..."}
  ],
  "closing_statement": "..."
}`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are an interview coach creating the 3-2-1 framework: 3 proof examples, 2 smart questions, 1 closing statement. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: PERPLEXITY_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 2000,
        return_citations: false,
      },
      'generate-3-2-1-framework'
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No framework generated');
    }

    const frameworkData = JSON.parse(jsonMatch[0]);

    console.log('[3-2-1-FRAMEWORK] Generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        ...frameworkData,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[3-2-1-FRAMEWORK] Error:', error);
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

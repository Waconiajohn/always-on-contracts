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
    const { jobDescription, vaultId } = await req.json();
    
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

    console.log('[ELEVATOR-PITCH] Generating pitch for vault:', vaultId);

    const prompt = `Job Description:
${jobDescription}

Career Background:
- Power Phrases: ${vault.vault_power_phrases?.slice(0, 10).map((p: any) => p.phrase).join('; ') || 'None'}
- Transferable Skills: ${vault.vault_transferable_skills?.slice(0, 10).map((s: any) => s.stated_skill).join('; ') || 'None'}
- Hidden Competencies: ${vault.vault_hidden_competencies?.slice(0, 5).map((c: any) => c.competency_area).join('; ') || 'None'}

Extract the top 4-6 job requirements and create first-person stories for each requirement using the career data provided.

Return JSON with this structure:
{
  "requirements": [
    {
      "requirement": "...",
      "description": "...",
      "first_person_story": "..."
    }
  ],
  "elevator_pitch": "30-60 second elevator pitch summarizing perfect fit"
}`;

    const { response, metrics } = await callPerplexity(
      {
        messages: [
          {
            role: 'system',
            content: 'You are a career coach helping candidates create elevator pitches and requirement-matching narratives. Return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: selectOptimalModel({
          taskType: 'generation',
          complexity: 'medium',
          estimatedInputTokens: 800,
          estimatedOutputTokens: 1500
        }),
        temperature: 0.7,
        max_tokens: 1500,
        return_citations: false,
      },
      'generate-elevator-pitch'
    );

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No pitch data generated');
    }

    const pitchData = JSON.parse(jsonMatch[0]);

    console.log('[ELEVATOR-PITCH] Generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        ...pitchData,
        generatedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ELEVATOR-PITCH] Error:', error);
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

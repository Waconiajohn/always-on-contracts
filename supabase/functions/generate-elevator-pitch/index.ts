import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { callLovableAI, LOVABLE_AI_MODELS } from '../_shared/lovable-ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';
import { extractJSON } from '../_shared/json-parser.ts';

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

    const systemPrompt = `You are a career coach helping candidates create elevator pitches and requirement-matching narratives. Return ONLY valid JSON, no additional text or explanations.

CRITICAL: Return ONLY this exact JSON structure, nothing else:
{
  "requirements": [
    {
      "requirement": "string - the job requirement",
      "description": "string - what this requirement means",
      "first_person_story": "string - first-person narrative showing this capability"
    }
  ],
  "elevator_pitch": "string - 30-60 second elevator pitch summarizing perfect fit"
}`;

    const userPrompt = `Create an elevator pitch and requirement-matching stories.

Job Description:
${jobDescription}

Career Background:
- Power Phrases: ${vault.vault_power_phrases?.slice(0, 10).map((p: any) => p.phrase).join('; ') || 'None'}
- Transferable Skills: ${vault.vault_transferable_skills?.slice(0, 10).map((s: any) => s.stated_skill).join('; ') || 'None'}
- Hidden Competencies: ${vault.vault_hidden_competencies?.slice(0, 5).map((c: any) => c.competency_area).join('; ') || 'None'}

Extract the top 4-6 job requirements and create first-person stories for each requirement using the career data provided.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      },
      'generate-elevator-pitch'
    );

    await logAIUsage(metrics);

    const rawContent = response.choices[0].message.content;
    console.log('[generate-elevator-pitch] Raw AI response:', rawContent.substring(0, 500));
    
    const parseResult = extractJSON(rawContent);
    
    if (!parseResult.success || !parseResult.data) {
      console.error('[generate-elevator-pitch] JSON parse failed:', parseResult.error);
      console.error('[generate-elevator-pitch] Full response:', rawContent);
      throw new Error(`Failed to parse AI response: ${parseResult.error}`);
    }

    const pitchData = parseResult.data;

    // Validate required fields
    if (!Array.isArray(pitchData.requirements) || !pitchData.elevator_pitch) {
      console.error('[generate-elevator-pitch] Missing required fields:', pitchData);
      throw new Error('AI response missing required fields');
    }

    console.log('[generate-elevator-pitch] Generated successfully:', {
      requirements: pitchData.requirements.length
    });

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

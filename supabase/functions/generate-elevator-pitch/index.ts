import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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
            content: 'You are a career coach helping candidates create elevator pitches and requirement-matching narratives.'
          },
          {
            role: 'user',
            content: `Job Description:
${jobDescription}

Career Background:
- Power Phrases: ${vault.vault_power_phrases?.slice(0, 10).map((p: any) => p.phrase).join('; ') || 'None'}
- Transferable Skills: ${vault.vault_transferable_skills?.slice(0, 10).map((s: any) => s.stated_skill).join('; ') || 'None'}
- Hidden Competencies: ${vault.vault_hidden_competencies?.slice(0, 5).map((c: any) => c.competency_area).join('; ') || 'None'}

Extract the top 4-6 job requirements and create first-person stories for each requirement using the career data provided.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_elevator_pitch",
            description: "Create elevator pitch with requirement matching",
            parameters: {
              type: "object",
              properties: {
                requirements: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      requirement: { type: "string", description: "The job requirement" },
                      description: { type: "string", description: "What this requirement means" },
                      first_person_story: { type: "string", description: "First-person narrative showing how candidate meets this" }
                    },
                    required: ["requirement", "description", "first_person_story"]
                  }
                },
                elevator_pitch: { 
                  type: "string", 
                  description: "30-60 second elevator pitch summarizing perfect fit" 
                }
              },
              required: ["requirements", "elevator_pitch"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_elevator_pitch" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ELEVATOR-PITCH] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No pitch data generated');
    }

    const pitchData = JSON.parse(toolCall.function.arguments);

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

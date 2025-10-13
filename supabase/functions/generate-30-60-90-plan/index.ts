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
    const { jobDescription, companyResearch, vaultId } = await req.json();
    
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
      .select('*')
      .eq('id', vaultId)
      .single();

    if (vaultError || !vault) {
      throw new Error('Failed to fetch vault data');
    }

    console.log('[30-60-90-PLAN] Generating plan for:', jobDescription.slice(0, 100));

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
            content: 'You are a career strategist helping candidates create actionable 30-60-90 day onboarding plans.'
          },
          {
            role: 'user',
            content: `Job Description:
${jobDescription}

${companyResearch ? `Company Context:
${JSON.stringify(companyResearch, null, 2)}` : ''}

Candidate Background:
- Target Roles: ${vault.target_roles?.join(', ') || 'Not specified'}
- Industries: ${vault.target_industries?.join(', ') || 'Not specified'}

Create a detailed 30-60-90 day onboarding plan tailored to this role and company.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_30_60_90_plan",
            description: "Create onboarding roadmap",
            parameters: {
              type: "object",
              properties: {
                first_30_days: {
                  type: "object",
                  properties: {
                    learning_objectives: { type: "array", items: { type: "string" } },
                    relationships: { type: "array", items: { type: "string" } },
                    technical_goals: { type: "array", items: { type: "string" } }
                  }
                },
                days_31_60: {
                  type: "object",
                  properties: {
                    early_wins: { type: "array", items: { type: "string" } },
                    contributions: { type: "array", items: { type: "string" } },
                    feedback_loops: { type: "array", items: { type: "string" } }
                  }
                },
                days_61_90: {
                  type: "object",
                  properties: {
                    value_creation: { type: "array", items: { type: "string" } },
                    integration: { type: "array", items: { type: "string" } },
                    long_term_planning: { type: "array", items: { type: "string" } }
                  }
                }
              },
              required: ["first_30_days", "days_31_60", "days_61_90"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_30_60_90_plan" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[30-60-90-PLAN] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No plan generated');
    }

    const planData = JSON.parse(toolCall.function.arguments);

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

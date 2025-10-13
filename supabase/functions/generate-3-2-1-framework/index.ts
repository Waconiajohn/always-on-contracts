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
            content: 'You are an interview coach creating the 3-2-1 framework: 3 proof examples, 2 smart questions, 1 closing statement.'
          },
          {
            role: 'user',
            content: `Job Description:
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
- 1 CLOSING: Confident closing statement`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_3_2_1_framework",
            description: "Create 3-2-1 interview framework",
            parameters: {
              type: "object",
              properties: {
                examples: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      requirement: { type: "string", description: "Job requirement being addressed" },
                      proof_story: { type: "string", description: "First-person story proving capability" },
                      why_works: { type: "string", description: "Explanation of why this example is effective" }
                    },
                    required: ["requirement", "proof_story", "why_works"]
                  },
                  minItems: 3,
                  maxItems: 3
                },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string", description: "The smart question" },
                      why_smart: { type: "string", description: "Why this question demonstrates research/insight" }
                    },
                    required: ["question", "why_smart"]
                  },
                  minItems: 2,
                  maxItems: 2
                },
                closing_statement: { 
                  type: "string", 
                  description: "Confident, specific closing statement" 
                }
              },
              required: ["examples", "questions", "closing_statement"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "create_3_2_1_framework" } }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[3-2-1-FRAMEWORK] API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No framework generated');
    }

    const frameworkData = JSON.parse(toolCall.function.arguments);

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

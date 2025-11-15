import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
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
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user } } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (!user) throw new Error('Unauthorized');

    const { answer, question, responseId } = await req.json();

    console.log('[INTERVIEW-AUDIT] Validating response with dual AI audit');

    // Get Career Vault data
    const vaultResponse = await supabase.functions.invoke('get-vault-intelligence', {
      body: { userId: user.id }
    });

    const vaultData = vaultResponse.data?.intelligence || {};

    // Dual AI Audit
    const auditResponse = await fetch(`${supabaseUrl}/functions/v1/dual-ai-audit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: answer,
        contentType: 'interview_answer',
        context: {
          careerVaultData: vaultData
        }
      })
    });

    const auditData = await auditResponse.json();
    const audit = auditData.audit;

    // Specific STAR analysis
    const starPrompt = `Analyze this interview answer for STAR structure:

QUESTION: ${question}
ANSWER: ${answer}

Rate (1-10):
1. Situation clarity
2. Task specificity
3. Action detail
4. Result quantification
5. Overall authenticity

Provide specific improvements for each component.`;

    const { response: starData, metrics: starMetrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: 'You are an interview coach expert.' },
          { role: 'user', content: starPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.3,
      },
      'validate-interview-response-with-audit',
      user.id
    );

    await logAIUsage(starMetrics);

    const starAnalysis = starData.choices[0].message.content;

    // Update response
    if (responseId) {
      await supabase
        .from('vault_interview_responses')
        .update({
          validation_data: {
            dualAudit: audit,
            starAnalysis,
            verifiedClaims: audit.verification_analysis.verified_claims,
            unverifiedStatements: audit.verification_analysis.unverified_statements,
            recommendations: audit.consensus.final_recommendations
          },
          is_strong: audit.primary_analysis.score >= 75 && 
                     audit.verification_analysis.factual_accuracy_score >= 80
        })
        .eq('id', responseId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        isStrong: audit.primary_analysis.score >= 75 && 
                  audit.verification_analysis.factual_accuracy_score >= 80,
        dualAudit: audit,
        starAnalysis,
        recommendations: audit.consensus.final_recommendations,
        verifiedClaims: audit.verification_analysis.verified_claims,
        unverifiedStatements: audit.verification_analysis.unverified_statements,
        overallScore: audit.primary_analysis.score,
        factualAccuracyScore: audit.verification_analysis.factual_accuracy_score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[INTERVIEW-AUDIT] Error:', error);
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

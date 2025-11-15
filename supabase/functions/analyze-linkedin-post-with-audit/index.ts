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

    const { postContent, postId } = await req.json();

    console.log('[LINKEDIN-POST-AUDIT] Analyzing post with dual AI audit');

    // Dual AI Audit for fact-checking
    const auditResponse = await fetch(`${supabaseUrl}/functions/v1/dual-ai-audit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: postContent,
        contentType: 'linkedin_post',
        context: {}
      })
    });

    const auditData = await auditResponse.json();
    const audit = auditData.audit;

    // Generate engagement analysis
    const engagementPrompt = `Analyze this LinkedIn post for engagement potential:

POST:
${postContent}

Rate on:
1. Hook strength (1-10)
2. Value delivery (1-10)
3. Call-to-action clarity (1-10)
4. Readability (1-10)
5. Professional tone (1-10)

Provide specific suggestions to improve engagement.`;

    const { response, metrics } = await callLovableAI(
      {
        messages: [
          { role: 'system', content: 'You are a LinkedIn content strategist.' },
          { role: 'user', content: engagementPrompt }
        ],
        model: LOVABLE_AI_MODELS.DEFAULT,
        temperature: 0.7,
        max_tokens: 800,
      },
      'analyze-linkedin-post-with-audit',
      user.id
    );

    await logAIUsage(metrics);

    const engagementAnalysis = response.choices[0].message.content;

    // Update post with audit results
    if (postId) {
      await supabase
        .from('linkedin_posts')
        .update({
          analysis_data: {
            dualAudit: audit,
            engagementAnalysis,
            factualAccuracyScore: audit.verification_analysis.factual_accuracy_score,
            verifiedClaims: audit.verification_analysis.verified_claims,
            unverifiedStatements: audit.verification_analysis.unverified_statements
          },
          engagement_score: audit.primary_analysis.score
        })
        .eq('id', postId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        dualAudit: audit,
        engagementAnalysis,
        recommendations: audit.consensus.final_recommendations,
        verifiedClaims: audit.verification_analysis.verified_claims,
        unverifiedStatements: audit.verification_analysis.unverified_statements,
        factualAccuracyScore: audit.verification_analysis.factual_accuracy_score,
        engagementScore: audit.primary_analysis.score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[LINKEDIN-POST-AUDIT] Error:', error);
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

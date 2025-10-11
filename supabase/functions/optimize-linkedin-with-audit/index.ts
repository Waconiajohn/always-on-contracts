import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { currentProfile, targetIndustry } = await req.json();

    console.log('[LINKEDIN-AUDIT] Optimizing with dual AI audit');

    // Get Career Vault data
    const vaultResponse = await supabase.functions.invoke('get-vault-intelligence', {
      body: { userId: user.id }
    });

    const vaultData = vaultResponse.data?.intelligence || {};

    // Generate optimized profile
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const optimizationPrompt = `Optimize this LinkedIn profile:

CURRENT PROFILE:
Headline: ${currentProfile.headline || ''}
About: ${currentProfile.about || ''}
Skills: ${currentProfile.featured_skills?.join(', ') || ''}

TARGET INDUSTRY: ${targetIndustry}

CAREER VAULT DATA:
${JSON.stringify(vaultData)}

Create an optimized profile with:
1. Compelling headline (220 chars max)
2. Story-driven about section (2600 chars max)
3. Strategic skill positioning
4. Quantified achievements

Return JSON:
{
  "headline": "...",
  "about": "...",
  "featured_skills": ["skill1", "skill2", ...],
  "optimization_tips": ["tip1", "tip2", ...]
}`;

    const optimizationResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a LinkedIn optimization expert.' },
          { role: 'user', content: optimizationPrompt }
        ]
      })
    });

    const optimizationData = await optimizationResponse.json();
    const optimizedContent = optimizationData.choices[0].message.content;

    let optimizedProfile;
    try {
      const jsonMatch = optimizedContent.match(/\{[\s\S]*\}/);
      optimizedProfile = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(optimizedContent);
    } catch (e) {
      throw new Error('Failed to parse optimization response');
    }

    // Dual AI Audit
    console.log('[LINKEDIN-AUDIT] Running dual AI audit');
    const auditContent = `Headline: ${optimizedProfile.headline}\n\nAbout: ${optimizedProfile.about}`;
    
    const auditResponse = await fetch(`${supabaseUrl}/functions/v1/dual-ai-audit`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: auditContent,
        contentType: 'linkedin_profile',
        context: {
          industryContext: targetIndustry,
          careerVaultData: vaultData
        }
      })
    });

    const auditData = await auditResponse.json();
    const audit = auditData.audit;

    // Update database
    await supabase
      .from('linkedin_profiles')
      .upsert({
        user_id: user.id,
        headline: optimizedProfile.headline,
        about: optimizedProfile.about,
        featured_skills: optimizedProfile.featured_skills,
        optimization_score: audit.primary_analysis.score,
        optimized_content: {
          ...optimizedProfile,
          dualAudit: audit
        },
        last_optimized_at: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        optimizedProfile,
        dualAudit: audit,
        recommendations: audit.consensus.final_recommendations,
        verifiedClaims: audit.verification_analysis.verified_claims,
        unverifiedStatements: audit.verification_analysis.unverified_statements,
        optimizationScore: audit.primary_analysis.score,
        factualAccuracyScore: audit.verification_analysis.factual_accuracy_score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[LINKEDIN-AUDIT] Error:', error);
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

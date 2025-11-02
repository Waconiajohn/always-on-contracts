import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callPerplexity, PERPLEXITY_MODELS } from '../_shared/ai-config.ts';
import { logAIUsage } from '../_shared/cost-tracking.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Generate AI Vault Item Recommendations
 *
 * Analyzes low-performing vault items and generates AI-powered suggestions
 * for improvements based on effectiveness scores and usage patterns.
 */

interface VaultItemIssue {
  category: string;
  itemId: string;
  content: any;
  effectivenessScore: number;
  timesUsed: number;
  timesRemoved: number;
  qualityTier: string;
  issue: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) throw new Error('Unauthorized');

    const { vaultId, category, limit = 5 } = await req.json();

    if (!vaultId) throw new Error('Vault ID is required');

    console.log(`[VAULT-RECOMMENDATIONS] Analyzing vault ${vaultId} for user ${user.id}`);

    // Categories to analyze
    const categories = category ? [category] : [
      'power_phrases',
      'transferable_skills',
      'hidden_competencies',
      'soft_skills',
      'leadership_philosophy'
    ];

    const issues: VaultItemIssue[] = [];

    // Find low-performing items across categories
    for (const cat of categories) {
      const { data } = await supabase
        .from(`vault_${cat}`)
        .select('*')
        .eq('user_id', user.id)
        .gte('times_used', 3)  // Need enough usage data
        .lt('effectiveness_score', 0.4)  // Poor performance
        .order('effectiveness_score', { ascending: true })
        .limit(limit);

      if (data && data.length > 0) {
        data.forEach(item => {
          let issue = '';
          if (item.times_removed >= item.times_kept) {
            issue = 'frequently_removed';
          } else if (item.effectiveness_score < 0.3) {
            issue = 'very_low_effectiveness';
          } else {
            issue = 'low_effectiveness';
          }

          issues.push({
            category: cat,
            itemId: item.id,
            content: item,
            effectivenessScore: item.effectiveness_score || 0,
            timesUsed: item.times_used || 0,
            timesRemoved: item.times_removed || 0,
            qualityTier: item.quality_tier || 'assumed',
            issue
          });
        });
      }
    }

    if (issues.length === 0) {
      console.log('[VAULT-RECOMMENDATIONS] No low-performing items found');
      return new Response(
        JSON.stringify({
          success: true,
          recommendations: [],
          message: 'No improvements needed - your vault is performing well!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[VAULT-RECOMMENDATIONS] Found ${issues.length} items needing improvement`);

    const recommendations = [];

    for (const issue of issues.slice(0, limit)) {
      const itemContent = JSON.stringify(issue.content).substring(0, 800);

      const prompt = `You are a career strategist improving a Career Vault item that users consistently remove.

PROBLEMATIC VAULT ITEM:
Category: ${issue.category}
Quality Tier: ${issue.qualityTier}
Effectiveness Score: ${(issue.effectivenessScore * 100).toFixed(0)}% (users remove it ${issue.timesRemoved} out of ${issue.timesUsed} times)
Content: ${itemContent}

ISSUE: ${
  issue.issue === 'frequently_removed' ? 'Users remove this item from their resumes most of the time' :
  issue.issue === 'very_low_effectiveness' ? 'This item has very low effectiveness - users almost never keep it' :
  'This item performs below average'
}

ANALYZE AND IMPROVE:

1. **Identify the problem**: Why might recruiters or ATS systems reject this?
   - Too vague/generic?
   - Lacks quantification?
   - Outdated language?
   - Irrelevant keywords?
   - Poor formatting?

2. **Generate improved version**: Rewrite to fix the issues
   - Add specific numbers/metrics
   - Use industry-standard terminology
   - Include ATS-friendly keywords
   - Make it action-oriented
   - Show clear impact/value

3. **Explain the changes**: What specifically improved?

Return ONLY valid JSON:
{
  "diagnosis": {
    "mainIssue": "Too vague - lacks quantification",
    "secondaryIssues": ["Generic language", "No measurable impact"],
    "likelyReason": "ATS filters out non-specific achievements"
  },
  "improvedVersion": "Led cross-functional team of 12 engineers to deliver $2.3M product launch, achieving 156% of revenue target within Q1",
  "keyImprovements": [
    "Added team size (12 engineers)",
    "Quantified budget impact ($2.3M)",
    "Included success metric (156% of target)",
    "Added timeline specificity (Q1)"
  ],
  "expectedImpact": "High - specific metrics and quantified outcomes significantly improve ATS matching and recruiter appeal",
  "recommendedAction": "replace" | "enhance" | "remove"
}`;

      try {
        const { response, metrics } = await callPerplexity(
          {
            messages: [{ role: 'user', content: prompt }],
            model: PERPLEXITY_MODELS.DEFAULT,
            temperature: 0.3,
          },
          'generate-vault-recommendations',
          user.id
        );

        await logAIUsage(metrics);

        const recommendation = JSON.parse(response.choices[0].message.content);

        recommendations.push({
          vaultCategory: issue.category,
          vaultItemId: issue.itemId,
          currentVersion: issue.content,
          effectivenessScore: issue.effectivenessScore,
          timesUsed: issue.timesUsed,
          timesRemoved: issue.timesRemoved,
          ...recommendation
        });

        console.log(`[VAULT-RECOMMENDATIONS] ✓ Generated recommendation for ${issue.category}/${issue.itemId}`);

      } catch (error) {
        console.error('[VAULT-RECOMMENDATIONS] Error generating recommendation:', error);
      }
    }

    console.log(`[VAULT-RECOMMENDATIONS] ✅ Generated ${recommendations.length} recommendations`);

    // Calculate potential vault improvement
    const avgCurrentEffectiveness = issues.reduce((sum, i) => sum + i.effectivenessScore, 0) / issues.length;
    const potentialImprovement = (0.75 - avgCurrentEffectiveness) * 100;  // Assume improvements bring to 75%

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        summary: {
          itemsAnalyzed: issues.length,
          recommendationsGenerated: recommendations.length,
          avgCurrentEffectiveness: Math.round(avgCurrentEffectiveness * 100),
          potentialImprovement: Math.round(potentialImprovement),
          estimatedVaultQualityIncrease: `+${Math.round(potentialImprovement)}%`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[VAULT-RECOMMENDATIONS] Error:', error);
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

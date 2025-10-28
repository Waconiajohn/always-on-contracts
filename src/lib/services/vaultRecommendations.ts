import { supabase } from '@/integrations/supabase/client';

interface VaultRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  timeEstimate: string;
  scoreBoost: number;
  icon: string;
  category: 'verification' | 'metrics' | 'freshness' | 'consolidation';
}

export const getVaultRecommendations = async (vaultId: string): Promise<VaultRecommendation[]> => {
  const recommendations: VaultRecommendation[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Count assumed items
    const { data: powerPhrases } = await supabase
      .from('vault_power_phrases')
      .select('id, quality_tier')
      .eq('vault_id', vaultId);

    const { data: skills } = await supabase
      .from('vault_transferable_skills')
      .select('id, quality_tier')
      .eq('vault_id', vaultId);

    const { data: competencies } = await supabase
      .from('vault_hidden_competencies')
      .select('id, quality_tier')
      .eq('vault_id', vaultId);

    const assumedCount = 
      (powerPhrases?.filter(p => !p.quality_tier || p.quality_tier === 'assumed').length || 0) +
      (skills?.filter(s => !s.quality_tier || s.quality_tier === 'assumed').length || 0) +
      (competencies?.filter(c => !c.quality_tier || c.quality_tier === 'assumed').length || 0);

    if (assumedCount > 0) {
      recommendations.push({
        id: 'verify-assumed',
        title: `Verify ${assumedCount} AI-Assumed Items`,
        description: 'Quick quiz to upgrade quality from "Assumed" to "Gold"',
        action: 'Start Verification Quiz',
        impact: 'high',
        timeEstimate: '5 minutes',
        scoreBoost: Math.min(assumedCount * 2, 25),
        icon: '🎯',
        category: 'verification'
      });
    }

    // Check for items without metrics
    const phrasesWithoutMetrics = powerPhrases?.filter(p => 
      !p.quality_tier || 
      !(p as any).impact_metrics || 
      Object.keys((p as any).impact_metrics || {}).length === 0
    ).length || 0;

    if (phrasesWithoutMetrics > 5) {
      recommendations.push({
        id: 'add-metrics',
        title: `Add Metrics to ${phrasesWithoutMetrics} Achievements`,
        description: 'Quantify your impact with numbers and percentages',
        action: 'Add Metrics',
        impact: 'high',
        timeEstimate: '10 minutes',
        scoreBoost: Math.min(phrasesWithoutMetrics, 15),
        icon: '📊',
        category: 'metrics'
      });
    }

    // Check for stale items (>6 months old)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const staleItems = [
      ...(powerPhrases?.filter(p => 
        !(p as any).last_updated_at || 
        new Date((p as any).last_updated_at) < sixMonthsAgo
      ) || []),
      ...(skills?.filter(s => 
        !(s as any).last_updated_at || 
        new Date((s as any).last_updated_at) < sixMonthsAgo
      ) || []),
    ];

    if (staleItems.length > 10) {
      recommendations.push({
        id: 'refresh-stale',
        title: `Update ${staleItems.length} Stale Items`,
        description: 'Review and modernize items older than 6 months',
        action: 'Refresh Items',
        impact: 'medium',
        timeEstimate: '15 minutes',
        scoreBoost: Math.min(staleItems.length, 12),
        icon: '🔄',
        category: 'freshness'
      });
    }

    // Check for potential duplicates (basic check)
    const allContent = [
      ...(powerPhrases?.map(p => (p as any).power_phrase?.toLowerCase()) || []),
      ...(skills?.map(s => (s as any).stated_skill?.toLowerCase()) || []),
    ].filter(Boolean);

    const uniqueContent = new Set(allContent);
    const duplicateCount = allContent.length - uniqueContent.size;

    if (duplicateCount > 3) {
      recommendations.push({
        id: 'consolidate-duplicates',
        title: `Merge ${duplicateCount} Duplicate Items`,
        description: 'Consolidate similar entries to maintain quality',
        action: 'Review Duplicates',
        impact: 'low',
        timeEstimate: '5 minutes',
        scoreBoost: duplicateCount,
        icon: '🔗',
        category: 'consolidation'
      });
    }

    // Sort by impact and score boost
    const impactOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      return impactDiff !== 0 ? impactDiff : b.scoreBoost - a.scoreBoost;
    });

    return recommendations;
  } catch (error) {
    console.error('Error generating vault recommendations:', error);
    return [];
  }
};

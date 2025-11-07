import { useMemo } from 'react';
import { generateMissions } from '@/lib/utils/missionGenerator';
import type { VaultData } from './useVaultData';
import type { VaultStats } from './useVaultStats';

/**
 * Generate missions based on vault data and stats
 * Memoized for performance
 */
export const useVaultMissions = (
  vaultData: VaultData | undefined,
  stats: VaultStats | null,
  callbacks: {
    onVerifyAssumed: () => void;
    onAddMetrics: () => void;
    onRefreshStale: () => void;
  }
) => {
  return useMemo(() => {
    if (!vaultData || !stats) return [];

    // Count weak phrases (without metrics)
    const weakPhrasesCount = vaultData.powerPhrases.filter(
      (p: any) => !p.impact_metrics || Object.keys(p.impact_metrics).length === 0
    ).length;

    // Count stale items (not updated in 6+ months)
    const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const allItems = [
      ...vaultData.powerPhrases,
      ...vaultData.transferableSkills,
      ...vaultData.hiddenCompetencies,
    ];
    const staleItemsCount = allItems.filter((item: any) => {
      const lastUpdated = item.last_updated_at || item.updated_at || item.created_at;
      return lastUpdated && new Date(lastUpdated).getTime() < sixMonthsAgo;
    }).length;

    return generateMissions({
      assumedNeedingReview: stats.qualityDistribution.assumedNeedingReview,
      weakPhrasesCount,
      staleItemsCount,
      strengthScore: stats.strengthScore.total,
      targetRoles: vaultData.userProfile?.target_roles || [],
      onVerifyAssumed: callbacks.onVerifyAssumed,
      onAddMetrics: callbacks.onAddMetrics,
      onRefreshStale: callbacks.onRefreshStale,
    });
  }, [vaultData, stats, callbacks]);
};

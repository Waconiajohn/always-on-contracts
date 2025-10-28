/**
 * Utility for calculating quality distribution across all vault items
 * Consolidates duplicate calculation logic from CareerVaultDashboard
 */

interface VaultItem {
  quality_tier?: string | null;
  source?: string | null;
}

export interface QualityDistribution {
  gold: number;
  silver: number;
  bronze: number;
  assumed: number;
}

/**
 * Calculate quality distribution across all vault item arrays
 * Handles both quality_tier and source fields (for vault_confirmed_skills)
 */
export const calculateQualityDistribution = (
  ...itemArrays: VaultItem[][]
): QualityDistribution => {
  const allItems = itemArrays.flat();

  return {
    gold: allItems.filter(
      (item) => item.quality_tier === 'gold' || item.source === 'gold'
    ).length,
    silver: allItems.filter(
      (item) => item.quality_tier === 'silver' || item.source === 'silver'
    ).length,
    bronze: allItems.filter(
      (item) => item.quality_tier === 'bronze' || item.source === 'bronze'
    ).length,
    assumed: allItems.filter(
      (item) =>
        !item.quality_tier ||
        item.quality_tier === 'assumed' ||
        !item.source ||
        item.source === 'assumed'
    ).length,
  };
};

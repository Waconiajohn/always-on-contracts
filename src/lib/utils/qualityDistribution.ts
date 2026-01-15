/**
 * Utility for calculating quality distribution across all Master Resume items
 * Consolidates duplicate calculation logic from resume management components
 */

interface ResumeItem {
  quality_tier?: string | null;
  source?: string | null;
  confidence_score?: number | null;
  needs_review?: boolean | null;
  user_reviewed?: boolean | null;
}

export interface QualityDistribution {
  gold: number;
  silver: number;
  bronze: number;
  assumed: number;
  assumedNeedingReview: number; // High-priority assumed items that need verification
}

/**
 * Calculate quality distribution across all Master Resume item arrays
 * Handles both quality_tier and source fields (for confirmed skills)
 *
 * NEW: Filters "assumed" items to only those that need review:
 * - Has NOT been user reviewed (user_reviewed !== true)
 * - Either marked needs_review=true OR has low confidence (<70%)
 *
 * This prevents the "1173 items need verification" bug where ALL assumed
 * items were counted, even those that don't actually need review.
 */
export const calculateQualityDistribution = (
  ...itemArrays: ResumeItem[][]
): QualityDistribution => {
  const allItems = itemArrays.flat();

  const assumedItems = allItems.filter(
    (item) =>
      !item.quality_tier ||
      item.quality_tier === 'assumed' ||
      !item.source ||
      item.source === 'assumed'
  );

  // Only count assumed items that actually need user review:
  // 1. Not already reviewed by user
  // 2. Either explicitly marked needs_review OR has low confidence
  const assumedNeedingReview = assumedItems.filter((item) => {
    const notReviewed = item.user_reviewed !== true;
    const needsReview = item.needs_review === true ||
                       (item.confidence_score !== null &&
                        item.confidence_score !== undefined &&
                        item.confidence_score < 70);
    return notReviewed && needsReview;
  });

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
    assumed: assumedItems.length,
    assumedNeedingReview: assumedNeedingReview.length,
  };
};

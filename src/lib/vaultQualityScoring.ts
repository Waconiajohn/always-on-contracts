/**
 * Vault Quality Scoring System
 * Assigns quality tiers and freshness scores to vault items
 */

export type QualityTier = 'gold' | 'silver' | 'bronze' | 'assumed';

export interface VaultMatchWithQuality {
  vaultItemId: string;
  vaultCategory: string;
  content: any;
  matchScore: number;
  matchReasons: string[];
  satisfiesRequirements: string[];
  atsKeywords: string[];
  enhancedLanguage?: string;
  qualityTier: QualityTier;
  freshnessScore: number;
  verificationDetails?: {
    quizVerified: boolean;
    evidenceCount: number;
    aiInferred: boolean;
    lastUpdated?: string;
  };
}

/**
 * Assign quality tier based on vault item verification status and AI confidence
 */
export const assignQualityTier = (item: any): QualityTier => {
  // Use existing quality_tier if already set
  if (item.quality_tier && ['gold', 'silver', 'bronze', 'assumed'].includes(item.quality_tier)) {
    return item.quality_tier as QualityTier;
  }

  // Gold: Quiz-verified skills or high confidence (>0.85) with evidence
  if (item.quiz_verified || item.verification_status === 'verified') {
    return 'gold';
  }

  // Silver: High AI confidence (0.70-0.85) OR evidence-based (3+ pieces)
  if ((item.ai_confidence && item.ai_confidence >= 0.70) || 
      (item.evidence_count && item.evidence_count >= 3)) {
    return 'silver';
  }

  // Bronze: Moderate AI confidence (0.55-0.70) OR some evidence (1-2 pieces)
  if ((item.ai_confidence && item.ai_confidence >= 0.55) ||
      (item.evidence_count && item.evidence_count > 0) ||
      item.ai_inferred) {
    return 'bronze';
  }

  // Assumed: Low confidence, no verification, no evidence
  return 'assumed';
};

/**
 * Calculate freshness score (0-100) based on how recent the item is
 */
export const calculateFreshnessScore = (item: any): number => {
  const now = new Date();
  const lastUpdated = item.last_updated_at || item.updated_at || item.created_at;

  if (!lastUpdated) return 50; // Default if no date

  const updatedDate = new Date(lastUpdated);
  const daysSinceUpdate = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

  // Scoring logic:
  // 0-30 days: 100
  // 31-90 days: 90
  // 91-180 days: 80
  // 181-365 days: 70
  // 1-2 years: 60
  // 2-3 years: 50
  // 3+ years: 40

  if (daysSinceUpdate <= 30) return 100;
  if (daysSinceUpdate <= 90) return 90;
  if (daysSinceUpdate <= 180) return 80;
  if (daysSinceUpdate <= 365) return 70;
  if (daysSinceUpdate <= 730) return 60;
  if (daysSinceUpdate <= 1095) return 50;
  return 40;
};

/**
 * Enhance vault matches with quality tier and freshness scores
 */
export const enhanceVaultMatches = (matches: any[]): VaultMatchWithQuality[] => {
  return matches.map(match => {
    const qualityTier = assignQualityTier(match);
    const freshnessScore = calculateFreshnessScore(match);

    return {
      ...match,
      qualityTier,
      freshnessScore,
      verificationDetails: {
        quizVerified: match.quiz_verified || false,
        evidenceCount: match.evidence_count || 0,
        aiInferred: match.ai_inferred || false,
        lastUpdated: match.last_updated_at || match.updated_at || match.created_at
      }
    };
  });
};

/**
 * Sort vault matches by quality and freshness
 */
export const sortVaultMatchesByQuality = (matches: VaultMatchWithQuality[]): VaultMatchWithQuality[] => {
  const tierPriority = { gold: 4, silver: 3, bronze: 2, assumed: 1 };

  return [...matches].sort((a, b) => {
    // First by tier
    const tierDiff = tierPriority[b.qualityTier] - tierPriority[a.qualityTier];
    if (tierDiff !== 0) return tierDiff;

    // Then by freshness
    const freshnessDiff = b.freshnessScore - a.freshnessScore;
    if (freshnessDiff !== 0) return freshnessDiff;

    // Finally by match score
    return b.matchScore - a.matchScore;
  });
};

/**
 * Calculate overall vault strength for analytics
 */
export const calculateVaultStrength = (matches: VaultMatchWithQuality[]): number => {
  if (matches.length === 0) return 0;

  const tierWeights = { gold: 1.0, silver: 0.8, bronze: 0.6, assumed: 0.4 };

  const totalScore = matches.reduce((sum, match) => {
    const tierWeight = tierWeights[match.qualityTier];
    const freshnessMultiplier = match.freshnessScore / 100;
    const matchMultiplier = match.matchScore / 100;

    return sum + (tierWeight * freshnessMultiplier * matchMultiplier);
  }, 0);

  // Normalize to 0-100 scale
  return Math.min(100, Math.round((totalScore / matches.length) * 100));
};

import { useMemo } from 'react';
import { calculateQualityDistribution, type QualityDistribution } from '@/lib/utils/qualityDistribution';
import type { VaultData } from './useVaultData';

export interface StrengthScore {
  total: number;
  powerPhrasesScore: number;
  transferableSkillsScore: number;
  hiddenCompetenciesScore: number;
  intangiblesScore: number;
  quantificationScore: number;
  modernTerminologyScore: number;
  level: 'Developing' | 'Solid' | 'Strong' | 'Elite' | 'Exceptional';
}

export interface VaultStats {
  strengthScore: StrengthScore;
  qualityDistribution: QualityDistribution;
  totalItems: number;
  workPositionsCount: number;
  educationCount: number;
  milestonesCount: number;
  categoryCounts: {
    powerPhrases: number;
    transferableSkills: number;
    hiddenCompetencies: number;
    softSkills: number;
    leadershipPhilosophy: number;
    executivePresence: number;
    personalityTraits: number;
    workStyle: number;
    values: number;
    behavioralIndicators: number;
  };
}

/**
 * Calculate vault statistics from raw data
 * Memoized for performance - only recalculates when data changes
 */
export const useVaultStats = (vaultData: VaultData | undefined): VaultStats | null => {
  return useMemo(() => {
    if (!vaultData) return null;

    const {
      powerPhrases,
      transferableSkills,
      hiddenCompetencies,
      softSkills,
      leadershipPhilosophy,
      executivePresence,
      personalityTraits,
      workStyle,
      values,
      behavioralIndicators,
      workPositions,
      education,
      milestones,
    } = vaultData;

    // Calculate quality distribution
    const qualityDistribution = calculateQualityDistribution(
      powerPhrases,
      transferableSkills,
      hiddenCompetencies,
      softSkills,
      leadershipPhilosophy,
      executivePresence,
      personalityTraits,
      workStyle,
      values,
      behavioralIndicators
    );

    // Calculate strength score
    const allItems = [
      ...powerPhrases,
      ...transferableSkills,
      ...hiddenCompetencies,
      ...softSkills,
      ...leadershipPhilosophy,
      ...executivePresence,
      ...personalityTraits,
      ...workStyle,
      ...values,
      ...behavioralIndicators,
    ];

    const tierWeights = { gold: 1.0, silver: 0.8, bronze: 0.6, assumed: 0.4 };

    const itemScores = allItems.map((item) => {
      const qualityTier = item.quality_tier || 'assumed';
      const tierWeight = tierWeights[qualityTier as keyof typeof tierWeights];

      // Freshness multiplier
      const lastUpdated = item.last_updated_at || item.updated_at || item.created_at;
      let freshnessMultiplier = 0.7;
      if (lastUpdated) {
        const daysSince = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince <= 30) freshnessMultiplier = 1.0;
        else if (daysSince <= 90) freshnessMultiplier = 0.9;
        else if (daysSince <= 180) freshnessMultiplier = 0.8;
      }

      return tierWeight * freshnessMultiplier;
    });

    const avgScore = itemScores.length > 0 ? itemScores.reduce((sum, score) => sum + score, 0) / itemScores.length : 0;
    const total = Math.round(avgScore * 100);

    // Category scores
    const powerPhrasesScore = Math.min((powerPhrases.length / 20) * 10, 10);
    const transferableSkillsScore = Math.min((transferableSkills.length / 15) * 10, 10);
    const hiddenCompetenciesScore = Math.min((hiddenCompetencies.length / 10) * 10, 10);
    const intangiblesScore = Math.min(
      (softSkills.length +
        leadershipPhilosophy.length +
        executivePresence.length +
        personalityTraits.length +
        workStyle.length +
        values.length +
        behavioralIndicators.length) /
        30 *
        40,
      40
    );

    // Quality metrics
    const phrasesWithMetrics = powerPhrases.filter((p: any) => p.impact_metrics && Object.keys(p.impact_metrics).length > 0).length;
    const quantificationScore = powerPhrases.length > 0 ? (phrasesWithMetrics / powerPhrases.length) * 15 : 0;

    const modernKeywords = ['AI', 'ML', 'cloud', 'digital transformation', 'automation', 'data science', 'agile', 'DevOps', 'analytics', 'optimization'];
    const modernPhrases = powerPhrases.filter((p: any) => (p.keywords ?? []).some((k: string) => modernKeywords.some((mk) => k.toLowerCase().includes(mk.toLowerCase())))).length;
    const modernTerminologyScore = powerPhrases.length > 0 ? (modernPhrases / powerPhrases.length) * 15 : 0;

    let level: StrengthScore['level'] = 'Developing';
    if (total >= 90) level = 'Exceptional';
    else if (total >= 80) level = 'Elite';
    else if (total >= 70) level = 'Strong';
    else if (total >= 60) level = 'Solid';

    const strengthScore: StrengthScore = {
      total,
      powerPhrasesScore: Math.round(powerPhrasesScore),
      transferableSkillsScore: Math.round(transferableSkillsScore),
      hiddenCompetenciesScore: Math.round(hiddenCompetenciesScore),
      intangiblesScore: Math.round(intangiblesScore),
      quantificationScore: Math.round(quantificationScore),
      modernTerminologyScore: Math.round(modernTerminologyScore),
      level,
    };

    return {
      strengthScore,
      qualityDistribution,
      totalItems: allItems.length,
      workPositionsCount: workPositions.length,
      educationCount: education.length,
      milestonesCount: milestones.length,
      categoryCounts: {
        powerPhrases: powerPhrases.length,
        transferableSkills: transferableSkills.length,
        hiddenCompetencies: hiddenCompetencies.length,
        softSkills: softSkills.length,
        leadershipPhilosophy: leadershipPhilosophy.length,
        executivePresence: executivePresence.length,
        personalityTraits: personalityTraits.length,
        workStyle: workStyle.length,
        values: values.length,
        behavioralIndicators: behavioralIndicators.length,
      },
    };
  }, [vaultData]);
};

import { useMemo } from 'react';
import { FitBlueprint, StagedBullet, ConfirmedFacts } from '../types';

interface ScoreCalculatorInput {
  fitBlueprint: FitBlueprint | null;
  stagedBullets: StagedBullet[];
  confirmedFacts: ConfirmedFacts;
}

interface ScoreBreakdown {
  fitScore: number;
  benchmarkScore: number;
  credibilityScore: number;
  atsScore: number;
  overallHireability: number;
  trends: {
    fitTrend: 'up' | 'down' | 'stable';
    benchmarkTrend: 'up' | 'down' | 'stable';
    credibilityTrend: 'up' | 'down' | 'stable';
    atsTrend: 'up' | 'down' | 'stable';
  };
  details: {
    requirementsCovered: number;
    totalRequirements: number;
    gapsAddressed: number;
    totalGaps: number;
    keywordsCovered: number;
    totalKeywords: number;
    factsConfirmed: number;
    factsNeeded: number;
  };
}

const WEIGHTS = {
  fit: 0.35,
  benchmark: 0.25,
  credibility: 0.25,
  ats: 0.15,
};

export function useScoreCalculator({
  fitBlueprint,
  stagedBullets,
  confirmedFacts,
}: ScoreCalculatorInput): ScoreBreakdown {
  return useMemo(() => {
    if (!fitBlueprint) {
      return {
        fitScore: 0,
        benchmarkScore: 0,
        credibilityScore: 0,
        atsScore: 0,
        overallHireability: 0,
        trends: {
          fitTrend: 'stable',
          benchmarkTrend: 'stable',
          credibilityTrend: 'stable',
          atsTrend: 'stable',
        },
        details: {
          requirementsCovered: 0,
          totalRequirements: 0,
          gapsAddressed: 0,
          totalGaps: 0,
          keywordsCovered: 0,
          totalKeywords: 0,
          factsConfirmed: 0,
          factsNeeded: 0,
        },
      };
    }

    // Calculate fit score based on requirements coverage
    const totalRequirements = fitBlueprint.requirements.length;
    const highlyQualified = fitBlueprint.fitMap.filter(
      (f) => f.category === 'HIGHLY QUALIFIED'
    ).length;
    const partiallyQualified = fitBlueprint.fitMap.filter(
      (f) => f.category === 'PARTIALLY QUALIFIED'
    ).length;
    const gaps = fitBlueprint.fitMap.filter(
      (f) => f.category === 'EXPERIENCE GAP'
    );

    // Base fit score from initial analysis
    const baseFitScore = fitBlueprint.overallFitScore || 0;

    // Boost for staged bullets addressing requirements
    const requirementsWithBullets = new Set(
      stagedBullets
        .filter((b) => b.requirementId)
        .map((b) => b.requirementId)
    );
    const bulletBoost = Math.min(
      15,
      (requirementsWithBullets.size / Math.max(1, totalRequirements)) * 20
    );

    const fitScore = Math.min(100, Math.round(baseFitScore + bulletBoost));

    // Calculate benchmark score
    const benchmarkProfile = fitBlueprint.benchmarkCandidateProfile;
    let benchmarkScore = 50; // Default baseline

    if (benchmarkProfile) {
      const competenciesMatched = benchmarkProfile.topCompetencies.filter(
        (comp) => {
          // Check if any staged bullet or evidence supports this competency
          const compKeywords = comp.name.toLowerCase().split(' ');
          return stagedBullets.some((b) =>
            compKeywords.some((kw) => b.text.toLowerCase().includes(kw))
          );
        }
      ).length;

      const competencyScore =
        (competenciesMatched / Math.max(1, benchmarkProfile.topCompetencies.length)) * 40;

      // Proof points coverage - use fitMap refined bullets instead of legacy bulletBank
      const proofPointsCovered = benchmarkProfile.expectedProofPoints.filter(
        (pp) => {
          const ppWords = pp.toLowerCase().split(' ').slice(0, 3).join(' ');
          return (
            stagedBullets.some((b) => b.text.toLowerCase().includes(ppWords)) ||
            fitBlueprint.fitMap.some((entry) =>
              entry.resumeLanguage?.toLowerCase().includes(ppWords)
            )
          );
        }
      ).length;

      const proofScore =
        (proofPointsCovered / Math.max(1, benchmarkProfile.expectedProofPoints.length)) * 30;

      benchmarkScore = Math.min(100, Math.round(50 + competencyScore + proofScore));
    }

    // Calculate credibility score based on confirmed facts
    const proofFields = fitBlueprint.proofCollectorFields || [];
    const highPriorityFields = proofFields.filter((f) => f.priority === 'high');
    const confirmedFactKeys = Object.keys(confirmedFacts);

    const factsNeeded = highPriorityFields.length;
    const factsConfirmed = confirmedFactKeys.filter((key) =>
      highPriorityFields.some((f) => f.fieldKey === key)
    ).length;

    // Base credibility from evidence strength
    const strongEvidence = fitBlueprint.evidenceInventory.filter(
      (e) => e.strength === 'strong'
    ).length;
    const totalEvidence = fitBlueprint.evidenceInventory.length;
    const evidenceStrengthScore = (strongEvidence / Math.max(1, totalEvidence)) * 40;

    // Boost for confirmed facts
    const factBoost = (factsConfirmed / Math.max(1, factsNeeded)) * 30;

    // Penalty for inferences without confirmation
    const inferences = fitBlueprint.evidenceInventory.filter(
      (e) => e.strength === 'inference'
    ).length;
    const inferencePenalty = Math.min(20, inferences * 3);

    const credibilityScore = Math.min(
      100,
      Math.round(50 + evidenceStrengthScore + factBoost - inferencePenalty)
    );

    // Calculate ATS score
    const atsData = fitBlueprint.atsAlignment;
    const totalKeywords = atsData.topKeywords.length;
    const coveredKeywords = atsData.covered.length;

    // Check if staged bullets add more keywords
    const additionalKeywords = atsData.missingButAddable.filter((mk) =>
      stagedBullets.some((b) =>
        b.text.toLowerCase().includes(mk.keyword.toLowerCase())
      )
    ).length;

    const keywordsCovered = coveredKeywords + additionalKeywords;
    const atsScore = Math.min(
      100,
      Math.round((keywordsCovered / Math.max(1, totalKeywords)) * 100)
    );

    // Calculate overall hireability
    const overallHireability = Math.round(
      fitScore * WEIGHTS.fit +
        benchmarkScore * WEIGHTS.benchmark +
        credibilityScore * WEIGHTS.credibility +
        atsScore * WEIGHTS.ats
    );

    // Calculate gaps addressed
    const gapsAddressed = gaps.filter((gap) =>
      stagedBullets.some((b) => b.requirementId === gap.requirementId)
    ).length;

    // Determine trends (comparing to baseline)
    const getTrend = (current: number, baseline: number): 'up' | 'down' | 'stable' => {
      const diff = current - baseline;
      if (diff > 5) return 'up';
      if (diff < -5) return 'down';
      return 'stable';
    };

    return {
      fitScore,
      benchmarkScore,
      credibilityScore,
      atsScore,
      overallHireability,
      trends: {
        fitTrend: getTrend(fitScore, baseFitScore),
        benchmarkTrend: stagedBullets.length > 0 ? 'up' : 'stable',
        credibilityTrend: factsConfirmed > 0 ? 'up' : 'stable',
        atsTrend: additionalKeywords > 0 ? 'up' : 'stable',
      },
      details: {
        requirementsCovered: highlyQualified + partiallyQualified + requirementsWithBullets.size,
        totalRequirements,
        gapsAddressed,
        totalGaps: gaps.length,
        keywordsCovered,
        totalKeywords,
        factsConfirmed,
        factsNeeded,
      },
    };
  }, [fitBlueprint, stagedBullets, confirmedFacts]);
}

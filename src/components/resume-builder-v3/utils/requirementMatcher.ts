/**
 * RequirementMatcher - Matches bullets to job requirements and finds relevant gaps
 * Used to show context when editing bullets
 */

import type { FitAnalysisResult, StandardsResult } from "@/types/resume-builder-v3";

export interface RequirementMatch {
  requirement: string;
  type: "strength" | "gap";
  severity?: "critical" | "moderate" | "minor";
  strengthLevel?: "strong" | "moderate";
  suggestion?: string;
  evidence?: string;
  matchScore: number; // 0-100 confidence in match
}

export interface BulletContext {
  matchedRequirement: RequirementMatch | null;
  relevantKeywords: {
    matched: string[];
    missing: string[];
  };
  alignmentScore: number; // 0-100
}

/**
 * Tokenize text for keyword matching
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

/**
 * Calculate word overlap score between two texts
 */
function calculateOverlap(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let matches = 0;
  tokens1.forEach((token) => {
    if (tokens2.has(token)) matches++;
  });

  // Jaccard similarity with emphasis on matching the requirement
  return (matches / Math.max(tokens2.size, 1)) * 100;
}

/**
 * Find the best matching requirement for a given bullet
 */
export function matchBulletToRequirement(
  bulletText: string,
  fitAnalysis: FitAnalysisResult | null
): RequirementMatch | null {
  if (!fitAnalysis) return null;

  let bestMatch: RequirementMatch | null = null;
  let highestScore = 0;

  // Check strengths
  for (const strength of fitAnalysis.strengths) {
    const score = calculateOverlap(bulletText, strength.requirement + " " + strength.evidence);
    if (score > highestScore && score > 15) {
      highestScore = score;
      bestMatch = {
        requirement: strength.requirement,
        type: "strength",
        strengthLevel: strength.strength_level,
        evidence: strength.evidence,
        matchScore: score,
      };
    }
  }

  // Check gaps (these are opportunities to improve the bullet)
  for (const gap of fitAnalysis.gaps) {
    const score = calculateOverlap(bulletText, gap.requirement + " " + (gap.suggestion || ""));
    if (score > highestScore && score > 15) {
      highestScore = score;
      bestMatch = {
        requirement: gap.requirement,
        type: "gap",
        severity: gap.severity,
        suggestion: gap.suggestion,
        matchScore: score,
      };
    }
  }

  return bestMatch;
}

/**
 * Find keywords relevant to a specific bullet
 */
export function findRelevantKeywords(
  bulletText: string,
  fitAnalysis: FitAnalysisResult | null
): { matched: string[]; missing: string[] } {
  if (!fitAnalysis) return { matched: [], missing: [] };

  const bulletLower = bulletText.toLowerCase();
  
  const matched = (fitAnalysis.keywords_found || []).filter(
    (kw) => bulletLower.includes(kw.toLowerCase())
  );

  // Find missing keywords that COULD be relevant to this bullet's topic
  const bulletTokens = new Set(tokenize(bulletText));
  const missing = (fitAnalysis.keywords_missing || []).filter((kw) => {
    const kwTokens = tokenize(kw);
    // If ANY token from the keyword appears in the bullet context, it might be relevant
    return kwTokens.some((t) => bulletTokens.has(t)) || kwTokens.length === 0;
  });

  return {
    matched: matched.slice(0, 5),
    missing: missing.slice(0, 5),
  };
}

/**
 * Get full context for a bullet including matched requirement and keywords
 */
export function getBulletContext(
  bulletText: string,
  fitAnalysis: FitAnalysisResult | null
): BulletContext {
  const matchedRequirement = matchBulletToRequirement(bulletText, fitAnalysis);
  const relevantKeywords = findRelevantKeywords(bulletText, fitAnalysis);

  // Calculate alignment score based on:
  // - Having a matching strength (good) vs gap (opportunity)
  // - Number of matched keywords
  // - Number of missing keywords that could be added
  let alignmentScore = 50; // Base neutral score

  if (matchedRequirement) {
    if (matchedRequirement.type === "strength") {
      alignmentScore += 30;
      if (matchedRequirement.strengthLevel === "strong") alignmentScore += 10;
    } else if (matchedRequirement.type === "gap") {
      alignmentScore -= 10;
      if (matchedRequirement.severity === "critical") alignmentScore -= 15;
    }
  }

  // Adjust based on keywords
  alignmentScore += relevantKeywords.matched.length * 5;
  alignmentScore -= relevantKeywords.missing.length * 3;

  // Clamp to 0-100
  alignmentScore = Math.max(0, Math.min(100, alignmentScore));

  return {
    matchedRequirement,
    relevantKeywords,
    alignmentScore,
  };
}

/**
 * Get the top gaps that haven't been addressed yet
 */
export function getUnaddressedGaps(
  experienceBullets: string[][],
  fitAnalysis: FitAnalysisResult | null
): Array<{ requirement: string; severity: "critical" | "moderate" | "minor"; suggestion: string }> {
  if (!fitAnalysis) return [];

  const allBullets = experienceBullets.flat().join(" ").toLowerCase();

  return fitAnalysis.gaps
    .filter((gap) => {
      // Check if this gap is addressed in any bullet
      const gapTokens = tokenize(gap.requirement);
      const matchedTokens = gapTokens.filter((t) => allBullets.includes(t));
      // If less than 40% of tokens match, the gap is likely unaddressed
      return matchedTokens.length / gapTokens.length < 0.4;
    })
    .map((gap) => ({
      requirement: gap.requirement,
      severity: gap.severity,
      suggestion: gap.suggestion,
    }));
}

/**
 * Get section-level recommendations based on standards
 */
export function getSectionRecommendations(
  section: "summary" | "experience" | "skills",
  standards: StandardsResult | null
): string[] {
  if (!standards) return [];

  const recommendations: string[] = [];

  // Add relevant power phrases for the section
  if (section === "summary" || section === "experience") {
    const relevantPhrases = (standards.power_phrases || []).slice(0, 3);
    if (relevantPhrases.length > 0) {
      recommendations.push(`Consider using: ${relevantPhrases.join(", ")}`);
    }
  }

  // Add metrics suggestions for experience
  if (section === "experience" && standards.metrics_suggestions?.length) {
    recommendations.push(
      `Add metrics like: ${standards.metrics_suggestions.slice(0, 2).join(", ")}`
    );
  }

  // Add industry keywords for skills
  if (section === "skills" && standards.industry_keywords?.length) {
    const missing = standards.industry_keywords.slice(0, 5);
    if (missing.length > 0) {
      recommendations.push(`Industry keywords to consider: ${missing.join(", ")}`);
    }
  }

  return recommendations;
}

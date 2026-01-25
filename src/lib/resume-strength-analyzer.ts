/**
 * Resume Strength Analyzer
 * 
 * Analyzes the completeness and achievement density of a Master Resume
 * to warn users when their base data may be insufficient for world-class output.
 */

import type { RBEvidence } from "@/types/resume-builder";

export interface ResumeStrengthResult {
  overallScore: number; // 0-100
  isStrongEnough: boolean; // true if score >= threshold (65%)
  
  // Breakdown by category
  breakdown: {
    achievementDensity: number; // % of evidence with metrics
    categoryDiversity: number; // How many categories are covered
    confidenceQuality: number; // % of high-confidence claims
    evidenceDepth: number; // Average evidence per category
  };
  
  // Specific gaps
  gaps: Array<{
    category: string;
    issue: string;
    suggestion: string;
  }>;
  
  // Recommendations
  recommendations: string[];
}

export interface ResumeStrengthConfig {
  minimumScore: number; // Default: 65
  minimumClaims: number; // Default: 10
  minimumCategories: number; // Default: 3
}

const DEFAULT_CONFIG: ResumeStrengthConfig = {
  minimumScore: 65,
  minimumClaims: 10,
  minimumCategories: 3,
};

// Category weights for future scoring enhancements
// const CATEGORY_WEIGHTS = {
//   metric: 1.5, // Metrics are most valuable
//   leadership: 1.3,
//   responsibility: 1.2,
//   skill: 1.0,
//   tool: 1.0,
//   domain: 0.8,
// };

/**
 * Analyze resume evidence strength for personalization quality
 */
export function analyzeResumeStrength(
  evidence: RBEvidence[],
  config: Partial<ResumeStrengthConfig> = {}
): ResumeStrengthResult {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!evidence || evidence.length === 0) {
    return {
      overallScore: 0,
      isStrongEnough: false,
      breakdown: {
        achievementDensity: 0,
        categoryDiversity: 0,
        confidenceQuality: 0,
        evidenceDepth: 0,
      },
      gaps: [
        {
          category: "all",
          issue: "No evidence extracted",
          suggestion: "Upload your resume or add achievements manually",
        },
      ],
      recommendations: [
        "Upload a comprehensive resume with your work history",
        "Add specific achievements with metrics",
      ],
    };
  }

  // Count by category
  const categoryCounts: Record<string, number> = {};
  let metricsCount = 0;
  let highConfidenceCount = 0;

  for (const item of evidence) {
    const category = item.category || "other";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;

    // Check for metrics (numbers, percentages, dollar amounts)
    if (hasQuantifiedResult(item.claim_text || item.evidence_quote || "")) {
      metricsCount++;
    }

    if (item.confidence === "high") {
      highConfidenceCount++;
    }
  }

  const uniqueCategories = Object.keys(categoryCounts);
  const totalClaims = evidence.length;

  // Calculate breakdown scores (0-100 each)
  const achievementDensity = Math.min(100, (metricsCount / totalClaims) * 100 * 1.5);
  const categoryDiversity = Math.min(100, (uniqueCategories.length / 6) * 100);
  const confidenceQuality = (highConfidenceCount / totalClaims) * 100;
  const evidenceDepth = Math.min(100, (totalClaims / mergedConfig.minimumClaims) * 100);

  // Calculate weighted overall score
  const overallScore = Math.round(
    achievementDensity * 0.35 +
    categoryDiversity * 0.20 +
    confidenceQuality * 0.25 +
    evidenceDepth * 0.20
  );

  // Identify gaps
  const gaps: ResumeStrengthResult["gaps"] = [];
  const recommendations: string[] = [];

  // Check for missing critical categories
  const criticalCategories = ["metric", "skill", "responsibility"];
  for (const cat of criticalCategories) {
    if (!categoryCounts[cat] || categoryCounts[cat] < 2) {
      gaps.push({
        category: cat,
        issue: `Few or no ${cat} claims found`,
        suggestion: getCategorySuggestion(cat),
      });
    }
  }

  // Check for low metrics
  if (achievementDensity < 30) {
    recommendations.push(
      "Add more quantified achievements (numbers, percentages, dollar amounts)"
    );
  }

  // Check for low confidence
  if (confidenceQuality < 50) {
    recommendations.push(
      "Review and verify your claims - many have low confidence scores"
    );
  }

  // Check for low diversity
  if (uniqueCategories.length < mergedConfig.minimumCategories) {
    recommendations.push(
      "Add evidence across more categories (skills, tools, leadership, metrics)"
    );
  }

  // Check for low volume
  if (totalClaims < mergedConfig.minimumClaims) {
    recommendations.push(
      `Add more achievements - you have ${totalClaims}, aim for at least ${mergedConfig.minimumClaims}`
    );
  }

  return {
    overallScore,
    isStrongEnough: overallScore >= mergedConfig.minimumScore,
    breakdown: {
      achievementDensity: Math.round(achievementDensity),
      categoryDiversity: Math.round(categoryDiversity),
      confidenceQuality: Math.round(confidenceQuality),
      evidenceDepth: Math.round(evidenceDepth),
    },
    gaps,
    recommendations,
  };
}

/**
 * Check if text contains quantified results
 */
function hasQuantifiedResult(text: string): boolean {
  // Match various metric patterns
  const patterns = [
    /\d+%/, // Percentages
    /\$[\d,]+[KMB]?/, // Dollar amounts
    /[\d,]+\s*(users|customers|clients|employees|team members)/i, // People counts
    /\d+x/, // Multipliers
    /\d+\s*(million|billion|thousand|hundred)/i, // Written numbers
    /\d+\s*(projects?|initiatives?|campaigns?)/i, // Project counts
    /\d+\s*(years?|months?)/i, // Duration
    /increased|decreased|improved|reduced|grew|saved/i, // Action verbs suggesting metrics
  ];

  return patterns.some((pattern) => pattern.test(text));
}

/**
 * Get category-specific suggestion
 */
function getCategorySuggestion(category: string): string {
  const suggestions: Record<string, string> = {
    metric: "Add achievements with specific numbers, percentages, or dollar amounts",
    skill: "List your technical and professional skills with concrete examples",
    responsibility: "Describe key responsibilities you've held with scope and impact",
    leadership: "Add examples of leading teams, projects, or initiatives",
    tool: "Include specific tools, technologies, and platforms you've used",
    domain: "Describe your industry expertise and domain knowledge",
  };

  return suggestions[category] || "Add more evidence for this category";
}

/**
 * Get strength label for display
 */
export function getStrengthLabel(score: number): {
  label: string;
  variant: "destructive" | "warning" | "default" | "secondary";
} {
  if (score < 40) {
    return { label: "Needs Work", variant: "destructive" };
  }
  if (score < 65) {
    return { label: "Fair", variant: "warning" };
  }
  if (score < 85) {
    return { label: "Good", variant: "default" };
  }
  return { label: "Excellent", variant: "secondary" };
}

/**
 * Format score as percentage string
 */
export function formatStrengthScore(score: number): string {
  return `${Math.round(score)}%`;
}

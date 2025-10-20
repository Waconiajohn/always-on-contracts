/**
 * Section Quality Scorer
 * Calculates comprehensive quality scores for resume sections
 */

interface QualityScoreResult {
  overallScore: number; // 0-100
  atsMatchPercentage: number; // 0-100
  requirementsCoverage: number; // 0-100
  competitiveStrength: number; // 1-5 stars
  strengths: string[];
  weaknesses: string[];
  keywords: {
    matched: string[];
    missing: string[];
  };
}

interface ScoringInput {
  content: string;
  jobAnalysis: any;
  vaultMatches?: any[];
  atsKeywords?: {
    critical: string[];
    important: string[];
    nice_to_have: string[];
  };
  requirements?: string[];
}

/**
 * Calculate comprehensive quality score for a resume section
 */
export function calculateSectionQuality(input: ScoringInput): QualityScoreResult {
  const {
    content,
    atsKeywords = { critical: [], important: [], nice_to_have: [] },
    requirements = []
  } = input;

  const contentLower = content.toLowerCase();
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  // 1. ATS Keyword Matching (40% of overall score)
  const criticalMatched = atsKeywords.critical.filter(kw =>
    contentLower.includes(kw.toLowerCase())
  );
  const importantMatched = atsKeywords.important.filter(kw =>
    contentLower.includes(kw.toLowerCase())
  );
  const niceToHaveMatched = atsKeywords.nice_to_have.filter(kw =>
    contentLower.includes(kw.toLowerCase())
  );

  const criticalScore = atsKeywords.critical.length > 0
    ? (criticalMatched.length / atsKeywords.critical.length) * 100
    : 100;
  const importantScore = atsKeywords.important.length > 0
    ? (importantMatched.length / atsKeywords.important.length) * 100
    : 100;
  const niceToHaveScore = atsKeywords.nice_to_have.length > 0
    ? (niceToHaveMatched.length / atsKeywords.nice_to_have.length) * 100
    : 100;

  // Weighted ATS score: critical (50%), important (35%), nice-to-have (15%)
  const atsMatchPercentage = Math.round(
    criticalScore * 0.5 + importantScore * 0.35 + niceToHaveScore * 0.15
  );

  // ATS insights
  if (criticalMatched.length === atsKeywords.critical.length) {
    strengths.push(`All critical keywords included (${criticalMatched.length}/${atsKeywords.critical.length})`);
  } else if (criticalMatched.length < atsKeywords.critical.length) {
    weaknesses.push(`Missing ${atsKeywords.critical.length - criticalMatched.length} critical keywords`);
  }

  // 2. Requirements Coverage (30% of overall score)
  const requirementsCovered = requirements.filter(req =>
    contentLower.includes(req.toLowerCase()) ||
    req.toLowerCase().split(' ').some(word => word.length > 3 && contentLower.includes(word))
  );

  const requirementsCoverage = requirements.length > 0
    ? Math.round((requirementsCovered.length / requirements.length) * 100)
    : 100;

  if (requirementsCoverage >= 80) {
    strengths.push(`Strong requirement coverage (${requirementsCovered.length}/${requirements.length})`);
  } else if (requirementsCoverage < 50) {
    weaknesses.push(`Low requirement coverage (${requirementsCovered.length}/${requirements.length})`);
  }

  // 3. Competitive Strength (30% of overall score)
  let competitiveScore = 50; // Base score

  // Check for quantified achievements
  const hasNumbers = /\d+[%$KkMmBb+]/.test(content);
  if (hasNumbers) {
    competitiveScore += 20;
    strengths.push('Contains quantified achievements');
  } else {
    weaknesses.push('No quantified metrics found');
  }

  // Check for action verbs
  const actionVerbs = [
    'led', 'managed', 'developed', 'implemented', 'achieved', 'increased', 'decreased',
    'created', 'delivered', 'designed', 'established', 'improved', 'optimized', 'built',
    'launched', 'scaled', 'transformed', 'drove', 'spearheaded', 'orchestrated'
  ];
  const hasActionVerbs = actionVerbs.some(verb => contentLower.includes(verb));
  if (hasActionVerbs) {
    competitiveScore += 15;
    strengths.push('Uses strong action verbs');
  } else {
    weaknesses.push('Limited use of action verbs');
  }

  // Check for impact language
  const impactWords = ['impact', 'result', 'outcome', 'success', 'growth', 'improvement', 'efficiency'];
  const hasImpact = impactWords.some(word => contentLower.includes(word));
  if (hasImpact) {
    competitiveScore += 15;
    strengths.push('Demonstrates impact and results');
  }

  // Convert competitive score to 1-5 star rating
  const competitiveStrength = Math.min(5, Math.max(1, Math.round(competitiveScore / 20)));

  // 4. Overall Score Calculation
  const overallScore = Math.round(
    atsMatchPercentage * 0.4 +
    requirementsCoverage * 0.3 +
    competitiveScore * 0.3
  );

  // Identify missing keywords
  const allKeywords = [
    ...atsKeywords.critical,
    ...atsKeywords.important,
    ...atsKeywords.nice_to_have
  ];
  const matchedKeywords = [
    ...criticalMatched,
    ...importantMatched,
    ...niceToHaveMatched
  ];
  const missingKeywords = allKeywords.filter(kw =>
    !matchedKeywords.some(mk => mk.toLowerCase() === kw.toLowerCase())
  );

  return {
    overallScore,
    atsMatchPercentage,
    requirementsCoverage,
    competitiveStrength,
    strengths,
    weaknesses,
    keywords: {
      matched: matchedKeywords,
      missing: missingKeywords.slice(0, 10) // Top 10 missing
    }
  };
}

/**
 * Compare two versions and return recommendation
 */
export function compareVersions(
  idealScore: QualityScoreResult,
  personalizedScore: QualityScoreResult,
  vaultStrength: number
): {
  recommendation: 'ideal' | 'personalized' | 'blend';
  reason: string;
  scoreDifference: number;
} {
  const scoreDiff = personalizedScore.overallScore - idealScore.overallScore;

  // If vault is too weak, recommend ideal
  if (vaultStrength < 40) {
    return {
      recommendation: 'ideal',
      reason: 'Career Vault needs more data for strong personalization',
      scoreDifference: scoreDiff
    };
  }

  // If personalized is significantly better (>10 points)
  if (scoreDiff > 10) {
    return {
      recommendation: 'personalized',
      reason: 'Your vault data creates a stronger, more competitive section',
      scoreDifference: scoreDiff
    };
  }

  // If ideal is significantly better (>10 points)
  if (scoreDiff < -10) {
    return {
      recommendation: 'ideal',
      reason: 'Industry standard version has better ATS optimization',
      scoreDifference: scoreDiff
    };
  }

  // If they're close, recommend blending
  return {
    recommendation: 'blend',
    reason: 'Both versions have strengths - consider combining the best elements',
    scoreDifference: scoreDiff
  };
}

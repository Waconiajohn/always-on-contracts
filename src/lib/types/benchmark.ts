/**
 * Benchmark Candidate Types
 *
 * These types define what a "strong candidate" looks like for a given role.
 * Used to compare user resumes against realistic industry benchmarks,
 * not just the job description (which may be poorly written).
 */

export type CandidateLevel = 'entry' | 'mid' | 'senior' | 'staff' | 'principal' | 'executive';

export type SkillCriticality = 'must-have' | 'nice-to-have' | 'bonus';

export type AccomplishmentType =
  | 'shipped_product'
  | 'led_team'
  | 'mentorship'
  | 'optimization'
  | 'technical_innovation'
  | 'scale'
  | 'cost_reduction'
  | 'revenue_growth'
  | 'process_improvement'
  | 'cross_functional';

export interface BenchmarkSkill {
  skill: string;
  criticality: SkillCriticality;
  whyMatters: string;
  evidenceOfMastery: string; // How it should show up in resume
}

export interface BenchmarkAccomplishment {
  type: AccomplishmentType;
  description: string;
  exampleBullet: string;
  metricsToInclude: string[]; // What to quantify
}

export interface BenchmarkExperience {
  min: number;
  max: number;
  median: number;
  reasoning: string;
}

export interface BenchmarkScoreWeights {
  hasRequiredSkills: number;      // e.g., 0.35
  hasDemonstrationOfImpact: number; // e.g., 0.30
  experienceLevelMatch: number;   // e.g., 0.20
  culturalFitSignals: number;     // e.g., 0.15
}

export interface BenchmarkCandidate {
  roleTitle: string;
  level: CandidateLevel;
  industry: string;
  synthesisReasoning: string; // Brief explanation of how benchmark was derived

  yearsOfExperience: BenchmarkExperience;

  coreSkills: BenchmarkSkill[];

  expectedAccomplishments: BenchmarkAccomplishment[];

  typicalMetrics: string[]; // e.g., "Users/revenue impacted: 100K+", "Performance improvements: 30%+"

  redFlags: string[]; // Signs of underperformance or poor culture fit for this role

  scoreWeights: BenchmarkScoreWeights;
}

/**
 * Response from the analyze-benchmark edge function
 */
export interface AnalyzeBenchmarkResponse {
  success: boolean;
  benchmark: BenchmarkCandidate | null;
  error?: string;
  metrics?: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    executionTimeMs: number;
  };
}

/**
 * Request payload for the analyze-benchmark edge function
 */
export interface AnalyzeBenchmarkRequest {
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  industry?: string;
  benchmarkType?: 'realistic' | 'aspirational'; // Default: realistic
}

/**
 * Gap between user's resume and benchmark candidate
 */
export interface BenchmarkGap {
  category: 'skill' | 'experience' | 'accomplishment' | 'metric';
  benchmarkExpectation: string;
  userStatus: 'missing' | 'partial' | 'met' | 'exceeds';
  priority: 'critical' | 'high' | 'medium' | 'low';
  actionableAdvice: string;
}

/**
 * Result of comparing a resume to a benchmark (legacy)
 */
export interface BenchmarkComparison {
  overallScore: number; // 0-100
  scoreBreakdown: {
    skillsScore: number;
    impactScore: number;
    experienceScore: number;
    culturalFitScore: number;
  };
  gaps: BenchmarkGap[];
  strengths: string[];
  recommendations: string[];
}

// ============================================================================
// MATCH SCORE BREAKDOWN (v2) - Detailed scoring against benchmark
// ============================================================================

export type ExperienceLevelMatch = 'below' | 'aligned' | 'above';

export interface KeywordMatchCategory {
  score: number;
  matched: string[];
  missing: string[];
  missingByPriority: {
    keyword: string;
    criticality: SkillCriticality;
  }[];
  summary: string;
}

export interface ExperienceMatchCategory {
  score: number;
  userYearsOfExperience: number;
  benchmarkYearsOfExperience: BenchmarkExperience;
  levelMatch: ExperienceLevelMatch;
  gaps: string[];
  summary: string;
}

export interface AccomplishmentMatchCategory {
  score: number;
  userHasMetrics: boolean;
  userMetrics: string[];
  benchmarkMetrics: string[];
  missingMetrics: string[];
  accomplishmentTypes: {
    type: string;
    found: boolean;
    evidence?: string;
  }[];
  summary: string;
}

export interface ATSComplianceCategory {
  score: number;
  issues: string[];
  warnings: string[];
  sectionsFound: string[];
  sectionsMissing: string[];
  summary: string;
}

export interface MatchScoreCategories {
  keywords: KeywordMatchCategory;
  experience: ExperienceMatchCategory;
  accomplishments: AccomplishmentMatchCategory;
  atsCompliance: ATSComplianceCategory;
}

/**
 * Detailed breakdown of how a resume scores against a benchmark candidate.
 * This is the primary output of the score-vs-benchmark function.
 */
export interface MatchScoreBreakdown {
  overallScore: number; // 0-100 weighted score
  scoreExplanation: string; // Human-readable explanation of the score

  categories: MatchScoreCategories;

  strengths: string[]; // What the resume does well
  gaps: string[]; // Priority areas for improvement

  // Weights used in calculation (for transparency)
  weights: {
    keywords: number;
    experience: number;
    accomplishments: number;
    atsCompliance: number;
  };
}

/**
 * Request payload for score-vs-benchmark edge function
 */
export interface ScoreVsBenchmarkRequest {
  resumeText: string;
  benchmark: BenchmarkCandidate;
  jobDescription?: string; // Optional, for additional context
}

/**
 * Response from score-vs-benchmark edge function
 */
export interface ScoreVsBenchmarkResponse {
  success: boolean;
  score: MatchScoreBreakdown | null;
  error?: string;
  metrics?: {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    executionTimeMs: number;
  };
}

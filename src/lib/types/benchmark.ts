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
 * Result of comparing a resume to a benchmark
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

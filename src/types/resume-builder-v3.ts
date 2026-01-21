// =====================================================
// RESUME BUILDER V3 - SHARED TYPES (Single Source of Truth)
// =====================================================
// Import these types in both frontend store and reference in edge function
// =====================================================

/**
 * Fit Analysis Result - Step 1
 */
export interface FitAnalysisResult {
  fit_score: number;
  executive_summary: string;
  strengths: Array<{
    requirement: string;
    evidence: string;
    strength_level: "strong" | "moderate";
  }>;
  gaps: Array<{
    requirement: string;
    severity: "critical" | "moderate" | "minor";
    suggestion: string;
  }>;
  keywords_found: string[];
  keywords_missing: string[];
}

/**
 * Standards Comparison Result - Step 2
 */
export interface StandardsResult {
  industry: string;
  profession: string;
  seniority_level: "entry" | "mid" | "senior" | "lead" | "executive";
  benchmarks: Array<{
    benchmark: string;
    candidate_status: "exceeds" | "meets" | "below";
    evidence: string;
    recommendation?: string;
  }>;
  industry_keywords: string[];
  power_phrases: string[];
  metrics_suggestions: string[];
}

/**
 * Interview Question - Step 3
 */
export interface InterviewQuestion {
  id: string;
  question: string;
  purpose: string;
  gap_addressed: string;
  example_answer?: string;
  priority: "high" | "medium" | "low";
  source?: "job_match" | "industry_standard";
}

/**
 * Questions Result - Step 3
 */
export interface QuestionsResult {
  questions: InterviewQuestion[];
  total_questions: number;
}

/**
 * Optimized Resume - Step 4 (Final Output)
 */
export interface OptimizedResume {
  header: {
    name: string;
    title: string;
    contact?: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }>;
  skills: string[];
  education?: Array<{
    institution: string;
    degree: string;
    year?: string;
  }>;
  certifications?: string[];
  ats_score: number;
  improvements_made: string[];
}

/**
 * Resume Version for history tracking
 */
export interface ResumeVersion {
  id: string;
  resume: OptimizedResume;
  createdAt: Date;
  label: string;
}

/**
 * Step type
 */
export type Step = 1 | 2 | 3 | 4;

/**
 * Full session state
 */
export interface ResumeV3Session {
  step: Step;
  resumeText: string;
  jobDescription: string;
  fitAnalysis?: FitAnalysisResult;
  standards?: StandardsResult;
  questions?: QuestionsResult;
  interviewAnswers?: Record<string, string>;
  finalResume?: OptimizedResume;
}

/**
 * Bullet edit action types
 */
export type BulletEditActionType = "strengthen" | "add_metrics" | "regenerate";

/**
 * Bullet edit result from AI
 */
export interface BulletEditResult {
  improvedBullet: string;
  changes: string;
}

// =====================================================
// EXECUTIVE STRATEGY DASHBOARD TYPES
// =====================================================

/**
 * Level of Acceptance - represents hiring funnel stages
 */
export type AcceptanceLevel = "ats" | "recruiter" | "hiring_manager" | "executive";

/**
 * Status for each level
 */
export type LevelStatus = "passing" | "needs_work" | "critical";

/**
 * Individual level score with details
 */
export interface LevelScore {
  level: AcceptanceLevel;
  score: number;
  status: LevelStatus;
  label: string;
  description: string;
  blockers: string[];
  actions: string[];
}

/**
 * Complete level scores for dashboard
 */
export interface LevelScores {
  ats: LevelScore;
  recruiter: LevelScore;
  hiring_manager: LevelScore;
  executive: LevelScore;
  overall: number;
}

// Shared constants for validation
export const RESUME_LIMITS = {
  MAX_RESUME_CHARS: 15000,
  MAX_JOB_CHARS: 10000,
  MIN_RESUME_CHARS: 100,
  MIN_JOB_CHARS: 50,
  // Edge function has slightly higher limits for safety margin
  EDGE_MAX_RESUME_LENGTH: 25000,
  EDGE_MAX_JOB_LENGTH: 20000,
} as const;

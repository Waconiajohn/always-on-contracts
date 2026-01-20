// =====================================================
// API RESPONSE VALIDATORS - V3
// =====================================================

import { z } from "zod";
import type {
  FitAnalysisResult,
  StandardsResult,
  QuestionsResult,
  OptimizedResume,
} from "@/types/resume-builder-v3";
import { logger } from "@/lib/logger";

// Schema definitions for API response validation
const StrengthSchema = z.object({
  requirement: z.string(),
  strength_level: z.enum(["strong", "moderate"]),
  evidence: z.string(),
});

const GapSchema = z.object({
  requirement: z.string(),
  severity: z.enum(["critical", "moderate", "minor"]),
  suggestion: z.string(),
});

const FitAnalysisSchema = z.object({
  fit_score: z.number().min(0).max(100),
  executive_summary: z.string(),
  strengths: z.array(StrengthSchema),
  gaps: z.array(GapSchema),
  keywords_found: z.array(z.string()),
  keywords_missing: z.array(z.string()),
});

const BenchmarkSchema = z.object({
  benchmark: z.string(),
  candidate_status: z.enum(["exceeds", "meets", "below"]),
  evidence: z.string(),
  recommendation: z.string().optional(),
});

const StandardsSchema = z.object({
  industry: z.string(),
  profession: z.string(),
  seniority_level: z.enum(["entry", "mid", "senior", "lead", "executive"]),
  benchmarks: z.array(BenchmarkSchema),
  industry_keywords: z.array(z.string()),
  power_phrases: z.array(z.string()),
  metrics_suggestions: z.array(z.string()),
});

const InterviewQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  purpose: z.string(),
  gap_addressed: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  example_answer: z.string().optional(),
  source: z.enum(["job_match", "industry_standard"]).optional(),
});

const QuestionsSchema = z.object({
  questions: z.array(InterviewQuestionSchema),
  total_questions: z.number(),
});

const ExperienceSchema = z.object({
  title: z.string(),
  company: z.string(),
  dates: z.string(),
  bullets: z.array(z.string()),
});

const EducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string().optional(),
});

const HeaderSchema = z.object({
  name: z.string(),
  title: z.string(),
  contact: z.string().optional(),
});

const OptimizedResumeSchema = z.object({
  header: HeaderSchema,
  summary: z.string(),
  experience: z.array(ExperienceSchema),
  skills: z.array(z.string()),
  education: z.array(EducationSchema).optional(),
  certifications: z.array(z.string()).optional(),
  improvements_made: z.array(z.string()),
  ats_score: z.number().min(0).max(100),
});

// Validation functions with detailed error messages
export function validateFitAnalysis(data: unknown): FitAnalysisResult {
  const result = FitAnalysisSchema.safeParse(data);
  if (!result.success) {
    logger.error("[Validation] FitAnalysis validation failed:", result.error.format());
    throw new Error(`Invalid fit analysis response: ${result.error.issues[0]?.message || "Unknown error"}`);
  }
  return result.data as FitAnalysisResult;
}

export function validateStandards(data: unknown): StandardsResult {
  const result = StandardsSchema.safeParse(data);
  if (!result.success) {
    logger.error("[Validation] Standards validation failed:", result.error.format());
    throw new Error(`Invalid standards response: ${result.error.issues[0]?.message || "Unknown error"}`);
  }
  return result.data as StandardsResult;
}

export function validateQuestions(data: unknown): QuestionsResult {
  const result = QuestionsSchema.safeParse(data);
  if (!result.success) {
    logger.error("[Validation] Questions validation failed:", result.error.format());
    throw new Error(`Invalid questions response: ${result.error.issues[0]?.message || "Unknown error"}`);
  }
  return result.data as QuestionsResult;
}

export function validateOptimizedResume(data: unknown): OptimizedResume {
  const result = OptimizedResumeSchema.safeParse(data);
  if (!result.success) {
    logger.error("[Validation] OptimizedResume validation failed:", result.error.format());
    throw new Error(`Invalid resume response: ${result.error.issues[0]?.message || "Unknown error"}`);
  }
  return result.data as OptimizedResume;
}

// Type-safe validator selector
type Step = "fit_analysis" | "standards" | "questions" | "generate_resume";

const validatorMap: Record<Step, (data: unknown) => unknown> = {
  fit_analysis: validateFitAnalysis,
  standards: validateStandards,
  questions: validateQuestions,
  generate_resume: validateOptimizedResume,
};

export function validateApiResponse<T>(step: Step, data: unknown): T {
  const validator = validatorMap[step];
  if (!validator) {
    logger.warn(`[Validation] No validator for step: ${step}`);
    return data as T;
  }
  return validator(data) as T;
}

/**
 * Zod Schemas for AI Response Validation
 * 
 * Provides type-safe validation for all AI-generated responses
 */

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// LinkedIn Analysis Schema
export const LinkedInAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  authenticity: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string()
  }),
  tone: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string()
  }),
  engagement: z.object({
    score: z.number().min(0).max(100),
    reasoning: z.string()
  }),
  recommendations: z.array(z.string())
});

// Section Quality Schema
export const SectionQualitySchema = z.object({
  overallScore: z.number().min(0).max(100),
  atsMatchPercentage: z.number().min(0).max(100),
  requirementsCoverage: z.number().min(0).max(100).optional(),
  competitiveStrength: z.number().min(1).max(5).optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keywords: z.object({
    matched: z.array(z.string()),
    missing: z.array(z.string())
  })
});

// Boolean Search Schema
export const BooleanSearchSchema = z.object({
  query: z.string(),
  explanation: z.string().optional(),
  alternatives: z.array(z.string()).optional()
});

// Resume Analysis Schema
export const ResumeAnalysisSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  atsScore: z.number().min(0).max(100).optional(),
  keySkills: z.array(z.string()).optional()
});

// Interview Question Schema
export const InterviewQuestionSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    category: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional()
  }))
});

// Job Match Schema
export const JobMatchSchema = z.object({
  matchScore: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()).optional()
});

// Power Phrases Schema
export const PowerPhrasesSchema = z.object({
  phrases: z.array(z.object({
    phrase: z.string(),
    context: z.string().optional(),
    impact: z.string().optional()
  }))
});

// Skills Extraction Schema
export const SkillsExtractionSchema = z.object({
  technical: z.array(z.string()),
  soft: z.array(z.string()),
  leadership: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional()
});

// Generic AI Response Schema
export const GenericAIResponseSchema = z.object({
  content: z.string(),
  metadata: z.record(z.unknown()).optional()
});

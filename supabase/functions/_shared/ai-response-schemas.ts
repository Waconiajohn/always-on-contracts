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

// Salary Report Schema
export const SalaryReportSchema = z.object({
  marketRate: z.object({
    min: z.number(),
    max: z.number(),
    median: z.number(),
    currency: z.string().default('USD')
  }),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.string()
  })),
  recommendations: z.array(z.string()),
  sources: z.array(z.string()).optional()
});

// Gap Analysis Schema
export const GapAnalysisSchema = z.object({
  overallFit: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  gaps: z.array(z.object({
    type: z.enum(['skill', 'experience', 'certification', 'knowledge']),
    description: z.string(),
    severity: z.enum(['critical', 'important', 'minor']),
    recommendation: z.string()
  })),
  developmentPlan: z.array(z.string()).optional()
});

// Hidden Competency Schema
export const HiddenCompetencySchema = z.object({
  competency_area: z.string(),
  inferred_capability: z.string(),
  supporting_evidence: z.array(z.string()),
  confidence_score: z.number().min(0).max(1).optional(),
  quality_tier: z.enum(['gold', 'silver', 'bronze', 'assumed']).optional()
});

// Vault Intelligence Schema
export const VaultIntelligenceSchema = z.object({
  technicalSkills: z.array(z.string()).optional(),
  softSkills: z.array(z.string()).optional(),
  leadershipExamples: z.array(z.string()).optional(),
  businessImpact: z.array(z.string()).optional(),
  powerPhrases: z.array(z.string()).optional(),
  projects: z.array(z.string()).optional(),
  hiddenCompetencies: z.array(z.string()).optional(),
  innovationExamples: z.array(z.string()).optional(),
  problemSolving: z.array(z.string()).optional(),
  stakeholderManagement: z.array(z.string()).optional()
}).passthrough(); // Allow additional categories

// LinkedIn Optimization Schema
export const LinkedInOptimizationSchema = z.object({
  optimizedContent: z.string(),
  improvements: z.array(z.string()),
  keywordsAdded: z.array(z.string()),
  score: z.number().min(0).max(100).optional()
});

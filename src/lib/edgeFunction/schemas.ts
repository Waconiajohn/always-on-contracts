import { z } from 'zod';

/**
 * Validation schemas for edge function inputs
 * Provides type safety and input validation before making function calls
 */

// ============= Resume & Job Matching =============

export const OptimizeResumeSchema = z.object({
  resumeText: z.string()
    .min(100, 'Resume must be at least 100 characters')
    .max(50000, 'Resume must be less than 50,000 characters'),
  jobDescription: z.string()
    .min(50, 'Job description must be at least 50 characters')
    .max(20000, 'Job description must be less than 20,000 characters')
});

export const ScoreResumeMatchSchema = z.object({
  keywords: z.array(z.string().trim().min(1))
    .min(1, 'At least one keyword is required')
    .max(100, 'Maximum 100 keywords allowed'),
  resumeContent: z.object({
    executive_summary: z.string().optional(),
    key_achievements: z.array(z.string()).optional(),
    core_competencies: z.array(z.string()).optional()
  })
});

export const ParseResumeSchema = z.object({
  fileData: z.string().min(1, 'File data is required'),
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name must be less than 255 characters'),
  fileType: z.enum(['txt', 'pdf', 'docx', 'doc'], {
    errorMap: () => ({ message: 'File type must be txt, pdf, docx, or doc' })
  })
});

export const ParseResumeMilestonesSchema = z.object({
  resumeText: z.string()
    .min(100, 'Resume text must be at least 100 characters')
    .max(50000, 'Resume text must be less than 50,000 characters'),
  vaultId: z.string().uuid('Invalid vault ID'),
  targetRoles: z.array(z.string().trim().min(1)).optional(),
  targetIndustries: z.array(z.string().trim().min(1)).optional()
});

export const ParseJobDocumentSchema = z.object({
  url: z.string().url('Invalid URL').optional(),
  text: z.string().min(1).max(50000).optional(),
  fileData: z.string().optional(),
  fileName: z.string().max(255).optional()
}).refine(
  data => data.url || data.text || data.fileData,
  { message: 'At least one of url, text, or fileData is required' }
);

// ============= Career Vault =============

export const ExtractVaultIntangiblesSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  responseText: z.string()
    .min(10, 'Response text must be at least 10 characters')
    .max(10000, 'Response text must be less than 10,000 characters'),
  questionText: z.string()
    .min(5, 'Question text must be at least 5 characters')
    .max(1000, 'Question text must be less than 1,000 characters')
});

export const AutoPopulateVaultSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  resumeText: z.string()
    .min(100, 'Resume text must be at least 100 characters')
    .max(50000, 'Resume text must be less than 50,000 characters')
    .optional(),
  targetRoles: z.array(z.string().trim().min(1)).optional(),
  targetIndustries: z.array(z.string().trim().min(1)).optional()
});

export const DiscoverHiddenCompetenciesSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID')
});

export const ProcessReviewActionsSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  actions: z.array(
    z.object({
      itemId: z.string().uuid('Invalid item ID'),
      itemType: z.string().min(1, 'Item type is required'),
      action: z.enum(['confirm', 'edit', 'reject'], {
        errorMap: () => ({ message: 'Action must be confirm, edit, or reject' })
      }),
      updatedData: z.record(z.any()).optional()
    })
  ).min(1, 'At least one action is required')
});

export const VaultCleanupSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  aggressive: z.boolean().optional()
});

export const DetectRoleAndIndustrySchema = z.object({
  resumeText: z.string().min(100).max(50000).optional(),
  vaultId: z.string().uuid('Invalid vault ID').optional()
}).refine(
  data => data.resumeText || data.vaultId,
  { message: 'Either resumeText or vaultId is required' }
);

export const GenerateCompletionBenchmarkSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  targetRoles: z.array(z.string().trim().min(1))
    .min(1, 'At least one target role is required'),
  targetIndustries: z.array(z.string().trim().min(1))
    .min(1, 'At least one target industry is required'),
  forceRegenerate: z.boolean().optional()
});

// ============= Research & Analysis =============

export const ConductIndustryResearchSchema = z.object({
  targetRole: z.string()
    .trim()
    .min(2, 'Target role must be at least 2 characters')
    .max(200, 'Target role must be less than 200 characters'),
  targetIndustry: z.string()
    .trim()
    .min(2, 'Target industry must be at least 2 characters')
    .max(200, 'Target industry must be less than 200 characters')
});

export const PerplexityResearchSchema = z.object({
  research_type: z.enum([
    'market_intelligence',
    'company_research',
    'skills_demand',
    'career_path',
    'interview_prep',
    'resume_job_analysis'
  ]),
  query_params: z.record(z.any())
});

export const ResearchIndustryStandardsSchema = z.object({
  targetRole: z.string().trim().min(2).max(200),
  targetIndustry: z.string().trim().min(2).max(200),
  vaultId: z.string().uuid('Invalid vault ID'),
  careerDirection: z.string().optional()
});

export const ModernizeLanguageSchema = z.object({
  phrase: z.string()
    .trim()
    .min(10, 'Phrase must be at least 10 characters')
    .max(500, 'Phrase must be less than 500 characters'),
  context: z.string().max(1000, 'Context must be less than 1,000 characters').optional()
});

// ============= Interview & Validation =============

export const ValidateInterviewResponseSchema = z.object({
  question: z.string()
    .trim()
    .min(5, 'Question must be at least 5 characters')
    .max(1000, 'Question must be less than 1,000 characters'),
  response: z.string()
    .trim()
    .min(10, 'Response must be at least 10 characters')
    .max(10000, 'Response must be less than 10,000 characters'),
  context: z.string().max(2000).optional()
});

export const GenerateInterviewQuestionSchema = z.object({
  jobDescription: z.string()
    .min(50, 'Job description must be at least 50 characters')
    .max(20000, 'Job description must be less than 20,000 characters'),
  questionType: z.enum(['behavioral', 'technical', 'situational', 'general']).optional()
});

// ============= LinkedIn & Content =============

export const OptimizeLinkedInProfileSchema = z.object({
  currentProfile: z.object({
    headline: z.string().max(220).optional(),
    about: z.string().max(5000).optional(),
    skills: z.array(z.string().trim().min(1)).max(50).optional()
  }),
  targetRole: z.string().trim().min(2).max(200),
  targetIndustry: z.string().trim().min(2).max(200)
});

// ============= Payment & Subscription =============

export const CreateCheckoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL')
});

export const CustomerPortalSchema = z.object({
  returnUrl: z.string().url('Invalid return URL')
});

export const RedeemRetirementCodeSchema = z.object({
  code: z.string()
    .trim()
    .min(6, 'Code must be at least 6 characters')
    .max(50, 'Code must be less than 50 characters'),
  deviceFingerprint: z.string().min(1, 'Device fingerprint is required')
});

// ============= Helper Functions =============

/**
 * Validates input data against a schema and returns parsed data or throws error
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      throw new Error(`Validation error: ${messages}`);
    }
    throw error;
  }
}

/**
 * Safely validates input and returns validation result
 */
export function safeValidateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => e.message).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}

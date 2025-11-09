import { z } from 'zod';

/**
 * Validation schemas for edge function inputs
 * Provides type safety and input validation before making function calls
 */

// ============= Resume & Job Matching =============

export const ProcessResumeSchema = z.object({
  file: z.any(), // FormData file
  resumeText: z.string().optional()
});

export const AnalyzeResumeInitialSchema = z.object({
  resumeText: z.string().min(100, 'Resume text too short').max(50000, 'Resume text too long'),
  vaultId: z.string().uuid('Invalid vault ID')
});

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
  questionType: z.enum(['behavioral', 'technical', 'situational', 'general']).optional(),
  count: z.number().min(1).max(10).optional(),
  includeSTAR: z.boolean().optional()
});

// Interview Followup & Communication
export const GenerateInterviewFollowupSchema = z.object({
  jobProjectId: z.string().uuid('Invalid job project ID'),
  communicationType: z.enum(['thank_you', 'follow_up', 'check_in']),
  customInstructions: z.string().optional()
});

export const SendCommunicationSchema = z.object({
  communicationId: z.string().uuid(),
  recipientEmail: z.string().email('Invalid email'),
  recipientName: z.string().min(1).optional(),
  subject: z.string().min(1, 'Subject required'),
  body: z.string().min(10, 'Body too short'),
  scheduledFor: z.string().datetime().nullable().optional()
});

// Career Tools
export const GenerateStarStorySchema = z.object({
  rawStory: z.string().min(50, 'Story description too short').max(2000, 'Story description too long'),
  action: z.enum(['generate', 'refine']).optional().default('generate')
});

export const GenerateCompanyResearchSchema = z.object({
  companyName: z.string().min(1, 'Company name required').max(200),
  jobDescription: z.string().optional()
});

export const GenerateElevatorPitchSchema = z.object({
  vaultId: z.string().uuid().optional(),
  targetRole: z.string().min(1, 'Target role required'),
  companyName: z.string().optional(),
  jobDescription: z.string().optional()
});

export const Generate3060Plan = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  vaultId: z.string().uuid().optional()
});

export const Generate321FrameworkSchema = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  vaultId: z.string().uuid().optional()
});

export const GenerateBooleanSearchSchema = z.object({
  jobTitle: z.string().min(1, 'Job title required'),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  experience: z.string().optional()
});

export const GenerateSeriesOutlineSchema = z.object({
  topic: z.string().min(10, 'Topic too short').max(500),
  targetAudience: z.string().optional(),
  postCount: z.number().min(3).max(10).optional().default(5)
});

export const GenerateGapSolutionsSchema = z.object({
  gap: z.string().min(10, 'Gap description too short'),
  jobRequirements: z.string().optional(),
  vaultId: z.string().uuid().optional()
});

export const GenerateRequirementQuestionsSchema = z.object({
  requirement: z.string().min(5, 'Requirement too short'),
  context: z.string().optional()
});

export const GenerateRequirementOptionsSchema = z.object({
  requirement: z.string().min(5, 'Requirement too short'),
  userContext: z.string().optional(),
  vaultId: z.string().uuid().optional()
});

export const GenerateDualResumeSectionSchema = z.object({
  sectionType: z.string().min(1, 'Section type required'),
  vaultId: z.string().uuid('Invalid vault ID'),
  jobDescription: z.string().optional(),
  requirements: z.array(z.any()).optional()
});

export const GenerateInterviewPrepSchema = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  vaultId: z.string().uuid().optional(),
  company: z.string().optional()
});

export const GenerateWhyMeQuestionsSchema = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  vaultId: z.string().uuid().optional()
});

export const SuggestMetricsSchema = z.object({
  phrase: z.string().min(10, 'Phrase too short').max(500, 'Phrase too long'),
  context: z.string().max(1000).optional()
});

export const InferTargetRolesSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  currentRole: z.string().optional(),
  yearsExperience: z.number().min(0).optional()
});

// Job Analysis & Matching
export const AnalyzeJobQualificationsSchema = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  resumeText: z.string().min(100, 'Resume text too short'),
  jobId: z.string().uuid().optional()
});

export const GenerateExecutiveResumeSchema = z.object({
  jobDescription: z.string().min(50, 'Job description too short'),
  vaultId: z.string().uuid('Invalid vault ID'),
  templateId: z.string().optional()
});

// Batch Operations
export const BatchProcessResumesSchema = z.object({
  resumes: z.array(z.object({
    fileData: z.string(),
    fileName: z.string(),
    fileType: z.string()
  })).min(1, 'At least one resume required'),
  vaultId: z.string().uuid().optional()
});

// Coaching & Analysis
export const ExecutiveCoachingSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  context: z.string().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

export const AnalyzeResumeAndResearchSchema = z.object({
  resumeText: z.string().min(100, 'Resume text too short'),
  vaultId: z.string().uuid('Invalid vault ID'),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional()
});

// Vault Operations
export const BulkVaultOperationsSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  operation: z.enum(['delete', 'export', 'quality_upgrade']),
  itemIds: z.array(z.string().uuid()).min(1, 'At least one item required'),
  category: z.string().optional()
});

export const SearchVaultAdvancedSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  query: z.string().min(1, 'Search query required'),
  category: z.string().optional(),
  qualityTier: z.enum(['gold', 'silver', 'bronze', 'assumed']).optional(),
  limit: z.number().min(1).max(100).optional().default(50)
});

export const ExportVaultSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCategories: z.array(z.string()).optional()
});

// Career Focus & Roles
export const SuggestAdjacentRolesSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  currentRole: z.string().optional(),
  targetIndustry: z.string().optional()
});

export const CompetencyQuizSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  skillArea: z.string().min(1, 'Skill area required'),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate')
});

export const GenerateVaultRecommendationsSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  limit: z.number().min(1).max(20).optional().default(5)
});

export const GenerateGapFillingQuestionsSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID').optional(),
  resumeText: z.string().min(100).max(50000),
  vaultData: z.object({
    vault_id: z.string().uuid().optional(),
    powerPhrases: z.array(z.any()).optional(),
    transferableSkills: z.array(z.any()).optional(),
    hiddenCompetencies: z.array(z.any()).optional(),
    softSkills: z.array(z.any()).optional(),
    targetRoles: z.array(z.string()).optional(),
    targetIndustries: z.array(z.string()).optional()
  }),
  targetRoles: z.array(z.string()).optional(),
  industryResearch: z.any().optional()
});

export const ProcessGapFillingResponsesSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  responses: z.array(z.object({
    questionId: z.string(),
    questionText: z.string(),
    questionType: z.string(),
    category: z.string(),
    answer: z.any()
  })).min(1, 'At least one response required'),
  targetRoles: z.array(z.string()).optional(),
  industryResearch: z.any().optional()
});

export const SuggestCareerPathsSchema = z.object({
  resumeAnalysis: z.any(),
  careerDirection: z.enum(['stay', 'pivot', 'explore']),
  currentRole: z.string().optional(),
  currentIndustry: z.string().optional()
});

export const SubmitMicroAnswersSchema = z.object({
  vaultId: z.string().uuid('Invalid vault ID'),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string().min(1, 'Answer cannot be empty')
  })).min(1, 'At least one answer required')
});

// Job Feedback & Market Insights
export const JobFeedbackSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  feedbackType: z.enum(['applied', 'interview', 'offer', 'rejected', 'not_interested']),
  notes: z.string().optional()
});

// Text to Speech
export const TextToSpeechSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(5000, 'Text too long'),
  voiceId: z.string().optional(),
  modelId: z.string().optional()
});

// Validate Interview Response with Audit
export const ValidateInterviewResponseWithAuditSchema = z.object({
  question: z.string().min(10, 'Question too short'),
  answer: z.string().min(20, 'Answer too short'),
  responseId: z.string().uuid().nullable().optional(),
  includeAudit: z.boolean().optional().default(true)
});

// Persona recommendation schemas
export const RecommendPersonaSchema = z.object({
  jobDescription: z.string().min(10, "Job description must be at least 10 characters"),
  agentType: z.enum(['resume', 'interview', 'networking'])
});

// Resume milestones schemas
export const GenerateMilestoneQuestionsSchema = z.object({
  jobDescription: z.string().min(10, "Job description required"),
  requirements: z.array(z.any())
});

export const ProcessMilestoneResponsesSchema = z.object({
  responses: z.array(z.any()).min(1, "At least one response required"),
  jobDescription: z.string().min(10, "Job description required")
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

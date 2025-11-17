import { z } from "zod";

// LinkedIn has strict character limits - enforce in schema
export const LinkedInProfileSection = z.object({
  current: z.string().max(2600).optional(),
  suggested: z.string().max(2600),
  rationale: z.string().max(500).optional(),
  warnings: z.array(z.string()).optional(),
  atsKeywords: z.array(z.string()).optional()
});

export const LinkedInHeadlineSection = LinkedInProfileSection.extend({
  suggested: z.string().min(10).max(220), // LinkedIn headline limit
  current: z.string().max(220).optional()
});

export const LinkedInAboutSection = LinkedInProfileSection.extend({
  suggested: z.string().min(100).max(2600), // LinkedIn about limit
  current: z.string().max(2600).optional()
});

export const LinkedInExperienceEntry = z.object({
  milestoneId: z.string().optional(), // Tie back to vault_resume_milestones
  company: z.string().min(1).max(100),
  title: z.string().min(1).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  descriptionBullets: z.array(z.string().max(500)).max(5), // LinkedIn experience bullet limits
  warnings: z.array(z.string()).optional()
});

export const LinkedInProfileDraftSchema = z.object({
  headline: LinkedInHeadlineSection,
  about: LinkedInAboutSection,
  experience: z.array(LinkedInExperienceEntry).optional(),
  topKeywords: z.array(z.object({
    keyword: z.string(),
    priority: z.enum(['critical', 'important', 'recommended']),
    currentUsage: z.number().min(0)
  })).optional(),
  vaultEmployers: z.array(z.string()).optional(), // Known employers from vault
  vaultRoles: z.array(z.string()).optional() // Known roles from vault
});

export const OptimizeProfileRequestSchema = z.object({
  currentHeadline: z.string().max(220).optional(),
  currentAbout: z.string().max(2600).optional(),
  targetRole: z.string().min(1, "Target role required"),
  industry: z.string().min(1, "Industry required"),
  skills: z.array(z.string()),
  includeATSAnalysis: z.boolean().default(true),
  useExternalResearch: z.boolean().default(false)
});

// Shortened vault summary for LinkedIn content generation
export interface VaultSummaryForLinkedIn {
  currentRole: string;
  yearsExperience: number;
  seniorityLevel: string;
  industry: string;
  topAchievements: string[]; // 3-5 power phrases
  coreCompetencies: string[]; // 5-7 skills
  knownEmployers: string[]; // For fact-checking
  knownRoles: string[]; // For fact-checking
}

// Blog Series Schemas
export const BlogSeriesMetadataSchema = z.object({
  seriesTitle: z.string().min(1),
  audience: z.string(),
  voice: z.enum(['executive', 'practitioner', 'educator']),
  platform: z.enum(['LinkedIn', 'Blog']),
  seriesLength: z.union([z.literal(4), z.literal(8), z.literal(12), z.literal(16)])
});

export const BlogPostSchema = z.object({
  postNumber: z.number(),
  title: z.string(),
  body: z.string().min(100).max(3000),
  hook: z.string(),
  cta: z.string(),
  wordCount: z.number(),
  vaultExamplesUsed: z.array(z.string()).optional()
});

// Networking Message Schemas
export const NetworkingMessageSchema = z.object({
  variant: z.string(),
  channel: z.string(),
  subject: z.string().optional(),
  body: z.string().max(300),
  rationale: z.string().optional(),
  followUpSuggestion: z.string().optional()
});

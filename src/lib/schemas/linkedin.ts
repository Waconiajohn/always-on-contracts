// src/lib/schemas/linkedin.ts
import { z } from "zod";

/**
 * SHARED ENUMS
 */

export const LinkedInVoiceSchema = z.enum([
  "executive",
  "practitioner",
  "educator",
]);

export type LinkedInVoice = z.infer<typeof LinkedInVoiceSchema>;

export const LinkedInPlatformSchema = z.enum(["LinkedIn", "Blog"]);
export type LinkedInPlatform = z.infer<typeof LinkedInPlatformSchema>;

export const NetworkingScenarioSchema = z.enum([
  "cold_connection",
  "warm_intro",
  "recruiter_outreach",
  "hiring_manager",
  "post_application_followup",
  "thank_you",
  "informational_interview",
]);
export type NetworkingScenario = z.infer<typeof NetworkingScenarioSchema>;

/**
 * PROFILE OPTIMIZER
 */

// Section (Headline / About) structure
export const LinkedInProfileSectionSchema = z.object({
  current: z.string().max(2600).optional(),
  suggested: z.string().max(2600),
  rationale: z.string().max(1000).optional(),
  warnings: z.array(z.string()).optional(),
  atsKeywords: z.array(z.string()).optional(),
});

// Full profile draft
export const LinkedInProfileDraftSchema = z.object({
  headline: LinkedInProfileSectionSchema.extend({
    // Headline hard cap 220 chars
    suggested: LinkedInProfileSectionSchema.shape.suggested.max(220),
  }),
  about: LinkedInProfileSectionSchema,
  topKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        priority: z.enum(["critical", "important", "recommended"]),
        currentUsage: z.number(),
      })
    )
    .optional(),
  // metadata is optional and added by backend
  metadata: z
    .object({
      usedResumeSummary: z.boolean().optional(),
      employerCount: z.number().optional(),
      roleCount: z.number().optional(),
    })
    .optional(),
});

export type LinkedInProfileSection = z.infer<
  typeof LinkedInProfileSectionSchema
>;
export type LinkedInProfileDraft = z.infer<typeof LinkedInProfileDraftSchema>;

// Request payload to optimize-linkedin-profile
export const OptimizeLinkedInProfileRequestSchema = z.object({
  currentHeadline: z.string().optional(),
  currentAbout: z.string().optional(),
  targetRole: z.string().min(1, "Target role is required"),
  industry: z.string().min(1, "Industry is required"),
  seedKeywords: z.array(z.string()).optional(),
  researchContext: z.string().optional(),
});

export type OptimizeLinkedInProfileRequest = z.infer<
  typeof OptimizeLinkedInProfileRequestSchema
>;

/**
 * BLOG SERIES / LINKEDIN POSTS
 */

export const SeriesMetadataSchema = z.object({
  seriesTitle: z.string(),
  audience: z.string(),
  voice: LinkedInVoiceSchema,
  platform: LinkedInPlatformSchema,
});

export type SeriesMetadata = z.infer<typeof SeriesMetadataSchema>;

export const OutlineItemSchema = z.object({
  partNumber: z.number(),
  title: z.string(),
  focusStatement: z.string(),
  category: z.string().optional(),
});

export type OutlineItem = z.infer<typeof OutlineItemSchema>;

export const AllowedWordRangeSchema = z.object({
  min: z.number().int().positive(),
  max: z.number().int().positive(),
});

export type AllowedWordRange = z.infer<typeof AllowedWordRangeSchema>;

// Request payload to generate-series-posts
export const GenerateSeriesPostsRequestSchema = z.object({
  seriesMetadata: SeriesMetadataSchema,
  outline: z.array(OutlineItemSchema).min(1).max(16),
  resumeSummaryShort: z.string().optional(),
  allowedWordRange: AllowedWordRangeSchema.optional(),
});

export type GenerateSeriesPostsRequest = z.infer<
  typeof GenerateSeriesPostsRequestSchema
>;

// Single generated post
export const LinkedInSeriesPostSchema = z.object({
  postNumber: z.number(),
  title: z.string(),
  body: z.string().min(50).max(4000),
  hook: z.string().min(5),
  cta: z.string().min(5),
  wordCount: z.number(),
  resumeExamplesUsed: z.array(z.string()).optional(),
});

export type LinkedInSeriesPost = z.infer<typeof LinkedInSeriesPostSchema>;

// Response shape from generate-series-posts
export const GenerateSeriesPostsResponseSchema = z.object({
  success: z.boolean().default(true),
  posts: z.array(LinkedInSeriesPostSchema),
  metadata: z.object({
    seriesTitle: z.string(),
    totalPosts: z.number(),
    voice: LinkedInVoiceSchema,
    audience: z.string(),
  }),
});

export type GenerateSeriesPostsResponse = z.infer<
  typeof GenerateSeriesPostsResponseSchema
>;

/**
 * NETWORKING MESSAGES
 */

export const TargetProfileSchema = z.object({
  name: z.string().optional(),
  title: z.string().optional(),
  company: z.string().min(1),
  sharedContext: z.string().optional(),
  targetJobTitle: z.string().optional(),
  jobRef: z.string().optional(), // requisition ID, URL, etc.
});

export type TargetProfile = z.infer<typeof TargetProfileSchema>;

export const CandidateProfileSchema = z.object({
  headline: z.string().optional(),
  resumeSummary: z.string().optional(),
  relevantAchievements: z.array(z.string()).optional(),
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export const NetworkingConstraintsSchema = z.object({
  maxWords: z.number().int().positive().default(150),
  tone: z.string().default("professional"),
  avoid: z.array(z.string()).optional(),
});

export type NetworkingConstraints = z.infer<
  typeof NetworkingConstraintsSchema
>;

// Networking message variant from backend
export const NetworkingMessageSchema = z.object({
  variant: z.string(), // "direct" | "warm" | "brief"
  channel: z.string(), // "connection_request" | "message" | "inmail"
  subject: z.string().optional(),
  body: z.string().max(1000),
  rationale: z.string().optional(),
  followUpSuggestion: z.string().optional(),
});

export type NetworkingMessage = z.infer<typeof NetworkingMessageSchema>;

// Request payload to linkedin-networking-messages
export const GenerateNetworkingMessagesRequestSchema = z.object({
  scenario: NetworkingScenarioSchema,
  targetProfile: TargetProfileSchema,
  candidateProfile: CandidateProfileSchema,
  constraints: NetworkingConstraintsSchema.optional(),
});

export type GenerateNetworkingMessagesRequest = z.infer<
  typeof GenerateNetworkingMessagesRequestSchema
>;

// Response shape from linkedin-networking-messages
export const GenerateNetworkingMessagesResponseSchema = z.object({
  success: z.boolean().default(true),
  messages: z.array(NetworkingMessageSchema),
  metadata: z.object({
    scenario: NetworkingScenarioSchema,
    tone: z.string(),
    maxWords: z.number(),
    targetCompany: z.string(),
  }),
});

export type GenerateNetworkingMessagesResponse = z.infer<
  typeof GenerateNetworkingMessagesResponseSchema
>;

/**
 * Resume Builder V4 - Shared Zod Schemas
 * Centralized validation for all AI response types
 */

import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================================================
// AI Call #1: JD Classification Response
// ============================================================================
export const JDClassificationSchema = z.object({
  role_title: z.string().describe("Primary normalized role title"),
  role_alternates: z.array(z.string()).default([]).describe("Other valid titles for this role"),
  seniority_level: z.enum([
    "IC",
    "Senior IC", 
    "Manager",
    "Senior Manager",
    "Director",
    "Senior Director",
    "VP",
    "SVP",
    "C-Level"
  ]).describe("Normalized seniority level"),
  industry: z.string().describe("Primary industry"),
  sub_industry: z.string().nullable().default(null).describe("Specific sub-industry"),
  confidence: z.number().min(0).max(1).describe("Classification confidence 0-1"),
  justification: z.object({
    role: z.string().describe("Why this role title"),
    level: z.string().describe("Why this seniority level"),
    industry: z.string().describe("Why this industry"),
  }),
});

export type JDClassification = z.infer<typeof JDClassificationSchema>;

// ============================================================================
// AI Call #2: Requirements Extraction Response
// ============================================================================
export const RequirementItemSchema = z.object({
  text: z.string().describe("The requirement text"),
  weight: z.number().min(1).max(5).describe("Priority: 5=must-have, 3=preferred, 1=implied"),
  exact_phrases: z.array(z.string()).default([]).describe("Exact phrases from JD"),
  synonyms: z.array(z.string()).default([]).describe("Valid synonyms/variations"),
  section_hint: z.enum(["Summary", "Skills", "Experience", "Education"])
    .describe("Best resume section to address this"),
});

export const RequirementsExtractionSchema = z.object({
  hard_skills: z.array(RequirementItemSchema).default([]),
  tools_tech: z.array(RequirementItemSchema).default([]),
  domain_knowledge: z.array(RequirementItemSchema).default([]),
  responsibilities: z.array(RequirementItemSchema).default([]),
  outcomes_metrics: z.array(RequirementItemSchema).default([]),
  education_certs: z.array(RequirementItemSchema).default([]),
  titles_seniority: z.array(RequirementItemSchema).default([]),
  soft_skills: z.array(RequirementItemSchema).default([]),
});

export type RequirementsExtraction = z.infer<typeof RequirementsExtractionSchema>;
export type RequirementItem = z.infer<typeof RequirementItemSchema>;

// ============================================================================
// AI Call #3: Benchmark Generation Response
// ============================================================================
export const BenchmarkItemSchema = z.object({
  category: z.string().describe("Category of benchmark"),
  description: z.string().describe("What is expected at this level"),
  importance: z.enum(["critical", "important", "nice_to_have"]),
  typical_evidence: z.array(z.string()).default([]).describe("Examples of how this appears on resumes"),
});

export const BenchmarkGenerationSchema = z.object({
  role_title: z.string(),
  seniority_level: z.string(),
  industry: z.string(),
  benchmarks: z.array(BenchmarkItemSchema).default([]),
  keywords: z.array(z.string()).default([]).describe("Common keywords for this role"),
  power_phrases: z.array(z.string()).default([]).describe("Impactful phrases for this level"),
});

export type BenchmarkGeneration = z.infer<typeof BenchmarkGenerationSchema>;

// ============================================================================
// AI Call #4: Claims Extraction Response
// ============================================================================
export const ExtractedClaimSchema = z.object({
  claim_text: z.string().describe("Clear statement of what candidate can do/has done"),
  category: z.enum(["skill", "tool", "domain", "responsibility", "metric", "leadership"]),
  evidence_quote: z.string().describe("EXACT text from resume supporting this claim"),
  confidence: z.enum(["high", "medium"]),
  span_location: z.object({
    section: z.enum(["summary", "skills", "experience", "education", "other"]),
    jobIndex: z.number().optional(),
    bulletIndex: z.number().optional(),
  }).optional(),
});

export const ClaimsExtractionSchema = z.object({
  claims: z.array(ExtractedClaimSchema).default([]),
});

export type ClaimsExtraction = z.infer<typeof ClaimsExtractionSchema>;
export type ExtractedClaim = z.infer<typeof ExtractedClaimSchema>;

// ============================================================================
// AI Call #5: Gap Analysis Response
// ============================================================================
export const MetRequirementSchema = z.object({
  requirement_text: z.string(),
  evidence_quote: z.string(),
  weight: z.number().min(1).max(5),
});

export const PartialRequirementSchema = z.object({
  requirement_text: z.string(),
  what_is_missing: z.string(),
  evidence_quote: z.string().nullable(),
  weight: z.number().min(1).max(5),
});

export const UnmetRequirementSchema = z.object({
  requirement_text: z.string(),
  recommended_action: z.enum(["add_keyword", "ask_user", "ignore"]),
  weight: z.number().min(1).max(5),
});

export const GapAnalysisSchema = z.object({
  met: z.array(MetRequirementSchema).default([]),
  partial: z.array(PartialRequirementSchema).default([]),
  unmet: z.array(UnmetRequirementSchema).default([]),
  questions: z.array(z.string()).default([]).describe("Questions to ask candidate for missing info"),
  safe_keyword_insertions: z.array(z.string()).default([]).describe("Keywords safe to add"),
  score_breakdown: z.object({
    met_weight: z.number(),
    partial_weight: z.number(),
    unmet_weight: z.number(),
    total_weight: z.number(),
  }),
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ============================================================================
// AI Call #6: Section Rewrite Response
// ============================================================================
export const SectionRewriteSchema = z.object({
  rewritten_text: z.string().describe("The improved section content"),
  keywords_added: z.array(z.string()).default([]).describe("Keywords incorporated"),
  evidence_used: z.array(z.string()).default([]).describe("Evidence quotes that support changes"),
  questions: z.array(z.string()).default([]).describe("Questions if more info needed"),
});

export type SectionRewrite = z.infer<typeof SectionRewriteSchema>;

// ============================================================================
// AI Call #7: Micro-Edit Response
// ============================================================================
export const MicroEditSchema = z.object({
  original: z.string().describe("The input bullet"),
  edited: z.string().describe("The modified bullet"),
  changes_made: z.array(z.string()).default([]).describe("List of specific changes"),
  evidence_used: z.array(z.string()).default([]).describe("Evidence claims incorporated"),
  confidence: z.number().min(0).max(100).describe("Confidence in the edit 0-100"),
});

export type MicroEdit = z.infer<typeof MicroEditSchema>;

// ============================================================================
// AI Call #8: Hiring Manager Critique Response
// ============================================================================
export const CritiqueIssueSchema = z.object({
  section: z.string().describe("Which section has the issue"),
  issue: z.string().describe("What the issue is"),
  severity: z.enum(["critical", "warning", "suggestion"]),
  recommendation: z.string().describe("How to fix it"),
});

export const HiringManagerCritiqueSchema = z.object({
  overall_score: z.number().min(0).max(100),
  overall_impression: z.string().describe("Brief overall assessment"),
  would_interview: z.boolean(),
  issues: z.array(CritiqueIssueSchema).default([]),
  strengths: z.array(z.string()).default([]).describe("What stands out positively"),
  improvements: z.array(z.string()).default([]).describe("Top improvements to make"),
});

export type HiringManagerCritique = z.infer<typeof HiringManagerCritiqueSchema>;

// ============================================================================
// AI Call #9: Validation Response (Anti-Hallucination)
// ============================================================================
export const ValidationIssueSchema = z.object({
  type: z.enum(["hallucination", "exaggeration", "unsupported_claim", "missing_evidence"]),
  severity: z.enum(["critical", "warning", "info"]),
  description: z.string().describe("What the problem is"),
  original_text: z.string().optional().describe("Text from original if applicable"),
  problematic_text: z.string().describe("The text that has the issue"),
  suggestion: z.string().describe("How to fix it"),
});

export const ValidationSchema = z.object({
  is_valid: z.boolean().describe("Whether content passes validation"),
  confidence_score: z.number().min(0).max(100),
  issues: z.array(ValidationIssueSchema).default([]),
  summary: z.string().describe("Brief validation summary"),
  recommendation: z.enum(["approve", "revise", "reject"]),
});

export type Validation = z.infer<typeof ValidationSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ============================================================================
// AI Call #10: Industry Research Response
// ============================================================================
export const IndustryResearchSchema = z.object({
  role_title: z.string().describe("The normalized role title"),
  seniority_level: z.string().describe("Seniority level for this research"),
  industry: z.string().describe("Industry context"),
  
  keywords: z.array(z.object({
    term: z.string(),
    frequency: z.enum(["very_common", "common", "occasional"]),
    category: z.enum(["hard_skill", "tool", "methodology", "certification", "domain"]),
  })).default([]).describe("Common keywords for this role/level/industry"),
  
  power_phrases: z.array(z.object({
    phrase: z.string(),
    impact_level: z.enum(["high", "medium"]),
    use_case: z.string().describe("When to use this phrase"),
  })).default([]).describe("Impactful phrases for this role"),
  
  typical_qualifications: z.array(z.object({
    qualification: z.string(),
    importance: z.enum(["required", "preferred", "bonus"]),
    category: z.enum(["education", "certification", "experience", "skill"]),
  })).default([]).describe("Expected qualifications at this level"),
  
  competitive_benchmarks: z.array(z.object({
    area: z.string().describe("What's being benchmarked"),
    top_performer: z.string().describe("What top candidates demonstrate"),
    average: z.string().describe("What average candidates show"),
  })).default([]).describe("Competitive differentiation benchmarks"),
  
  summary_template: z.string().describe("Ideal summary structure for this role"),
  experience_focus: z.array(z.string()).default([]).describe("Key areas to emphasize in experience"),
});

export type IndustryResearch = z.infer<typeof IndustryResearchSchema>;

// ============================================================================
// AI Call #11: Ideal Section Generation Response
// ============================================================================
export const IdealSectionSchema = z.object({
  section_type: z.enum(["summary", "skills", "experience_bullets", "education"]),
  ideal_content: z.string().describe("The platinum standard content"),
  structure_notes: z.string().describe("Why this structure works"),
  key_elements: z.array(z.string()).default([]).describe("Must-have elements included"),
  word_count: z.number().describe("Optimal word count"),
  keywords_included: z.array(z.string()).default([]).describe("Industry keywords used"),
});

export type IdealSection = z.infer<typeof IdealSectionSchema>;

// ============================================================================
// AI Call #12: Personalized Section Generation Response
// ============================================================================
export const PersonalizedSectionSchema = z.object({
  section_type: z.enum(["summary", "skills", "experience_bullets", "education"]),
  personalized_content: z.string().describe("User-specific content"),
  ideal_elements_preserved: z.array(z.string()).default([]).describe("Structure elements kept from ideal"),
  evidence_incorporated: z.array(z.object({
    claim_id: z.string().optional(),
    evidence_text: z.string(),
    how_used: z.string(),
  })).default([]).describe("User evidence that was incorporated"),
  gaps_identified: z.array(z.string()).default([]).describe("Areas where user lacks evidence"),
  questions_for_user: z.array(z.string()).default([]).describe("Questions to fill gaps"),
  similarity_to_ideal: z.number().min(0).max(100).describe("How close to ideal structure 0-100"),
  word_count: z.number().optional().describe("Word count of personalized content"),
});

export type PersonalizedSection = z.infer<typeof PersonalizedSectionSchema>;

// ============================================================================
// Helper: Safe Parse with Logging
// ============================================================================
export function safeParseWithLog<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context: string
): z.infer<T> | null {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[${context}] Schema validation failed:`, result.error.issues);
    return null;
  }
  return result.data;
}

// ============================================================================
// Helper: Parse JSON and Validate
// ============================================================================
export function parseAndValidate<T extends z.ZodType>(
  schema: T,
  jsonString: string,
  context: string
): z.infer<T> {
  try {
    const parsed = JSON.parse(jsonString);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.error(`[${context}] Validation errors:`, result.error.issues);
      throw new Error(`Invalid AI response format: ${result.error.message}`);
    }
    return result.data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error(`[${context}] JSON parse error:`, err.message);
      throw new Error(`AI returned invalid JSON: ${err.message}`);
    }
    throw err;
  }
}

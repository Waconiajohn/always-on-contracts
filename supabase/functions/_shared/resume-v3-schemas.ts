// =====================================================
// RESUME BUILDER V3 - STRUCTURED OUTPUT SCHEMAS
// =====================================================
// Strict JSON schemas for guaranteed structured outputs
// Used with AI tool calling for reliable parsing
// NOTE: Type definitions are in src/types/resume-builder-v3.ts (single source of truth)
// =====================================================

/**
 * STEP 1: Fit Analysis Schema
 * Analyzes resume against job description
 * Identifies strengths and gaps
 */
export const FIT_ANALYSIS_SCHEMA = {
  name: "fit_analysis",
  description: "Analyze how well the resume matches the job description, identifying strengths and gaps",
  strict: true,
  schema: {
    type: "object",
    properties: {
      fit_score: { 
        type: "number", 
        description: "Overall match score from 0-100" 
      },
      executive_summary: {
        type: "string",
        description: "2-3 sentence summary of why this candidate is a great fit"
      },
      strengths: {
        type: "array",
        description: "Requirements where the candidate excels",
        items: {
          type: "object",
          properties: {
            requirement: { type: "string", description: "The job requirement" },
            evidence: { type: "string", description: "Specific evidence from resume" },
            strength_level: { type: "string", enum: ["strong", "moderate"] }
          },
          required: ["requirement", "evidence", "strength_level"],
          additionalProperties: false
        }
      },
      gaps: {
        type: "array",
        description: "Requirements where the candidate has gaps",
        items: {
          type: "object",
          properties: {
            requirement: { type: "string", description: "The missing or weak requirement" },
            severity: { type: "string", enum: ["critical", "moderate", "minor"] },
            suggestion: { type: "string", description: "How to potentially address this gap" }
          },
          required: ["requirement", "severity", "suggestion"],
          additionalProperties: false
        }
      },
      keywords_found: {
        type: "array",
        items: { type: "string" },
        description: "ATS keywords from job description found in resume"
      },
      keywords_missing: {
        type: "array",
        items: { type: "string" },
        description: "Important ATS keywords missing from resume"
      }
    },
    required: ["fit_score", "executive_summary", "strengths", "gaps", "keywords_found", "keywords_missing"],
    additionalProperties: false
  }
};

/**
 * STEP 2: Standards Comparison Schema
 * Compares candidate against industry/profession benchmarks
 */
export const STANDARDS_SCHEMA = {
  name: "standards_comparison",
  description: "Compare the candidate against profession and industry standards",
  strict: true,
  schema: {
    type: "object",
    properties: {
      industry: {
        type: "string",
        description: "Identified industry for this role"
      },
      profession: {
        type: "string",
        description: "Identified profession/role type"
      },
      seniority_level: {
        type: "string",
        enum: ["entry", "mid", "senior", "lead", "executive"],
        description: "Detected seniority level"
      },
      benchmarks: {
        type: "array",
        description: "How candidate compares to industry standards",
        items: {
          type: "object",
          properties: {
            benchmark: { type: "string", description: "The industry standard or expectation" },
            candidate_status: { type: "string", enum: ["exceeds", "meets", "below"] },
            evidence: { type: "string", description: "Why this assessment was made" },
            recommendation: { type: "string", description: "Suggestion for improvement if applicable" }
          },
          required: ["benchmark", "candidate_status", "evidence"],
          additionalProperties: false
        }
      },
      industry_keywords: {
        type: "array",
        items: { type: "string" },
        description: "Industry-standard keywords to include"
      },
      power_phrases: {
        type: "array",
        items: { type: "string" },
        description: "High-impact phrases commonly used in this profession"
      },
      metrics_suggestions: {
        type: "array",
        items: { type: "string" },
        description: "Types of metrics/numbers that would strengthen the resume"
      }
    },
    required: ["industry", "profession", "seniority_level", "benchmarks", "industry_keywords", "power_phrases", "metrics_suggestions"],
    additionalProperties: false
  }
};

/**
 * STEP 3: Interview Questions Schema
 * Generates targeted questions to fill gaps
 */
export const QUESTIONS_SCHEMA = {
  name: "interview_questions",
  description: "Generate targeted questions to gather information about gaps and enhancements",
  strict: true,
  schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        description: "Questions to ask the candidate",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique question identifier using format q_[category]_[number]" },
            question: { type: "string", description: "The question to ask" },
            purpose: { type: "string", description: "Why this question helps the resume" },
            gap_addressed: { type: "string", description: "Which gap or enhancement this addresses" },
            example_answer: { type: "string", description: "Example of a good answer to guide the candidate" },
            priority: { type: "string", enum: ["high", "medium", "low"] }
          },
          required: ["id", "question", "purpose", "gap_addressed", "priority"],
          additionalProperties: false
        }
      },
      total_questions: {
        type: "number",
        description: "Total number of questions generated"
      }
    },
    required: ["questions", "total_questions"],
    additionalProperties: false
  }
};

/**
 * STEP 4: Final Resume Schema
 * The optimized resume structure
 */
export const RESUME_SCHEMA = {
  name: "optimized_resume",
  description: "Generate the final optimized resume incorporating all gathered information",
  strict: true,
  schema: {
    type: "object",
    properties: {
      header: {
        type: "object",
        properties: {
          name: { type: "string" },
          title: { type: "string", description: "Professional headline" },
          contact: { type: "string", description: "Contact info line" }
        },
        required: ["name", "title"],
        additionalProperties: false
      },
      summary: {
        type: "string",
        description: "Professional summary paragraph"
      },
      experience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company: { type: "string" },
            title: { type: "string" },
            dates: { type: "string" },
            bullets: {
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["company", "title", "dates", "bullets"],
          additionalProperties: false
        }
      },
      skills: {
        type: "array",
        items: { type: "string" }
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            institution: { type: "string" },
            degree: { type: "string" },
            year: { type: "string" }
          },
          required: ["institution", "degree"],
          additionalProperties: false
        }
      },
      certifications: {
        type: "array",
        items: { type: "string" }
      },
      ats_score: {
        type: "number",
        description: "Estimated ATS compatibility score 0-100"
      },
      improvements_made: {
        type: "array",
        items: { type: "string" },
        description: "List of improvements made to the original resume"
      }
    },
    required: ["header", "summary", "experience", "skills", "ats_score", "improvements_made"],
    additionalProperties: false
  }
};

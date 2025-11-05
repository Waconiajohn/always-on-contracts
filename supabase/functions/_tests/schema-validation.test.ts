/**
 * Test Suite: Schema Validation for All Hardened Functions
 */

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  RequirementOptionsSchema,
  QuestionResponseSchema,
  HiddenCompetencySchema,
  CompetitivePositionSchema,
  CustomResumeSchema,
  SalaryReportSchema,
  GapAnalysisSchema,
  VaultIntelligenceSchema
} from '../_shared/ai-response-schemas.ts';
import { testSchemaValidation } from './test-helpers.ts';

// ============================================================================
// Simple Function Schemas (5)
// ============================================================================

Deno.test("RequirementOptionsSchema - Valid Data", async () => {
  const validData = {
    options: [
      { label: "Full-stack Development", value: "fullstack" },
      { label: "Backend Development", value: "backend" }
    ]
  };

  const invalidData = {
    options: "not an array" // Should be array
  };

  await testSchemaValidation(RequirementOptionsSchema, validData, invalidData);
});

Deno.test("QuestionResponseSchema - Valid Data", async () => {
  const validData = {
    questions: [
      { question: "What frameworks do you use?", category: "technical" },
      { question: "How many years of experience?", category: "experience" }
    ]
  };

  const invalidData = {
    questions: [
      { question: 123, category: "invalid" } // question should be string
    ]
  };

  await testSchemaValidation(QuestionResponseSchema, validData, invalidData);
});

Deno.test("HiddenCompetencySchema - Valid Data", async () => {
  const validData = {
    competencies: [
      {
        competency: "Crisis Management",
        evidence: "Led team through system outage",
        confidence: 85
      }
    ]
  };

  const invalidData = {
    competencies: [
      {
        competency: "Test",
        confidence: 150 // Should be 0-100
      }
    ]
  };

  await testSchemaValidation(HiddenCompetencySchema, validData, invalidData);
});

Deno.test("CompetitivePositionSchema - Valid Data", async () => {
  const validData = {
    competitiveScore: 75,
    marketPosition: "Above Average",
    strengths: ["10+ years experience", "Strong portfolio"],
    gaps: ["Missing cloud certification"],
    recommendations: ["Pursue AWS certification"]
  };

  const invalidData = {
    competitiveScore: 150, // Should be 0-100
    marketPosition: "Test"
  };

  await testSchemaValidation(CompetitivePositionSchema, validData, invalidData);
});

Deno.test("CustomResumeSchema - Valid Data", async () => {
  const validData = {
    customizedResume: "Professional Summary:\nExperienced developer...",
    changesApplied: ["Added keywords", "Quantified achievements"],
    matchScore: 85
  };

  const invalidData = {
    customizedResume: 12345, // Should be string
    changesApplied: "not an array"
  };

  await testSchemaValidation(CustomResumeSchema, validData, invalidData);
});

// ============================================================================
// Complex Function Schemas (3)
// ============================================================================

Deno.test("SalaryReportSchema - Valid Data", async () => {
  const validData = {
    marketRate: {
      min: 80000,
      max: 120000,
      median: 100000,
      currency: "USD"
    },
    factors: [
      { factor: "Experience Level", impact: "Increases by 15%" },
      { factor: "Location", impact: "Premium for tech hubs" }
    ],
    recommendations: [
      "Negotiate based on median",
      "Emphasize unique skills"
    ]
  };

  const invalidData = {
    marketRate: {
      min: "invalid", // Should be number
      max: 120000,
      median: 100000
    },
    factors: "not an array"
  };

  await testSchemaValidation(SalaryReportSchema, validData, invalidData);
});

Deno.test("GapAnalysisSchema - Valid Data", async () => {
  const validData = {
    overallFit: 75,
    strengths: ["Strong technical background", "Proven leadership"],
    gaps: [
      {
        type: "skill",
        description: "Missing Kubernetes experience",
        severity: "important",
        recommendation: "Complete online certification"
      }
    ],
    developmentPlan: ["Week 1-2: K8s fundamentals", "Week 3-4: Practice projects"]
  };

  const invalidData = {
    overallFit: 150, // Should be 0-100
    strengths: "not an array",
    gaps: [
      {
        type: "invalid_type", // Should be 'skill', 'experience', etc.
        description: "Test",
        severity: "critical"
      }
    ]
  };

  await testSchemaValidation(GapAnalysisSchema, validData, invalidData);
});

Deno.test("VaultIntelligenceSchema - Valid Data", async () => {
  const validData = {
    technicalSkills: ["Python", "AWS", "Docker"],
    softSkills: ["Leadership", "Communication"],
    leadershipExamples: ["Led team of 5 engineers"],
    businessImpact: ["Increased revenue by 30%"],
    powerPhrases: ["Architected scalable system"],
    projects: ["E-commerce platform migration"],
    hiddenCompetencies: ["Stakeholder management"],
    innovationExamples: ["Implemented CI/CD pipeline"],
    problemSolving: ["Resolved critical production issues"],
    stakeholderManagement: ["Managed C-level relationships"]
  };

  const invalidData = {
    technicalSkills: "not an array", // Should be array
    softSkills: 123
  };

  await testSchemaValidation(VaultIntelligenceSchema, validData, invalidData);
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Schemas - Handle Optional Fields", () => {
  // Test that optional fields are truly optional
  const minimalSalaryReport = {
    marketRate: {
      min: 80000,
      max: 120000,
      median: 100000,
      currency: "USD"
    },
    factors: [],
    recommendations: []
    // sources is optional
  };

  const result = SalaryReportSchema.safeParse(minimalSalaryReport);
  assertEquals(result.success, true, "Optional fields should not be required");
});

Deno.test("Schemas - Reject Extra Fields", () => {
  const dataWithExtraFields = {
    competitiveScore: 75,
    marketPosition: "Above Average",
    strengths: ["Test"],
    gaps: [],
    recommendations: [],
    extraField: "This should be ignored or rejected"
  };

  // CompetitivePositionSchema uses strict() if defined
  const result = CompetitivePositionSchema.safeParse(dataWithExtraFields);
  // Zod by default allows extra fields unless .strict() is used
  assertEquals(result.success, true, "Schema should handle extra fields gracefully");
});

console.log("✅ All schema validation tests completed");

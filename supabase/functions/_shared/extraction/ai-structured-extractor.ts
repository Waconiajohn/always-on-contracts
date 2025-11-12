// =====================================================
// AI-FIRST STRUCTURED EXTRACTION
// =====================================================
// Single source of truth for resume data extraction.
// Uses AI with structured output and confidence scores.
// Replaces all regex-based extraction logic.
// =====================================================

import { callPerplexity } from '../ai-config.ts';
import { logAIUsage } from '../cost-tracking.ts';
import { extractJSON } from '../json-parser.ts';

// ===== TYPES =====

export interface StructuredEducation {
  degrees: Array<{
    level: 'PhD' | 'Master' | 'Bachelor' | 'Associate' | 'Diploma' | 'Certificate' | 'High School' | 'None';
    field: string | null;
    institution: string | null;
    graduationYear: number | null;
    confidence: number; // 0-100
    evidence: string; // Quote from resume
  }>;
  certifications: Array<{
    name: string;
    issuingOrg: string | null;
    year: number | null;
    confidence: number;
    evidence: string;
  }>;
}

export interface StructuredExperience {
  totalYears: number;
  confidence: number;

  management: {
    hasExperience: boolean;
    teamSizes: number[];
    details: string;
    evidence: string[];
    confidence: number;
  };

  budget: {
    hasExperience: boolean;
    amounts: number[];
    details: string;
    evidence: string[];
    confidence: number;
  };

  executive: {
    hasExposure: boolean;
    interactionLevel: string | null;
    details: string;
    evidence: string[];
    confidence: number;
  };

  roles: Array<{
    title: string;
    company: string;
    startYear: number | null;
    endYear: number | null;
    isCurrent: boolean;
    description: string;
    confidence: number;
  }>;
}

export interface StructuredSkills {
  technical: Array<{
    skill: string;
    category: string;
    proficiencyLevel: 'expert' | 'advanced' | 'intermediate' | 'beginner';
    yearsOfExperience: number | null;
    confidence: number;
  }>;

  soft: Array<{
    skill: string;
    evidence: string;
    confidence: number;
  }>;

  leadership: Array<{
    skill: string;
    evidence: string;
    confidence: number;
  }>;
}

export interface StructuredAchievements {
  quantified: Array<{
    achievement: string;
    metric: string;
    impact: string;
    context: string;
    confidence: number;
  }>;

  strategic: Array<{
    achievement: string;
    scope: string;
    impact: string;
    confidence: number;
  }>;
}

export interface StructuredResumeData {
  education: StructuredEducation;
  experience: StructuredExperience;
  skills: StructuredSkills;
  achievements: StructuredAchievements;

  professionalIdentity: {
    currentTitle: string | null;
    primaryIndustry: string | null;
    seniorityLevel: 'Entry-Level IC' | 'Mid-Level IC' | 'Senior IC' | 'Staff IC' | 'Manager' | 'Senior Manager' | 'Director' | 'VP' | 'C-Level';
    careerArchetype: string | null;
    confidence: number;
  };

  extractionMetadata: {
    overallConfidence: number; // Average confidence across all sections
    highConfidenceFields: string[]; // Fields with confidence >= 95
    mediumConfidenceFields: string[]; // Fields with confidence 80-94
    lowConfidenceFields: string[]; // Fields with confidence < 80
    extractionTimestamp: string;
  };
}

// ===== MAIN EXTRACTION FUNCTION =====

export async function extractStructuredResumeData(
  resumeText: string,
  userId: string
): Promise<StructuredResumeData> {
  console.log('🤖 [AI-STRUCTURED-EXTRACTION] Starting AI-first extraction...');

  const prompt = `You are an expert resume parser. Extract ALL information from this resume into structured JSON with confidence scores.

RESUME TEXT:
${resumeText}

Return STRICT JSON with this EXACT structure:
{
  "education": {
    "degrees": [
      {
        "level": "PhD|Master|Bachelor|Associate|Diploma|Certificate|High School|None",
        "field": "Mechanical Engineering",
        "institution": "University of Texas",
        "graduationYear": 2015,
        "confidence": 95,
        "evidence": "Bachelor of Science in Mechanical Engineering, UT Austin, 2015"
      }
    ],
    "certifications": [
      {
        "name": "PE",
        "issuingOrg": "Texas Board of Professional Engineers",
        "year": 2017,
        "confidence": 100,
        "evidence": "Professional Engineer (PE), Texas, 2017"
      }
    ]
  },
  "experience": {
    "totalYears": 10,
    "confidence": 95,
    "management": {
      "hasExperience": true,
      "teamSizes": [5, 10, 15],
      "details": "Managed cross-functional engineering teams ranging from 5-15 people",
      "evidence": ["Led team of 15 engineers", "Supervised 5-person drilling crew"],
      "confidence": 95
    },
    "budget": {
      "hasExperience": true,
      "amounts": [500000, 2000000],
      "details": "Managed annual budgets from $500K to $2M for drilling operations",
      "evidence": ["Managed $2M annual budget", "Reduced costs by $500K"],
      "confidence": 90
    },
    "executive": {
      "hasExposure": true,
      "interactionLevel": "Regular presentations to C-suite",
      "details": "Presented quarterly results to VP and C-level executives",
      "evidence": ["Presented to CEO", "Advised VP of Operations"],
      "confidence": 85
    },
    "roles": [
      {
        "title": "Senior Drilling Engineer",
        "company": "ExxonMobil",
        "startYear": 2018,
        "endYear": null,
        "isCurrent": true,
        "description": "Leading drilling operations for offshore projects",
        "confidence": 100
      }
    ]
  },
  "skills": {
    "technical": [
      {
        "skill": "Drilling Engineering",
        "category": "Core Technical",
        "proficiencyLevel": "expert",
        "yearsOfExperience": 10,
        "confidence": 95
      }
    ],
    "soft": [
      {
        "skill": "Cross-functional Leadership",
        "evidence": "Led cross-functional teams across engineering, operations, and safety",
        "confidence": 90
      }
    ],
    "leadership": [
      {
        "skill": "Team Development",
        "evidence": "Mentored 5 junior engineers to promotion",
        "confidence": 85
      }
    ]
  },
  "achievements": {
    "quantified": [
      {
        "achievement": "Reduced drilling time by 30%",
        "metric": "30% reduction",
        "impact": "Saved $2M annually",
        "context": "Implemented new drilling optimization protocol",
        "confidence": 100
      }
    ],
    "strategic": [
      {
        "achievement": "Developed company-wide safety protocol",
        "scope": "Company-wide implementation",
        "impact": "Zero safety incidents for 2 years",
        "confidence": 95
      }
    ]
  },
  "professionalIdentity": {
    "currentTitle": "Senior Drilling Engineer",
    "primaryIndustry": "Oil & Gas / Energy",
    "seniorityLevel": "Senior IC",
    "careerArchetype": "Technical Leader",
    "confidence": 95
  },
  "extractionMetadata": {
    "overallConfidence": 92,
    "highConfidenceFields": ["education.degrees", "experience.roles", "achievements.quantified"],
    "mediumConfidenceFields": ["experience.executive", "skills.leadership"],
    "lowConfidenceFields": ["experience.budget.amounts"],
    "extractionTimestamp": "2025-11-11T16:45:00Z"
  }
}

CRITICAL EXTRACTION RULES:

1. **CONFIDENCE SCORING:**
   - 100 = Explicitly stated with exact quotes (e.g., "Bachelor of Science in Mechanical Engineering")
   - 95-99 = Explicitly stated but slightly ambiguous (e.g., "Engineering degree" without specifying Bachelor/Master)
   - 80-94 = Strong inference from context (e.g., "10 years as engineer" implies Bachelor minimum)
   - 60-79 = Moderate inference (e.g., job title implies certain skills)
   - <60 = Weak inference or missing data
   - Set confidence to 0 if data is completely absent

2. **EDUCATION EXTRACTION:**
   - Search ENTIRE resume for education keywords
   - Degree formats to recognize:
     * Full: "Bachelor of Science", "Master of Business Administration", "Doctor of Philosophy"
     * Abbreviated: "B.S.", "BS", "M.S.", "MS", "MBA", "PhD", "Ph.D."
     * Possessive: "Bachelor's", "Master's"
     * Informal: "Engineering degree", "Business degree"
     * Foreign: "Licence", "Diplôme", "Laurea", "Baccalaureate"
   - Field extraction: Look for text after "in", "of", "major", "concentration"
   - If you find ANY mention of a degree, mark confidence as 90+ (unless very ambiguous)
   - Extract ALL degrees (many people have multiple)
   - Certifications: PMP, PE, CPA, CFA, CISSP, AWS, Azure, Six Sigma, Scrum, etc.

3. **EXPERIENCE EXTRACTION:**
   - Calculate totalYears from earliest to latest role (or current date if still employed)
   - Management: Look for "led", "managed", "supervised", "directed", team sizes, direct reports
   - Budget: Look for dollar amounts, "managed budget", "P&L responsibility", cost savings
   - Executive: Look for "C-suite", "executive", "VP", "board", "strategic planning"
   - Extract specific numbers wherever possible

4. **SKILLS EXTRACTION:**
   - Technical: Hard skills, tools, technologies, methodologies
   - Soft: Communication, leadership, problem-solving, collaboration
   - Leadership: People management, mentoring, strategic thinking
   - Categorize by proficiency based on context (expert if 5+ years, advanced if 3-5, etc.)

5. **ACHIEVEMENTS EXTRACTION:**
   - Quantified: Any achievement with numbers/percentages (saved $X, increased Y by Z%)
   - Strategic: High-level impacts (company-wide changes, new processes, major initiatives)
   - Extract the WHAT, the METRIC, and the IMPACT

6. **EVIDENCE COLLECTION:**
   - For EVERY field, include a direct quote from the resume as evidence
   - This allows for human verification and debugging
   - Keep evidence concise (< 200 chars per quote)

7. **HANDLING MISSING DATA:**
   - If data is not found, set field to null (for strings/objects) or 0 (for numbers)
   - Set confidence to 0 for missing data
   - DO NOT omit fields - return the full structure even if empty
   - DO NOT make up data - only extract what's actually in the resume

8. **METADATA CALCULATION:**
   - overallConfidence: Average all confidence scores across all fields
   - highConfidenceFields: List all fields with confidence >= 95
   - mediumConfidenceFields: List all fields with confidence 80-94
   - lowConfidenceFields: List all fields with confidence < 80
   - extractionTimestamp: Current ISO 8601 timestamp

Return ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

  try {
    const { response, metrics } = await callPerplexity({
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Extract all information into structured JSON with confidence scores. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'sonar-pro', // Best reasoning model for complex extraction
      temperature: 0.2, // Low temperature for factual extraction
      max_tokens: 8000, // Large output for comprehensive extraction
      return_citations: false,
    }, 'ai-structured-extraction', userId);

    // Log AI usage
    await logAIUsage(metrics);

    console.log('🤖 [AI-STRUCTURED-EXTRACTION] AI response received');

    // Parse response
    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);

    if (!parseResult.success || !parseResult.data) {
      throw new Error('Failed to parse AI response into valid JSON');
    }

    const structuredData = parseResult.data as StructuredResumeData;

    // Validation
    if (!structuredData.education || !structuredData.experience || !structuredData.skills) {
      throw new Error('AI response missing required sections');
    }

    console.log('✅ [AI-STRUCTURED-EXTRACTION] Extraction complete:', {
      overallConfidence: structuredData.extractionMetadata.overallConfidence,
      degreesFound: structuredData.education.degrees.length,
      certificationsFound: structuredData.education.certifications.length,
      rolesFound: structuredData.experience.roles.length,
      hasManagement: structuredData.experience.management.hasExperience,
      hasBudget: structuredData.experience.budget.hasExperience,
      highConfidenceFields: structuredData.extractionMetadata.highConfidenceFields.length,
      mediumConfidenceFields: structuredData.extractionMetadata.mediumConfidenceFields.length,
      lowConfidenceFields: structuredData.extractionMetadata.lowConfidenceFields.length
    });

    // Log specific education extraction results
    if (structuredData.education.degrees.length > 0) {
      structuredData.education.degrees.forEach((degree, idx) => {
        console.log(`  🎓 Degree ${idx + 1}: ${degree.level} in ${degree.field || 'Unknown'} (confidence: ${degree.confidence})`);
        console.log(`     Evidence: "${degree.evidence}"`);
      });
    } else {
      console.log('  ⚠️ No degrees found in resume');
    }

    return structuredData;

  } catch (error) {
    console.error('❌ [AI-STRUCTURED-EXTRACTION] Error:', error);
    throw error;
  }
}

// ===== AI-POWERED GAP ANALYSIS =====

export interface GapAnalysisResult {
  criticalGaps: Array<{
    field: string;
    reason: string;
    question: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    expectedAnswer: string;
    currentConfidence: number;
  }>;

  verificationQuestions: Array<{
    field: string;
    reason: string;
    question: string;
    priority: 'high' | 'medium' | 'low';
    currentValue: string;
    currentConfidence: number;
  }>;

  noQuestionsNeeded: string[]; // Fields that are high confidence and complete

  overallAssessment: {
    dataCompleteness: number; // 0-100
    dataQuality: number; // 0-100
    readyForVault: boolean;
    missingCriticalData: string[];
  };
}

export async function analyzeGapsWithAI(
  extractedData: StructuredResumeData,
  benchmarkExpectations: {
    jobTitle: string;
    industry: string;
    seniorityLevel: string;
    expectedEducation: string;
    expectedManagement: string;
    expectedBudget: string;
    expectedCompetencies: string[];
  },
  userId: string
): Promise<GapAnalysisResult> {
  console.log('🔍 [AI-GAP-ANALYSIS] Analyzing gaps between extracted data and benchmarks...');

  // Pre-analyze confidence scores to build explicit exclusion list
  const highConfidenceFields: string[] = [];

  // Check education confidence
  if (extractedData.education.degrees.length > 0) {
    const highestDegree = extractedData.education.degrees[0];
    if (highestDegree.confidence >= 95) {
      highConfidenceFields.push(`Education: ${highestDegree.level} in ${highestDegree.field || 'related field'} (confidence: ${highestDegree.confidence}%)`);
    }
  }

  // Check management confidence
  if (extractedData.experience.management.confidence >= 95) {
    highConfidenceFields.push(`Management: ${extractedData.experience.management.hasExperience ? 'YES' : 'NO'} (confidence: ${extractedData.experience.management.confidence}%)`);
  }

  // Check budget confidence
  if (extractedData.experience.budget.confidence >= 95) {
    highConfidenceFields.push(`Budget: ${extractedData.experience.budget.hasExperience ? 'YES' : 'NO'} (confidence: ${extractedData.experience.budget.confidence}%)`);
  }

  // Check executive confidence
  if (extractedData.experience.executive.confidence >= 95) {
    highConfidenceFields.push(`Executive: ${extractedData.experience.executive.hasExposure ? 'YES' : 'NO'} (confidence: ${extractedData.experience.executive.confidence}%)`);
  }

  if (highConfidenceFields.length > 0) {
    console.log(`🔍 [AI-GAP-ANALYSIS] High-confidence fields (>= 95%):`, highConfidenceFields.map(f => `\n  ${f}`).join(''));
  } else {
    console.log(`🔍 [AI-GAP-ANALYSIS] No high-confidence fields found - may ask basic questions`);
  }

  const prompt = `You are an expert career advisor. Analyze extracted resume data and identify what questions need to be asked.

EXTRACTED DATA (with confidence scores):
${JSON.stringify(extractedData, null, 2)}

INDUSTRY BENCHMARKS for ${benchmarkExpectations.jobTitle} in ${benchmarkExpectations.industry}:
- Expected Education: ${benchmarkExpectations.expectedEducation}
- Expected Management: ${benchmarkExpectations.expectedManagement}
- Expected Budget: ${benchmarkExpectations.expectedBudget}
- Expected Competencies: ${benchmarkExpectations.expectedCompetencies.join(', ')}
- Seniority Level: ${benchmarkExpectations.seniorityLevel}

✅ CONFIRMED HIGH-CONFIDENCE FIELDS (DO NOT ASK ABOUT THESE):
${highConfidenceFields.length > 0 ? highConfidenceFields.map(f => `✓ ${f}`).join('\n') : 'None confirmed yet'}

YOUR TASK:
Identify what questions to ask based on confidence scores ONLY. Ignore benchmark expectations if data is already confirmed with high confidence.

CRITICAL RULES (MUST FOLLOW):

1. **ABSOLUTE RULE: DO NOT generate questions for fields listed in "CONFIRMED HIGH-CONFIDENCE FIELDS" above**
   - If education is in the confirmed list with confidence >= 95, DO NOT add it to criticalGaps
   - If management is in the confirmed list with confidence >= 95, DO NOT add it to criticalGaps
   - If budget is in the confirmed list with confidence >= 95, DO NOT add it to criticalGaps
   - These fields are CONFIRMED - asking about them again is a critical error

2. **Generate CRITICAL gap questions ONLY for:**
   - Fields with confidence < 80 AND benchmark expects this data
   - Fields with confidence 0 (completely missing) that are expected for the role
   - Example: Education confidence 0 but benchmark expects Bachelor → ASK
   - Example: Education confidence 100 → DO NOT ASK (already confirmed)

3. **Generate VERIFICATION questions for:**
   - Fields with confidence 80-94 (strong inference but not explicit)
   - Example: Budget confidence 85 → Ask for specific amounts
   - DO NOT ask verification questions for confidence >= 95

4. **Add to noQuestionsNeeded:**
   - ALL fields with confidence >= 95
   - These should match the "CONFIRMED HIGH-CONFIDENCE FIELDS" list above

5. **Priority scoring:**
   - critical: Missing data (confidence < 80) that is REQUIRED for the role
   - high: Important data that significantly impacts profile strength
   - medium: Nice-to-have data for completeness
   - low: Optional data that adds minimal value

EXAMPLES:
- Education confidence 100 → noQuestionsNeeded: ["education.degrees (Bachelor in Mech Eng, confidence: 100)"]
- Education confidence 0 → criticalGaps: [{field: "education", question: "What is your degree?"}]
- Management confidence 95 → noQuestionsNeeded: ["management (Led teams, confidence: 95)"]
- Management confidence 70 → criticalGaps: [{field: "management", question: "Have you managed teams?"}]

Return STRICT JSON:
{
  "criticalGaps": [
    {
      "field": "budget_ownership",
      "reason": "Benchmark expects budget experience but resume shows none (confidence: 0)",
      "question": "Have you managed budgets in your role? If yes, what was the typical budget size?",
      "priority": "high",
      "expectedAnswer": "Yes/No and dollar amount",
      "currentConfidence": 0
    }
  ],
  "verificationQuestions": [
    {
      "field": "team_size",
      "reason": "Resume implies management (confidence: 85) but no specific team sizes mentioned",
      "question": "What was the typical size of teams you managed?",
      "priority": "medium",
      "currentValue": "Led cross-functional teams",
      "currentConfidence": 85
    }
  ],
  "noQuestionsNeeded": [
    "education.degrees (Bachelor in Mechanical Engineering, confidence: 100)",
    "experience.roles (5 roles with dates, confidence: 100)",
    "certifications (PE, PMP, confidence: 100)"
  ],
  "overallAssessment": {
    "dataCompleteness": 85,
    "dataQuality": 90,
    "readyForVault": true,
    "missingCriticalData": ["specific budget amounts"]
  }
}`;

  try {
    const { response, metrics } = await callPerplexity({
      messages: [
        {
          role: 'system',
          content: 'You are an expert career advisor analyzing resume data quality. Return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'sonar-pro',
      temperature: 0.3,
      max_tokens: 4000,
      return_citations: false,
    }, 'ai-gap-analysis', userId);

    await logAIUsage(metrics);

    const content = response.choices[0].message.content;
    const parseResult = extractJSON(content);

    if (!parseResult.success || !parseResult.data) {
      throw new Error('Failed to parse gap analysis response');
    }

    let gapAnalysis = parseResult.data as GapAnalysisResult;

    console.log('✅ [AI-GAP-ANALYSIS] Gap analysis complete (before safety filter):', {
      criticalGaps: gapAnalysis.criticalGaps.length,
      verificationQuestions: gapAnalysis.verificationQuestions.length,
      noQuestionsNeeded: gapAnalysis.noQuestionsNeeded.length,
      dataCompleteness: gapAnalysis.overallAssessment.dataCompleteness,
      readyForVault: gapAnalysis.overallAssessment.readyForVault
    });

    // ========================================================================
    // SAFETY FILTER: Programmatically remove questions for confirmed fields
    // This is a failsafe in case the AI ignores the prompt
    // ========================================================================
    const originalCriticalGapsCount = gapAnalysis.criticalGaps.length;
    const originalVerificationCount = gapAnalysis.verificationQuestions.length;

    // Filter critical gaps
    gapAnalysis.criticalGaps = gapAnalysis.criticalGaps.filter(gap => {
      const field = gap.field.toLowerCase();

      // Check education
      if ((field.includes('education') || field.includes('degree')) &&
          extractedData.education.degrees.length > 0 &&
          extractedData.education.degrees[0].confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed education gap: "${gap.question}" (confidence: ${extractedData.education.degrees[0].confidence}%)`);
        return false;
      }

      // Check management
      if ((field.includes('management') || field.includes('team')) &&
          extractedData.experience.management.confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed management gap: "${gap.question}" (confidence: ${extractedData.experience.management.confidence}%)`);
        return false;
      }

      // Check budget
      if (field.includes('budget') &&
          extractedData.experience.budget.confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed budget gap: "${gap.question}" (confidence: ${extractedData.experience.budget.confidence}%)`);
        return false;
      }

      // Check executive
      if (field.includes('executive') &&
          extractedData.experience.executive.confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed executive gap: "${gap.question}" (confidence: ${extractedData.experience.executive.confidence}%)`);
        return false;
      }

      return true; // Keep the gap
    });

    // Filter verification questions
    gapAnalysis.verificationQuestions = gapAnalysis.verificationQuestions.filter(gap => {
      const field = gap.field.toLowerCase();

      // Same checks as critical gaps
      if ((field.includes('education') || field.includes('degree')) &&
          extractedData.education.degrees.length > 0 &&
          extractedData.education.degrees[0].confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed education verification: "${gap.question}"`);
        return false;
      }

      if ((field.includes('management') || field.includes('team')) &&
          extractedData.experience.management.confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed management verification: "${gap.question}"`);
        return false;
      }

      if (field.includes('budget') &&
          extractedData.experience.budget.confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed budget verification: "${gap.question}"`);
        return false;
      }

      if (field.includes('executive') &&
          extractedData.experience.executive.confidence >= 95) {
        console.log(`🚫 [SAFETY FILTER] Removed executive verification: "${gap.question}"`);
        return false;
      }

      return true; // Keep the question
    });

    const filteredCriticalGaps = originalCriticalGapsCount - gapAnalysis.criticalGaps.length;
    const filteredVerificationGaps = originalVerificationCount - gapAnalysis.verificationQuestions.length;

    if (filteredCriticalGaps > 0 || filteredVerificationGaps > 0) {
      console.log(`✅ [SAFETY FILTER] Removed ${filteredCriticalGaps} critical gaps + ${filteredVerificationGaps} verification questions (high confidence fields)`);
    } else {
      console.log(`✅ [SAFETY FILTER] No filtering needed - AI correctly excluded confirmed fields`);
    }

    console.log('🎯 [AI-GAP-ANALYSIS] Final critical gaps after safety filter:');
    gapAnalysis.criticalGaps.forEach((gap, idx) => {
      console.log(`  ${idx + 1}. [${gap.priority}] ${gap.field}: ${gap.question}`);
    });

    console.log('✅ [AI-GAP-ANALYSIS] No questions needed for:');
    gapAnalysis.noQuestionsNeeded.forEach(field => {
      console.log(`  ✓ ${field}`);
    });

    return gapAnalysis;

  } catch (error) {
    console.error('❌ [AI-GAP-ANALYSIS] Error:', error);
    throw error;
  }
}

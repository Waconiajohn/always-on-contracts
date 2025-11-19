// =====================================================
// AI-FIRST STRUCTURED EXTRACTION
// =====================================================
// Single source of truth for resume data extraction.
// Uses AI with structured output and confidence scores.
// Replaces all regex-based extraction logic.
// =====================================================

import { callLovableAI, LOVABLE_AI_MODELS } from '../lovable-ai-config.ts';
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

  const prompt = `Extract resume data into structured JSON with confidence scores.

RESUME:
${resumeText}

CONFIDENCE SCORING:
- 100: Explicit with exact quote ("B.S. Mechanical Engineering, UT Austin, 2015")
- 95-99: Explicit but ambiguous ("Engineering degree")
- 80-94: Strong inference ("10 years as engineer" → implies degree)
- 60-79: Moderate inference (job title ��� certain skills)
- <60: Weak/missing

EDUCATION - Search for:
- Degrees: BS, MS, PhD, Bachelor's, Master's, Diploma, Licence, Diplôme (any format)
- Certifications: PMP, PE, CPA, CFA, CISSP, Six Sigma, etc.
- Extract ALL degrees, mark confidence 95+ if explicitly stated

EXPERIENCE - Extract:
- totalYears (earliest to latest role)
- Management: "led/managed/supervised" + team sizes + details + evidence
- Budget: dollar amounts, "P&L", cost savings + amounts + details + evidence
- Executive: C-suite interaction, VP contact, board presentations + details + evidence
- All roles with title, company, years

SKILLS - Extract:
- technical: tools/technologies with proficiency (expert=5+yrs, advanced=3-5yrs)
- soft: communication, problem-solving with evidence
- leadership: mentoring, strategic thinking with evidence

ACHIEVEMENTS - Extract:
- quantified: with metric + impact ("Reduced costs 30% → Saved $2M")
- strategic: scope + impact ("Company-wide process → Zero incidents")

Return ONLY JSON (no markdown):
{
  "education": {"degrees": [{"level": "Bachelor|Master|PhD|...", "field": "...", "institution": "...", "graduationYear": 2015, "confidence": 100, "evidence": "..."}], "certifications": [{"name": "...", "issuingOrg": "...", "year": 2017, "confidence": 100, "evidence": "..."}]},
  "experience": {"totalYears": 10, "confidence": 95, "management": {"hasExperience": true, "teamSizes": [5,10], "details": "...", "evidence": ["..."], "confidence": 95}, "budget": {"hasExperience": true, "amounts": [500000], "details": "...", "evidence": ["..."], "confidence": 90}, "executive": {"hasExposure": true, "interactionLevel": "...", "details": "...", "evidence": ["..."], "confidence": 85}, "roles": [{"title": "...", "company": "...", "startYear": 2020, "endYear": null, "isCurrent": true, "description": "...", "confidence": 100}]},
  "skills": {"technical": [{"skill": "...", "category": "...", "proficiencyLevel": "expert|advanced|intermediate|beginner", "yearsOfExperience": 5, "confidence": 95}], "soft": [{"skill": "...", "evidence": "...", "confidence": 90}], "leadership": [{"skill": "...", "evidence": "...", "confidence": 85}]},
  "achievements": {"quantified": [{"achievement": "...", "metric": "...", "impact": "...", "context": "...", "confidence": 100}], "strategic": [{"achievement": "...", "scope": "...", "impact": "...", "confidence": 95}]},
  "professionalIdentity": {"currentTitle": "...", "primaryIndustry": "...", "seniorityLevel": "Senior IC|Manager|Director|VP|C-Suite", "careerArchetype": "...", "confidence": 95},
  "extractionMetadata": {"overallConfidence": 92, "highConfidenceFields": ["..."], "mediumConfidenceFields": ["..."], "lowConfidenceFields": ["..."], "extractionTimestamp": "${new Date().toISOString()}"}
}

Missing data: Set to null/0 with confidence 0. Include ALL fields even if empty. NO markdown.`;

  try {
    const { response, metrics } = await callLovableAI({
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume parser. Extract all information into structured JSON with confidence scores. Return ONLY valid JSON, no markdown or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash - excellent for structured extraction
      temperature: 0.1, // Very low for factual extraction
      max_tokens: 6000, // Sufficient for comprehensive structured output
      response_format: { type: 'json_object' }
    }, 'ai-structured-extraction', userId, 120000); // 2 minute timeout for complex extraction

    // Log AI usage
    await logAIUsage(metrics);

    console.log('🤖 [AI-STRUCTURED-EXTRACTION] AI response received');

    const content = response.choices[0].message.content;
    
    // Debug: Log response details
    console.log('📊 Response length:', content.length, 'chars');
    console.log('📄 Response preview (first 800 chars):', content.substring(0, 800));
    console.log('📄 Response preview (last 500 chars):', content.substring(content.length - 500));
    
    const parseResult = extractJSON(content);

    if (!parseResult.success || !parseResult.data) {
      console.error('❌ JSON parsing failed.');
      console.error('📄 Full response (first 2000 chars):', content.substring(0, 2000));
      console.error('Parse error:', parseResult.error);
      throw new Error(`Failed to parse AI response into valid JSON: ${parseResult.error}`);
    }

    const structuredData = parseResult.data as StructuredResumeData;
    
    // Debug: Log what we got
    console.log('✅ JSON parsed successfully. Top-level keys:', Object.keys(structuredData));

    // Detailed validation with helpful error messages
    const missingFields: string[] = [];
    if (!structuredData.education) missingFields.push('education');
    if (!structuredData.experience) missingFields.push('experience');
    if (!structuredData.skills) missingFields.push('skills');
    if (!structuredData.achievements) missingFields.push('achievements');
    if (!structuredData.professionalIdentity) missingFields.push('professionalIdentity');
    if (!structuredData.extractionMetadata) missingFields.push('extractionMetadata');
    
    if (missingFields.length > 0) {
      console.error('❌ Parsed JSON structure:', JSON.stringify(structuredData, null, 2).substring(0, 1000));
      console.error('Missing required fields:', missingFields);
      throw new Error(`AI response missing required sections: ${missingFields.join(', ')}`);
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
    const { response, metrics } = await callLovableAI({
      messages: [
        {
          role: 'system',
          content: 'You are an expert career advisor analyzing resume data quality. Return valid JSON with no markdown formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: LOVABLE_AI_MODELS.DEFAULT, // Gemini Flash - fast gap analysis
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' }, // Enforce JSON output
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

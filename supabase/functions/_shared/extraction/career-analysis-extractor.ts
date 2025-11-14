/**
 * Career Analysis Extractor - AI-Based (NO REGEX)
 *
 * Replaces regex-based pattern matching with semantic AI analysis
 * for management experience, education, and other career attributes
 */

import { callPerplexity } from '../ai-config.ts';
import { extractJSON } from '../json-parser.ts';
import { logAIUsage } from '../cost-tracking.ts';

export interface ManagementAnalysis {
  hasManagementExperience: boolean;
  jobTitles: string[]; // e.g. ["Drilling Engineering Supervisor", "Field Operations Engineer"]
  teamSize: number | null; // e.g. 4
  budgetAmount: string | null; // e.g. "$350M"
  budgetCurrency: string; // e.g. "USD"
  directReports: number | null;
  yearsInManagement: number | null;
  managementLevel: 'individual_contributor' | 'team_lead' | 'manager' | 'director' | 'vp' | 'c_suite';
  evidenceQuotes: string[]; // Direct quotes from resume showing management
  confidence: number; // 0-100
}

export interface EducationAnalysis {
  hasUndergraduateDegree: boolean;
  hasGraduateDegree: boolean;
  degrees: Array<{
    degreeType: string; // "Bachelor of Science", "Master of Business Administration", etc
    major: string; // "Mechanical Engineering", "Computer Science", etc
    minor?: string;
    institution: string;
    graduationYear?: number;
    gpa?: number;
    honors?: string; // "Magna Cum Laude", "Dean's List", etc
  }>;
  certifications: string[]; // Professional certifications
  relevantCoursework?: string[];
  confidence: number;
}

export interface CareerContextAnalysis {
  industries: string[]; // ["Oil & Gas", "Energy", "Engineering"]
  primaryIndustry: string;
  yearsOfExperience: number;
  careerLevel: 'entry' | 'mid' | 'senior' | 'executive' | 'c_suite';
  specializations: string[]; // ["Drilling Engineering", "HPHT Operations", "Project Management"]
  geographicExperience: string[]; // ["Delaware Basin", "Eagle Ford Shale", "Permian Basin"]
  confidence: number;
}

/**
 * AI-based management experience analysis (NO REGEX)
 */
export async function analyzeManagementExperience(
  resumeText: string,
  userId: string
): Promise<ManagementAnalysis> {
  const prompt = `Analyze this resume for management and leadership experience.

RESUME:
${resumeText}

Return ONLY valid JSON with this exact structure:
{
  "hasManagementExperience": boolean,
  "jobTitles": ["exact job title from resume"],
  "teamSize": number or null,
  "budgetAmount": "dollar amount with units" or null,
  "budgetCurrency": "USD" or other currency,
  "directReports": number or null,
  "yearsInManagement": number or null,
  "managementLevel": "individual_contributor" | "team_lead" | "manager" | "director" | "vp" | "c_suite",
  "evidenceQuotes": ["direct quote 1", "direct quote 2"],
  "confidence": 0-100
}

INSTRUCTIONS:
- Look for job titles containing: Supervisor, Manager, Director, VP, Chief, Lead
- Extract team size from phrases like "managed team of X", "led X engineers", "oversaw X rigs"
- Extract budget from phrases like "$XM budget", "managed $X million", "P&L of $X"
- Quote the EXACT text from resume as evidence
- Set confidence based on how explicit the evidence is (90+ = job title clearly states management, 70-89 = implicit management responsibility, <70 = unclear)

NO markdown, NO explanations, ONLY the JSON object.`;

  const result = await callPerplexity(
    {
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 2000,
    },
    'analyze_management',
    userId
  );

  await logAIUsage(result.metrics);

  const content = result.response.choices[0].message.content;
  const parseResult = extractJSON(content);

  if (!parseResult.success || !parseResult.data) {
    console.error('[MANAGEMENT-ANALYSIS] Failed to parse:', parseResult.error);
    // Return safe default
    return {
      hasManagementExperience: false,
      jobTitles: [],
      teamSize: null,
      budgetAmount: null,
      budgetCurrency: 'USD',
      directReports: null,
      yearsInManagement: null,
      managementLevel: 'individual_contributor',
      evidenceQuotes: [],
      confidence: 0,
    };
  }

  return parseResult.data as ManagementAnalysis;
}

/**
 * AI-based education analysis (NO REGEX)
 */
export async function analyzeEducation(
  resumeText: string,
  userId: string
): Promise<EducationAnalysis> {
  const prompt = `Analyze this resume for education credentials.

RESUME:
${resumeText}

Return ONLY valid JSON with this exact structure:
{
  "hasUndergraduateDegree": boolean,
  "hasGraduateDegree": boolean,
  "degrees": [
    {
      "degreeType": "Bachelor of Science",
      "major": "Mechanical Engineering",
      "minor": "Mathematics" or null,
      "institution": "Southern Methodist University",
      "graduationYear": 2007 or null,
      "gpa": 3.8 or null,
      "honors": "Magna Cum Laude" or null
    }
  ],
  "certifications": ["PMP", "PE", "Six Sigma Black Belt"],
  "relevantCoursework": ["Advanced Drilling", "Reservoir Engineering"],
  "confidence": 0-100
}

INSTRUCTIONS:
- Extract ALL degrees mentioned (Bachelor, Master, PhD, Associate, etc.)
- Include major/minor fields of study
- Extract institution names
- Look for certifications, licenses, professional credentials
- Set confidence based on how clearly education is stated

NO markdown, NO explanations, ONLY the JSON object.`;

  const result = await callPerplexity(
    {
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 2000,
    },
    'analyze_education',
    userId
  );

  await logAIUsage(result.metrics);

  const content = result.response.choices[0].message.content;
  const parseResult = extractJSON(content);

  if (!parseResult.success || !parseResult.data) {
    console.error('[EDUCATION-ANALYSIS] Failed to parse:', parseResult.error);
    return {
      hasUndergraduateDegree: false,
      hasGraduateDegree: false,
      degrees: [],
      certifications: [],
      confidence: 0,
    };
  }

  return parseResult.data as EducationAnalysis;
}

/**
 * AI-based career context analysis (NO REGEX)
 */
export async function analyzeCareerContext(
  resumeText: string,
  userId: string
): Promise<CareerContextAnalysis> {
  const prompt = `Analyze this resume to understand the candidate's career context.

RESUME:
${resumeText}

Return ONLY valid JSON with this exact structure:
{
  "industries": ["Oil & Gas", "Energy"],
  "primaryIndustry": "Oil & Gas",
  "yearsOfExperience": 17,
  "careerLevel": "entry" | "mid" | "senior" | "executive" | "c_suite",
  "specializations": ["Drilling Engineering", "HPHT Operations"],
  "geographicExperience": ["Delaware Basin", "Eagle Ford Shale"],
  "confidence": 0-100
}

INSTRUCTIONS:
- Identify all industries the candidate has worked in
- Calculate total years of professional experience
- Determine career level based on job titles and responsibilities
- Extract specialized areas of expertise
- Note geographic regions/locations mentioned
- Set confidence based on clarity of information

NO markdown, NO explanations, ONLY the JSON object.`;

  const result = await callPerplexity(
    {
      messages: [{ role: 'user', content: prompt }],
      model: 'sonar-pro',
      max_tokens: 2000,
    },
    'analyze_career_context',
    userId
  );

  await logAIUsage(result.metrics);

  const content = result.response.choices[0].message.content;
  const parseResult = extractJSON(content);

  if (!parseResult.success || !parseResult.data) {
    console.error('[CAREER-CONTEXT-ANALYSIS] Failed to parse:', parseResult.error);
    return {
      industries: [],
      primaryIndustry: 'Unknown',
      yearsOfExperience: 0,
      careerLevel: 'mid',
      specializations: [],
      geographicExperience: [],
      confidence: 0,
    };
  }

  return parseResult.data as CareerContextAnalysis;
}

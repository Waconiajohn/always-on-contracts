/**
 * Centralized Prompt Management System
 * Version-controlled, reusable prompts with metadata
 */

export interface PromptMetadata {
  version: string;
  avgTokens: number;
  avgLatencyMs: number;
  successRate: number;
  lastUpdated: string;
}

export interface ManagedPrompt {
  id: string;
  version: string;
  systemPrompt?: string;
  userPromptTemplate: (vars: Record<string, any>) => string;
  metadata: PromptMetadata;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Prompt Registry
 * Central repository for all AI prompts
 */
export const PROMPT_REGISTRY = {
  // Resume Generation
  RESUME_GENERATION_V1: {
    id: 'resume-generation',
    version: 'v1',
    systemPrompt: 'You are an expert executive resume writer with 20+ years of experience crafting C-suite resumes. Create compelling, achievement-focused content that demonstrates strategic leadership and measurable business impact.',
    userPromptTemplate: (vars: { role: string; experience: string; achievements: string }) => 
      `Create an executive resume section for a ${vars.role} with the following background:\n\nExperience: ${vars.experience}\n\nKey Achievements:\n${vars.achievements}\n\nFocus on quantifiable results and strategic impact.`,
    metadata: {
      version: 'v1',
      avgTokens: 3500,
      avgLatencyMs: 12000,
      successRate: 0.95,
      lastUpdated: '2025-01-01'
    },
    model: 'sonar-pro',
    temperature: 0.3
  } as ManagedPrompt,

  // Job Analysis
  JOB_ANALYSIS_V1: {
    id: 'job-analysis',
    version: 'v1',
    systemPrompt: 'You are an expert career analyst specializing in executive-level positions. Analyze job descriptions to extract key requirements, qualifications, and cultural indicators.',
    userPromptTemplate: (vars: { jobDescription: string }) =>
      `Analyze this executive job description and extract:\n1. Core responsibilities\n2. Required qualifications\n3. Cultural fit indicators\n4. Success metrics\n\n${vars.jobDescription}`,
    metadata: {
      version: 'v1',
      avgTokens: 2500,
      avgLatencyMs: 8000,
      successRate: 0.98,
      lastUpdated: '2025-01-01'
    },
    model: 'sonar-pro',
    temperature: 0.2
  } as ManagedPrompt,

  // Interview Prep
  INTERVIEW_PREP_V1: {
    id: 'interview-prep',
    version: 'v1',
    systemPrompt: 'You are an executive interview coach with expertise in C-suite hiring processes. Generate strategic interview questions and model STAR-format responses.',
    userPromptTemplate: (vars: { role: string; company: string; background: string }) =>
      `Create interview preparation content for a ${vars.role} position at ${vars.company}.\n\nCandidate Background:\n${vars.background}\n\nProvide:\n1. 5 likely interview questions\n2. Strategic talking points\n3. Questions to ask the interviewer`,
    metadata: {
      version: 'v1',
      avgTokens: 3000,
      avgLatencyMs: 10000,
      successRate: 0.93,
      lastUpdated: '2025-01-01'
    },
    model: 'sonar-pro',
    temperature: 0.4
  } as ManagedPrompt,

  // LinkedIn Content
  LINKEDIN_POST_V1: {
    id: 'linkedin-post',
    version: 'v1',
    systemPrompt: 'You are a LinkedIn content strategist specializing in executive thought leadership. Create engaging, professional content that demonstrates expertise and drives engagement.',
    userPromptTemplate: (vars: { topic: string; tone: string; audience: string }) =>
      `Create a LinkedIn post about: ${vars.topic}\n\nTone: ${vars.tone}\nTarget Audience: ${vars.audience}\n\nInclude:\n- Hook to grab attention\n- Key insight or story\n- Call to action`,
    metadata: {
      version: 'v1',
      avgTokens: 800,
      avgLatencyMs: 5000,
      successRate: 0.96,
      lastUpdated: '2025-01-01'
    },
    model: 'sonar',
    temperature: 0.6
  } as ManagedPrompt,

  // Cover Letter
  COVER_LETTER_V1: {
    id: 'cover-letter',
    version: 'v1',
    systemPrompt: 'You are an executive career consultant specializing in compelling cover letters. Create personalized, strategic letters that highlight cultural fit and unique value proposition.',
    userPromptTemplate: (vars: { role: string; company: string; whyYou: string }) =>
      `Create a cover letter for a ${vars.role} position at ${vars.company}.\n\nCandidate\'s Unique Value:\n${vars.whyYou}\n\nEmphasize strategic fit and mutual benefit.`,
    metadata: {
      version: 'v1',
      avgTokens: 2000,
      avgLatencyMs: 7000,
      successRate: 0.94,
      lastUpdated: '2025-01-01'
    },
    model: 'sonar-pro',
    temperature: 0.4
  } as ManagedPrompt
};

/**
 * Get a prompt by ID
 */
export function getPrompt(promptId: string): ManagedPrompt | undefined {
  return Object.values(PROMPT_REGISTRY).find(p => p.id === promptId);
}

/**
 * Get all prompts for a specific use case
 */
export function getPromptsByCategory(category: 'resume' | 'interview' | 'linkedin' | 'cover-letter'): ManagedPrompt[] {
  const categoryMap: Record<string, string[]> = {
    resume: ['resume-generation'],
    interview: ['interview-prep'],
    linkedin: ['linkedin-post'],
    'cover-letter': ['cover-letter']
  };

  const promptIds = categoryMap[category] || [];
  return promptIds
    .map(id => getPrompt(id))
    .filter((p): p is ManagedPrompt => p !== undefined);
}

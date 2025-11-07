/**
 * Pre-Extraction Analyzer
 * Gathers context and builds extraction strategy before main extraction
 */

import { loadFrameworkContext, FrameworkContext } from '../frameworks/framework-service.ts';

export interface ResumeStructure {
  sections: ResumeSection[];
  totalWordCount: number;
  totalCharCount: number;
  hasContactInfo: boolean;
  hasWorkHistory: boolean;
  hasEducation: boolean;
  hasSkills: boolean;
  estimatedPages: number;
}

export interface ResumeSection {
  title: string;
  content: string;
  startIndex: number;
  endIndex: number;
  wordCount: number;
  type: 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'certifications' | 'other';
}

export interface RoleInfo {
  primaryRole: string;
  industry: string;
  seniority: 'entry' | 'mid' | 'senior' | 'executive';
  confidence: number;
  alternativeRoles: string[];
}

export interface ExtractionStrategy {
  passOrder: string[]; // Order of extraction passes
  focusAreas: string[]; // Which areas to prioritize
  estimatedDuration: number; // Seconds
  recommendedModel: string;
  shouldUseFramework: boolean;
}

export interface PreExtractionContext {
  resumeStructure: ResumeStructure;
  roleInfo: RoleInfo | null;
  frameworkContext: FrameworkContext | null;
  extractionStrategy: ExtractionStrategy;
  metadata: {
    analyzedAt: Date;
    version: string;
  };
}

/**
 * Parse resume into logical sections
 */
export function parseResumeStructure(resumeText: string): ResumeStructure {
  console.log('📄 Parsing resume structure...');

  const sections: ResumeSection[] = [];
  const lines = resumeText.split('\n');

  // Common section headers (case-insensitive)
  const sectionPatterns = {
    contact: /^(contact|personal\s+info|address|email|phone)/i,
    summary: /^(summary|objective|profile|about|overview)/i,
    experience: /^(experience|work\s+history|employment|professional\s+experience|career)/i,
    education: /^(education|academic|qualifications|degrees)/i,
    skills: /^(skills|technical\s+skills|competencies|expertise|proficiencies)/i,
    certifications: /^(certifications?|licenses?|credentials)/i,
  };

  let currentSection: ResumeSection | null = null;
  let lineIndex = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    lineIndex++;

    // Check if this line is a section header
    let sectionType: ResumeSection['type'] | null = null;
    for (const [type, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(trimmedLine) && trimmedLine.length < 50) {
        sectionType = type as ResumeSection['type'];
        break;
      }
    }

    if (sectionType) {
      // Save previous section
      if (currentSection && currentSection.content.trim()) {
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        title: trimmedLine,
        content: '',
        startIndex: lineIndex,
        endIndex: lineIndex,
        wordCount: 0,
        type: sectionType,
      };
    } else if (currentSection) {
      // Add to current section
      currentSection.content += line + '\n';
      currentSection.endIndex = lineIndex;
    } else {
      // Before first section (probably contact info)
      if (!currentSection) {
        currentSection = {
          title: 'Header',
          content: line + '\n',
          startIndex: 0,
          endIndex: lineIndex,
          wordCount: 0,
          type: 'contact',
        };
      }
    }
  }

  // Add final section
  if (currentSection && currentSection.content.trim()) {
    sections.push(currentSection);
  }

  // Calculate word counts
  for (const section of sections) {
    section.wordCount = section.content.split(/\s+/).filter(w => w.length > 0).length;
  }

  const totalWordCount = sections.reduce((sum, s) => sum + s.wordCount, 0);
  const totalCharCount = resumeText.length;
  const estimatedPages = Math.ceil(totalWordCount / 300); // ~300 words per page

  const structure: ResumeStructure = {
    sections,
    totalWordCount,
    totalCharCount,
    hasContactInfo: sections.some(s => s.type === 'contact'),
    hasWorkHistory: sections.some(s => s.type === 'experience'),
    hasEducation: sections.some(s => s.type === 'education'),
    hasSkills: sections.some(s => s.type === 'skills'),
    estimatedPages,
  };

  console.log(`✅ Parsed ${sections.length} sections, ${totalWordCount} words, ~${estimatedPages} pages`);
  return structure;
}

/**
 * Detect primary role and industry from resume
 */
export function detectRoleAndIndustry(resumeText: string, resumeStructure: ResumeStructure): RoleInfo | null {
  console.log('🔍 Detecting role and industry...');

  // Find experience section
  const experienceSection = resumeStructure.sections.find(s => s.type === 'experience');
  if (!experienceSection) {
    console.warn('⚠️ No experience section found');
    return null;
  }

  // Extract job titles from experience section
  // Look for patterns like "Job Title | Company" or "Job Title at Company"
  const lines = experienceSection.content.split('\n');
  const jobTitlePatterns = [
    /^([A-Z][A-Za-z\s&-]+(?:Engineer|Manager|Director|Supervisor|Lead|Specialist|Analyst|Consultant|Developer|Designer|Coordinator))/,
    /^•?\s*([A-Z][A-Za-z\s&-]+(?:Engineer|Manager|Director|Supervisor|Lead|Specialist|Analyst|Consultant|Developer|Designer|Coordinator))/,
  ];

  const detectedTitles: string[] = [];
  for (const line of lines) {
    for (const pattern of jobTitlePatterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length > 5 && title.length < 60) {
          detectedTitles.push(title);
        }
      }
    }
  }

  if (detectedTitles.length === 0) {
    console.warn('⚠️ No job titles detected');
    return null;
  }

  // Use first (most recent) title as primary role
  const primaryRole = detectedTitles[0];

  // Infer industry from keywords
  const industryKeywords = {
    'Oil & Gas': ['drilling', 'oil', 'gas', 'petroleum', 'upstream', 'downstream', 'refinery', 'rig', 'well'],
    'Technology': ['software', 'developer', 'programmer', 'IT', 'cloud', 'data', 'AI', 'machine learning'],
    'Finance': ['financial', 'banking', 'investment', 'trading', 'portfolio', 'securities'],
    'Healthcare': ['medical', 'healthcare', 'hospital', 'clinical', 'patient', 'pharmaceutical'],
    'Manufacturing': ['manufacturing', 'production', 'operations', 'supply chain', 'quality control'],
    'Construction': ['construction', 'building', 'project', 'site', 'contractor', 'civil'],
  };

  let detectedIndustry = 'General';
  let maxMatches = 0;

  for (const [industry, keywords] of Object.entries(industryKeywords)) {
    const matches = keywords.filter(keyword =>
      resumeText.toLowerCase().includes(keyword.toLowerCase())
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      detectedIndustry = industry;
    }
  }

  // Infer seniority from title
  let seniority: RoleInfo['seniority'] = 'mid';
  const titleLower = primaryRole.toLowerCase();

  if (/chief|ceo|cfo|cto|vp|vice\s+president|executive/.test(titleLower)) {
    seniority = 'executive';
  } else if (/director|senior\s+manager|head\s+of/.test(titleLower)) {
    seniority = 'senior';
  } else if (/senior|lead|principal/.test(titleLower)) {
    seniority = 'senior';
  } else if (/junior|associate|assistant|entry/.test(titleLower)) {
    seniority = 'entry';
  }

  const roleInfo: RoleInfo = {
    primaryRole,
    industry: detectedIndustry,
    seniority,
    confidence: maxMatches > 2 ? 85 : 70,
    alternativeRoles: detectedTitles.slice(1, 4), // Next 3 titles
  };

  console.log(`✅ Detected: ${primaryRole} | ${detectedIndustry} | ${seniority} level (${roleInfo.confidence}% confidence)`);
  return roleInfo;
}

/**
 * Build extraction strategy based on context
 */
export function buildExtractionStrategy(
  resumeStructure: ResumeStructure,
  roleInfo: RoleInfo | null,
  frameworkContext: FrameworkContext | null
): ExtractionStrategy {
  console.log('📋 Building extraction strategy...');

  // Default pass order
  const passOrder = ['power_phrases', 'skills', 'competencies', 'soft_skills'];

  // Determine focus areas
  const focusAreas: string[] = [];

  if (frameworkContext?.framework?.managementBenchmarks.length) {
    focusAreas.push('management_scope');
  }

  if (roleInfo?.seniority === 'senior' || roleInfo?.seniority === 'executive') {
    focusAreas.push('leadership');
    focusAreas.push('strategic_thinking');
  }

  if (resumeStructure.totalWordCount > 1000) {
    focusAreas.push('comprehensive_extraction');
  }

  // Estimate duration based on resume complexity
  const baseTime = 30; // seconds
  const wordMultiplier = resumeStructure.totalWordCount / 500; // +1 per 500 words
  const sectionMultiplier = resumeStructure.sections.length / 5; // +1 per 5 sections
  const estimatedDuration = Math.round(baseTime + (wordMultiplier * 10) + (sectionMultiplier * 5));

  // Recommend model based on complexity
  let recommendedModel = 'gpt-3.5-turbo'; // Default
  if (resumeStructure.totalWordCount > 1500 || roleInfo?.seniority === 'executive') {
    recommendedModel = 'gpt-4'; // More complex resumes need better model
  }

  const shouldUseFramework = frameworkContext !== null && frameworkContext.confidence > 60;

  const strategy: ExtractionStrategy = {
    passOrder,
    focusAreas,
    estimatedDuration,
    recommendedModel,
    shouldUseFramework,
  };

  console.log(`✅ Strategy: ${passOrder.join(' → ')} | Focus: ${focusAreas.join(', ')} | Est: ${estimatedDuration}s`);
  return strategy;
}

/**
 * Main pre-extraction analysis
 */
export async function analyzePreExtraction(
  resumeText: string,
  targetRoles?: string[],
  targetIndustries?: string[]
): Promise<PreExtractionContext> {
  console.log('\n🚀 Starting pre-extraction analysis...');

  // Step 1: Parse resume structure
  const resumeStructure = parseResumeStructure(resumeText);

  // Step 2: Detect role and industry
  const detectedRoleInfo = detectRoleAndIndustry(resumeText, resumeStructure);

  // Use target role if provided, otherwise use detected
  const roleInfo: RoleInfo | null = targetRoles && targetRoles.length > 0
    ? {
        primaryRole: targetRoles[0],
        industry: targetIndustries?.[0] || detectedRoleInfo?.industry || 'General',
        seniority: detectedRoleInfo?.seniority || 'mid',
        confidence: 90,
        alternativeRoles: targetRoles.slice(1),
      }
    : detectedRoleInfo;

  // Step 3: Load competency framework
  let frameworkContext: FrameworkContext | null = null;
  if (roleInfo) {
    try {
      frameworkContext = await loadFrameworkContext({
        role: roleInfo.primaryRole,
        industry: roleInfo.industry,
      });
    } catch (error) {
      console.error('Failed to load framework:', error);
      frameworkContext = null;
    }
  }

  // Step 4: Build extraction strategy
  const extractionStrategy = buildExtractionStrategy(
    resumeStructure,
    roleInfo,
    frameworkContext
  );

  const context: PreExtractionContext = {
    resumeStructure,
    roleInfo,
    frameworkContext,
    extractionStrategy,
    metadata: {
      analyzedAt: new Date(),
      version: 'v3.0',
    },
  };

  console.log('\n✅ Pre-extraction analysis complete\n');
  return context;
}

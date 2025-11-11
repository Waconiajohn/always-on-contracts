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
 * Extract education data directly from resume (independent of role detection)
 */
export interface EducationData {
  level: string | null;
  field: string | null;
  certifications: string[];
}

export function extractEducationData(resumeText: string, resumeStructure: ResumeStructure): EducationData {
  console.log('🎓 Extracting education data independently...');
  
  const educationSection = resumeStructure.sections.find(s => s.type === 'education');
  const content = educationSection?.content || resumeText;
  const contentLower = content.toLowerCase();
  
  // Detect education level
  let level: string | null = null;
  if (/\b(phd|ph\.d\.|doctorate|doctoral)\b/i.test(content)) {
    level = 'PhD';
  } else if (/\b(master|m\.s\.|ms|mba|m\.a\.|ma|msc)\b/i.test(content)) {
    level = 'Master';
  } else if (/\b(bachelor|b\.s\.|bs|b\.a\.|ba|bsc|b\.eng|b\.tech)\b/i.test(content)) {
    level = 'Bachelor';
  } else if (/\b(associate|a\.s\.|as|a\.a\.|aa)\b/i.test(content)) {
    level = 'Associate';
  }
  
  // Detect field of study
  let field: string | null = null;
  const fieldPatterns = [
    /(?:bachelor|master|phd|doctorate|b\.s\.|m\.s\.|ph\.d\.)(?:\s+of\s+|\s+in\s+|\s+)([A-Z][A-Za-z\s&,-]+?)(?:\s*(?:from|at|,|\n|$))/i,
    /(?:degree|major)\s+in\s+([A-Z][A-Za-z\s&,-]+?)(?:\s*(?:from|at|,|\n|$))/i,
  ];
  
  for (const pattern of fieldPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      field = match[1].trim().replace(/\s+/g, ' ').slice(0, 100);
      break;
    }
  }
  
  // Detect certifications
  const certifications: string[] = [];
  const certPatterns = [
    /\b(PMP|PE|CPA|CFA|CISSP|PgMP|PMI-ACP|CSM|CSPO|AWS|Azure|GCP)\b/gi,
    /Professional Engineer\s*\(PE\)/gi,
    /Certified\s+[A-Z][A-Za-z\s]+/gi,
  ];
  
  for (const pattern of certPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const cert = match[0].trim();
      if (cert.length > 2 && cert.length < 50 && !certifications.includes(cert)) {
        certifications.push(cert);
      }
    }
  }
  
  console.log(`✅ Education extracted: ${level || 'None'} in ${field || 'Unknown'}, ${certifications.length} certifications`);
  
  return {
    level,
    field,
    certifications: certifications.slice(0, 5), // Limit to 5 most relevant
  };
}

/**
 * Detect primary role and industry from resume - NOW WITH ROBUST FALLBACKS
 */
export function detectRoleAndIndustry(resumeText: string, resumeStructure: ResumeStructure): RoleInfo {
  console.log('🔍 Detecting role and industry...');

  // Find experience section
  const experienceSection = resumeStructure.sections.find(s => s.type === 'experience');
  
  if (!experienceSection) {
    console.warn('⚠️ No experience section found - using fallback');
    return {
      primaryRole: 'Professional',
      industry: 'General',
      seniority: 'mid',
      confidence: 30,
      alternativeRoles: [],
    };
  }

  // ENHANCED job title patterns - now matches more formats
  const lines = experienceSection.content.split('\n');
  const jobTitlePatterns = [
    // Standard patterns with common titles
    /^([A-Z][A-Za-z\s&-]+(?:Engineer|Manager|Director|Supervisor|Lead|Specialist|Analyst|Consultant|Developer|Designer|Coordinator))/,
    /^•?\s*([A-Z][A-Za-z\s&-]+(?:Engineer|Manager|Director|Supervisor|Lead|Specialist|Analyst|Consultant|Developer|Designer|Coordinator))/,
    // Bullet point formats
    /^[\s•\-–*]+([A-Z][A-Za-z\s&-]+(?:Engineer|Manager|Director|Supervisor|Lead|Specialist|Analyst|Consultant|Developer|Designer))/,
    // Title with pipe separator
    /^([A-Z][A-Za-z\s&-]+?)\s*\|\s*[A-Z]/,
    // Title followed by company/dates
    /^([A-Z][A-Za-z\s&-]{5,40}?)\s*(?:\d{4}|January|February|March|April|May|June|July|August|September|October|November|December)/,
  ];

  const detectedTitles: string[] = [];
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length < 5 || trimmedLine.length > 100) continue;
    
    for (const pattern of jobTitlePatterns) {
      const match = trimmedLine.match(pattern);
      if (match && match[1]) {
        const title = match[1].trim();
        if (title.length > 5 && title.length < 60 && !detectedTitles.includes(title)) {
          detectedTitles.push(title);
        }
      }
    }
  }

  // FALLBACK: If no titles detected, extract any capitalized phrases that look like titles
  if (detectedTitles.length === 0) {
    console.warn('⚠️ No standard job titles detected - trying fallback extraction');
    const fallbackPattern = /^([A-Z][A-Za-z\s]{8,50}?)(?:\s*[\n|]|$)/gm;
    const matches = experienceSection.content.matchAll(fallbackPattern);
    for (const match of matches) {
      const title = match[1].trim();
      if (title.length > 8 && title.length < 60 && /[A-Z][a-z]+/.test(title)) {
        detectedTitles.push(title);
      }
    }
  }

  // FINAL FALLBACK: Use "Professional" if still nothing detected
  const primaryRole = detectedTitles.length > 0 ? detectedTitles[0] : 'Professional';
  
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

  const confidence = detectedTitles.length > 0 ? (maxMatches > 2 ? 85 : 70) : 40;

  const roleInfo: RoleInfo = {
    primaryRole,
    industry: detectedIndustry,
    seniority,
    confidence,
    alternativeRoles: detectedTitles.slice(1, 4),
  };

  console.log(`✅ Detected: ${primaryRole} | ${detectedIndustry} | ${seniority} level (${confidence}% confidence)`);
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

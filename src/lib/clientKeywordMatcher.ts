/**
 * Client-side keyword extraction and matching
 * For instant visual feedback while AI analysis runs
 */

export interface ExtractedKeywords {
  hardSkills: string[];
  softSkills: string[];
  jobTitles: string[];
  education: string[];
  other: string[];
}

export interface KeywordMatchResult {
  found: string[];
  missing: string[];
  matchPercentage: number;
}

// Common soft skills to look for
const SOFT_SKILLS = [
  'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving',
  'critical thinking', 'time management', 'adaptability', 'flexibility',
  'creativity', 'innovation', 'attention to detail', 'organization',
  'interpersonal', 'negotiation', 'presentation', 'mentoring', 'coaching',
  'decision-making', 'strategic thinking', 'analytical', 'project management',
  'stakeholder management', 'cross-functional', 'self-motivated', 'proactive'
];

// Common education keywords
const EDUCATION_TERMS = [
  'bachelor', 'master', 'phd', 'doctorate', 'mba', 'degree', 'certification',
  'certified', 'license', 'diploma', 'associate', 'bs', 'ba', 'ms', 'ma',
  'pmp', 'aws', 'scrum', 'agile', 'six sigma', 'cissp', 'cpa', 'cfa'
];

// Job title indicators
const TITLE_INDICATORS = [
  'manager', 'director', 'lead', 'senior', 'junior', 'engineer', 'developer',
  'analyst', 'specialist', 'coordinator', 'associate', 'executive', 'vp',
  'president', 'chief', 'head', 'architect', 'consultant', 'designer',
  'administrator', 'supervisor', 'officer', 'representative'
];

/**
 * Extract keywords from text, categorized by type
 */
export function extractKeywords(text: string): ExtractedKeywords {
  const words = text.toLowerCase();
  const result: ExtractedKeywords = {
    hardSkills: [],
    softSkills: [],
    jobTitles: [],
    education: [],
    other: []
  };

  // Extract soft skills
  for (const skill of SOFT_SKILLS) {
    if (words.includes(skill.toLowerCase())) {
      result.softSkills.push(skill);
    }
  }

  // Extract education terms
  for (const term of EDUCATION_TERMS) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(text)) {
      result.education.push(term);
    }
  }

  // Extract job titles (multi-word matching)
  for (const indicator of TITLE_INDICATORS) {
    const regex = new RegExp(`\\b(\\w+\\s+)?${indicator}(\\s+\\w+)?\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(m => {
        const cleaned = m.trim();
        if (cleaned.length > 3 && !result.jobTitles.includes(cleaned)) {
          result.jobTitles.push(cleaned);
        }
      });
    }
  }

  // Extract technical terms / hard skills (capitalized terms, tech patterns)
  const techPatterns = text.match(/\b[A-Z][A-Za-z+#.]+\b/g) || [];
  const programmingLanguages = text.match(/\b(python|javascript|typescript|java|c\+\+|c#|ruby|go|rust|swift|kotlin|sql|r\b|scala|php)/gi) || [];
  const frameworks = text.match(/\b(react|angular|vue|node|django|flask|spring|rails|express|next\.?js|gatsby)/gi) || [];
  const tools = text.match(/\b(aws|azure|gcp|docker|kubernetes|jenkins|git|jira|confluence|tableau|excel|salesforce|sap)/gi) || [];
  
  const hardSkills = new Set<string>();
  [...techPatterns, ...programmingLanguages, ...frameworks, ...tools].forEach(term => {
    const cleaned = term.trim();
    if (cleaned.length >= 2 && 
        !SOFT_SKILLS.some(s => s.toLowerCase() === cleaned.toLowerCase()) &&
        !EDUCATION_TERMS.some(e => e.toLowerCase() === cleaned.toLowerCase())) {
      hardSkills.add(cleaned);
    }
  });
  
  result.hardSkills = [...hardSkills].slice(0, 50); // Limit to prevent noise

  return result;
}

/**
 * Compare keywords between JD and resume
 */
export function matchKeywords(jdKeywords: ExtractedKeywords, resumeKeywords: ExtractedKeywords): {
  hardSkills: KeywordMatchResult;
  softSkills: KeywordMatchResult;
  education: KeywordMatchResult;
  overall: KeywordMatchResult;
} {
  const matchCategory = (jd: string[], resume: string[]): KeywordMatchResult => {
    const jdLower = jd.map(k => k.toLowerCase());
    const resumeLower = resume.map(k => k.toLowerCase());
    
    const found = jdLower.filter(k => resumeLower.some(r => r.includes(k) || k.includes(r)));
    const missing = jdLower.filter(k => !resumeLower.some(r => r.includes(k) || k.includes(r)));
    
    const matchPercentage = jdLower.length > 0 
      ? Math.round((found.length / jdLower.length) * 100) 
      : 100;

    return {
      found: found.map(k => jd.find(j => j.toLowerCase() === k) || k),
      missing: missing.map(k => jd.find(j => j.toLowerCase() === k) || k),
      matchPercentage
    };
  };

  const hardSkillsResult = matchCategory(jdKeywords.hardSkills, resumeKeywords.hardSkills);
  const softSkillsResult = matchCategory(jdKeywords.softSkills, resumeKeywords.softSkills);
  const educationResult = matchCategory(jdKeywords.education, resumeKeywords.education);

  // Calculate weighted overall
  const totalJD = jdKeywords.hardSkills.length + jdKeywords.softSkills.length + jdKeywords.education.length;
  const totalFound = hardSkillsResult.found.length + softSkillsResult.found.length + educationResult.found.length;

  return {
    hardSkills: hardSkillsResult,
    softSkills: softSkillsResult,
    education: educationResult,
    overall: {
      found: [...hardSkillsResult.found, ...softSkillsResult.found, ...educationResult.found],
      missing: [...hardSkillsResult.missing, ...softSkillsResult.missing, ...educationResult.missing],
      matchPercentage: totalJD > 0 ? Math.round((totalFound / totalJD) * 100) : 100
    }
  };
}

/**
 * Quick client-side score estimate
 */
export function estimateQuickScore(resumeText: string, jobDescription: string): number {
  if (!resumeText || !jobDescription || resumeText.length < 50 || jobDescription.length < 30) {
    return 0;
  }

  const jdKeywords = extractKeywords(jobDescription);
  const resumeKeywords = extractKeywords(resumeText);
  const match = matchKeywords(jdKeywords, resumeKeywords);

  // Weighted: Hard skills 50%, Soft skills 30%, Education 20%
  const score = 
    (match.hardSkills.matchPercentage * 0.5) +
    (match.softSkills.matchPercentage * 0.3) +
    (match.education.matchPercentage * 0.2);

  return Math.round(score);
}

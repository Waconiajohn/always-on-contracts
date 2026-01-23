/**
 * Gap Section Matcher
 * Maps gaps to applicable resume sections for context-aware filtering
 */

import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";

export type FocusedSectionType = 
  | 'summary' 
  | `experience-${number}` 
  | 'skills' 
  | 'education' 
  | null;

// Type definitions for gap/strength with sections (exported for potential future use)
export interface GapWithSection {
  gap: FitAnalysisResult["gaps"][0];
  applicableSections: FocusedSectionType[];
}

export interface StrengthWithSection {
  strength: FitAnalysisResult["strengths"][0];
  applicableSections: FocusedSectionType[];
}

// Keywords that indicate a gap is related to summary/positioning
const SUMMARY_KEYWORDS = [
  'summary', 'profile', 'objective', 'positioning', 'communication',
  'leadership', 'strategic', 'vision', 'direction', 'executive'
];

// Keywords that indicate a skill-based gap
const SKILL_KEYWORDS = [
  'skill', 'proficiency', 'expertise', 'knowledge', 'experience with',
  'familiar with', 'certified', 'certification'
];

// Keywords that indicate education-related gaps
const EDUCATION_KEYWORDS = [
  'degree', 'education', 'certification', 'certified', 'bachelor',
  'master', 'phd', 'diploma', 'training', 'course'
];

/**
 * Tokenize text into searchable words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

/**
 * Calculate word overlap between two texts
 */
function calculateOverlap(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  
  let matches = 0;
  tokens1.forEach(token => {
    if (tokens2.has(token)) matches++;
  });
  
  return tokens1.size > 0 ? matches / tokens1.size : 0;
}

/**
 * Check if text contains any of the keywords
 */
function containsKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw));
}

/**
 * Map a gap to applicable resume sections
 */
export function mapGapToSections(
  gap: FitAnalysisResult["gaps"][0],
  resume: OptimizedResume
): FocusedSectionType[] {
  const sections: FocusedSectionType[] = [];
  const gapText = `${gap.requirement} ${gap.suggestion}`.toLowerCase();
  
  // Check for summary relevance
  if (containsKeywords(gapText, SUMMARY_KEYWORDS)) {
    sections.push('summary');
  }
  
  // Check for skills relevance
  if (containsKeywords(gapText, SKILL_KEYWORDS) || 
      gap.requirement.split(' ').length <= 3) {
    sections.push('skills');
  }
  
  // Check for education relevance
  if (containsKeywords(gapText, EDUCATION_KEYWORDS)) {
    sections.push('education');
  }
  
  // Check for experience relevance - find which experiences match
  resume.experience.forEach((exp, idx) => {
    const expText = `${exp.title} ${exp.company} ${exp.bullets.join(' ')}`;
    const overlap = calculateOverlap(gap.requirement, expText);
    
    // If there's meaningful overlap or if the gap is general (applies to all)
    if (overlap > 0.2 || sections.length === 0) {
      sections.push(`experience-${idx}` as FocusedSectionType);
    }
  });
  
  // If nothing matched, this gap applies everywhere
  if (sections.length === 0) {
    sections.push('summary');
    resume.experience.forEach((_, idx) => {
      sections.push(`experience-${idx}` as FocusedSectionType);
    });
    sections.push('skills');
  }
  
  return sections;
}

/**
 * Map a strength to applicable resume sections
 */
export function mapStrengthToSections(
  strength: FitAnalysisResult["strengths"][0],
  resume: OptimizedResume
): FocusedSectionType[] {
  const sections: FocusedSectionType[] = [];
  const strengthText = `${strength.requirement} ${strength.evidence}`.toLowerCase();
  
  // Check for summary relevance
  if (containsKeywords(strengthText, SUMMARY_KEYWORDS) ||
      strength.evidence.toLowerCase().includes('summary')) {
    sections.push('summary');
  }
  
  // Check experience match by evidence text
  resume.experience.forEach((exp, idx) => {
    const expText = `${exp.title} ${exp.company} ${exp.bullets.join(' ')}`;
    if (calculateOverlap(strength.evidence, expText) > 0.15) {
      sections.push(`experience-${idx}` as FocusedSectionType);
    }
  });
  
  // Check skills match
  const skillMatches = resume.skills.some(skill => 
    strengthText.includes(skill.toLowerCase())
  );
  if (skillMatches) {
    sections.push('skills');
  }
  
  return sections;
}

/**
 * Get all gaps applicable to a focused section
 */
export function getGapsForSection(
  focusedSection: FocusedSectionType,
  fitAnalysis: FitAnalysisResult,
  resume: OptimizedResume
): FitAnalysisResult["gaps"] {
  if (!focusedSection) {
    return fitAnalysis.gaps;
  }
  
  return fitAnalysis.gaps.filter(gap => {
    const applicableSections = mapGapToSections(gap, resume);
    return applicableSections.includes(focusedSection);
  });
}

/**
 * Get partial matches applicable to a focused section
 */
export function getPartialMatchesForSection(
  focusedSection: FocusedSectionType,
  fitAnalysis: FitAnalysisResult,
  resume: OptimizedResume
): FitAnalysisResult["strengths"] {
  if (!focusedSection) {
    return fitAnalysis.strengths.filter(s => s.strength_level === "moderate");
  }
  
  return fitAnalysis.strengths
    .filter(s => s.strength_level === "moderate")
    .filter(strength => {
      const applicableSections = mapStrengthToSections(strength, resume);
      return applicableSections.includes(focusedSection);
    });
}

/**
 * Get missing keywords relevant to a focused section
 */
export function getKeywordsForSection(
  focusedSection: FocusedSectionType,
  fitAnalysis: FitAnalysisResult,
  resume: OptimizedResume
): { matched: string[]; missing: string[] } {
  const allMatched = fitAnalysis.keywords_found;
  const allMissing = fitAnalysis.keywords_missing;
  
  if (!focusedSection) {
    return { matched: allMatched, missing: allMissing };
  }
  
  // For skills section, show all keywords
  if (focusedSection === 'skills') {
    return { matched: allMatched, missing: allMissing };
  }
  
  // For experience sections, filter to keywords that might appear in that context
  if (focusedSection.startsWith('experience-')) {
    const expIndex = parseInt(focusedSection.split('-')[1]);
    const exp = resume.experience[expIndex];
    if (!exp) return { matched: [], missing: allMissing };
    
    const expText = `${exp.title} ${exp.company} ${exp.bullets.join(' ')}`.toLowerCase();
    
    const matchedInExp = allMatched.filter(kw => expText.includes(kw.toLowerCase()));
    // For missing, prioritize technical/skill keywords that could fit in bullets
    const relevantMissing = allMissing.filter(kw => 
      kw.split(' ').length <= 3 // Short, likely skills
    );
    
    return { matched: matchedInExp, missing: relevantMissing };
  }
  
  // For summary, show high-level keywords
  if (focusedSection === 'summary') {
    return { matched: allMatched.slice(0, 5), missing: allMissing.slice(0, 5) };
  }
  
  return { matched: allMatched, missing: allMissing };
}

/**
 * Get section display name
 */
export function getSectionDisplayName(
  focusedSection: FocusedSectionType,
  resume: OptimizedResume
): string {
  if (!focusedSection) return 'All Sections';
  
  if (focusedSection === 'summary') return 'Professional Summary';
  if (focusedSection === 'skills') return 'Skills';
  if (focusedSection === 'education') return 'Education';
  
  if (focusedSection.startsWith('experience-')) {
    const expIndex = parseInt(focusedSection.split('-')[1]);
    const exp = resume.experience[expIndex];
    if (exp) {
      return `${exp.title} at ${exp.company}`;
    }
  }
  
  return 'Resume Section';
}

/**
 * Parse experience dates to extract years
 */
export function parseExperienceDates(dates: string): { startYear: number | null; endYear: number | null; isPresent: boolean } {
  const currentYear = new Date().getFullYear();
  const presentKeywords = ['present', 'current', 'now', 'ongoing'];
  const isPresent = presentKeywords.some(kw => dates.toLowerCase().includes(kw));
  
  // Extract years from the date string
  const yearMatches = dates.match(/\b(19|20)\d{2}\b/g);
  
  if (!yearMatches || yearMatches.length === 0) {
    return { startYear: null, endYear: isPresent ? currentYear : null, isPresent };
  }
  
  const years = yearMatches.map(y => parseInt(y)).sort((a, b) => a - b);
  
  return {
    startYear: years[0] || null,
    endYear: isPresent ? currentYear : (years[years.length - 1] || null),
    isPresent
  };
}

/**
 * Get recency status for an experience
 */
export function getRecencyStatus(dates: string): 'recent' | 'dated' | 'stale' {
  const currentYear = new Date().getFullYear();
  const { endYear } = parseExperienceDates(dates);
  
  if (!endYear) return 'dated';
  
  const yearsAgo = currentYear - endYear;
  
  if (yearsAgo <= 3) return 'recent';
  if (yearsAgo <= 7) return 'dated';
  return 'stale';
}

/**
 * Find more recent applicable experiences for a skill
 */
export function findMoreRecentExperiences(
  currentExpIndex: number,
  bulletText: string,
  resume: OptimizedResume
): Array<{ index: number; title: string; company: string; dates: string; recency: 'recent' | 'dated' | 'stale' }> {
  const currentDates = parseExperienceDates(resume.experience[currentExpIndex]?.dates || '');
  
  return resume.experience
    .map((exp, idx) => ({
      index: idx,
      title: exp.title,
      company: exp.company,
      dates: exp.dates,
      recency: getRecencyStatus(exp.dates),
      relevance: calculateOverlap(bulletText, `${exp.title} ${exp.bullets.join(' ')}`)
    }))
    .filter(exp => {
      // Must be more recent
      const expDates = parseExperienceDates(exp.dates);
      const isMoreRecent = (expDates.endYear || 0) > (currentDates.endYear || 0);
      
      // Must be at least somewhat relevant
      const isRelevant = exp.relevance > 0.1 || exp.index === 0; // Most recent job always included
      
      return exp.index !== currentExpIndex && isMoreRecent && isRelevant;
    })
    .sort((a, b) => {
      // Sort by recency first, then by relevance
      const recencyOrder = { recent: 0, dated: 1, stale: 2 };
      if (recencyOrder[a.recency] !== recencyOrder[b.recency]) {
        return recencyOrder[a.recency] - recencyOrder[b.recency];
      }
      return b.relevance - a.relevance;
    });
}

/**
 * Enhanced ATS (Applicant Tracking System) Compliance Checker
 * Provides deterministic, instant analysis of resume text for ATS compatibility issues
 */

export interface ATSIssue {
  type: 'error' | 'warning' | 'info';
  category: 'format' | 'content' | 'structure';
  issue: string;
  fix: string;
  autoFixable: boolean;
  location?: string;
}

export interface ATSAnalysis {
  score: number;
  issues: ATSIssue[];
  passedChecks: string[];
}

/**
 * Detect table-like formatting that ATS cannot parse
 */
export function detectTables(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];

  // Check for pipe-separated tables
  if (/\|.*\|.*\|/m.test(text)) {
    issues.push({
      type: 'error',
      category: 'format',
      issue: 'Table formatting detected (pipe characters)',
      fix: 'Convert table to bullet points or plain text list',
      autoFixable: true,
    });
  }

  // Check for tab-separated columns
  if (/\t{2,}/.test(text)) {
    issues.push({
      type: 'warning',
      category: 'format',
      issue: 'Multiple tab characters detected (possible table)',
      fix: 'Use single spaces or line breaks instead of tabs',
      autoFixable: true,
    });
  }

  // Check for aligned columns using excessive spacing
  if (/\s{10,}[A-Za-z]/.test(text)) {
    issues.push({
      type: 'warning',
      category: 'format',
      issue: 'Multi-column layout detected',
      fix: 'Use single-column layout for better ATS parsing',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Detect unusual or creative section headings
 */
export function detectUnusualHeadings(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];
  
  const standardHeadings = [
    'experience', 'work experience', 'professional experience', 'employment',
    'education', 'academic', 'qualifications',
    'skills', 'technical skills', 'core competencies', 'competencies',
    'summary', 'professional summary', 'objective', 'profile',
    'certifications', 'licenses', 'credentials',
    'projects', 'achievements', 'accomplishments',
    'awards', 'honors', 'publications', 'languages',
  ];

  // Find potential headings (lines that are short, possibly all caps or title case)
  const lines = text.split('\n');
  const potentialHeadings = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 2 && 
           trimmed.length < 50 && 
           (trimmed === trimmed.toUpperCase() || /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(trimmed));
  });

  for (const heading of potentialHeadings) {
    const normalized = heading.trim().toLowerCase();
    const isStandard = standardHeadings.some(std => 
      normalized.includes(std) || std.includes(normalized)
    );
    
    if (!isStandard && heading.length < 30) {
      // Check if it might be a creative heading
      const creativePatterns = [
        /what i.?ve done/i,
        /my journey/i,
        /career story/i,
        /where i.?ve been/i,
        /expertise/i,
        /toolbox/i,
        /superpowers/i,
      ];
      
      if (creativePatterns.some(p => p.test(heading))) {
        issues.push({
          type: 'warning',
          category: 'structure',
          issue: `Creative heading "${heading.trim()}" may confuse ATS`,
          fix: 'Use standard headings like "Experience", "Skills", "Education"',
          autoFixable: false,
          location: heading.trim(),
        });
      }
    }
  }

  return issues;
}

/**
 * Detect missing dates in experience/education sections
 */
export function detectMissingDates(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];

  // Check if there are date patterns in the text
  const datePatterns = [
    /\b(19|20)\d{2}\b/,                          // Year only: 2020
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*(19|20)\d{2}\b/i,  // Month Year
    /\b\d{1,2}\/\d{4}\b/,                        // MM/YYYY
    /\bPresent\b/i,                              // "Present"
    /\bCurrent\b/i,                              // "Current"
  ];

  const hasExperienceSection = /experience|employment|work history/i.test(text);
  const hasEducationSection = /education|academic|degree/i.test(text);
  const hasAnyDates = datePatterns.some(p => p.test(text));

  if ((hasExperienceSection || hasEducationSection) && !hasAnyDates) {
    issues.push({
      type: 'warning',
      category: 'content',
      issue: 'No date patterns found in experience/education sections',
      fix: 'Add date ranges (e.g., "Jan 2020 - Present") to each position',
      autoFixable: false,
    });
  }

  // Check for positions without dates
  const positionPatterns = /^[\w\s]+(?:at|@|,)\s*[\w\s]+$/gm;
  const positions = text.match(positionPatterns) || [];
  
  for (const position of positions.slice(0, 5)) {
    const lineIndex = text.indexOf(position);
    const surroundingText = text.slice(Math.max(0, lineIndex - 100), lineIndex + position.length + 100);
    
    if (!datePatterns.some(p => p.test(surroundingText))) {
      issues.push({
        type: 'info',
        category: 'content',
        issue: 'Position may be missing date range',
        fix: 'Ensure each role has start and end dates',
        autoFixable: false,
        location: position.slice(0, 50),
      });
      break; // Only report once
    }
  }

  return issues;
}

/**
 * Detect overlong bullet points that may get truncated
 */
export function detectOverlongBullets(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];

  // Find lines that start with bullet characters
  const bulletPatterns = /^[\s]*[•\-\*\u2022\u2023\u25E6\u2043]\s*.+$/gm;
  const bullets = text.match(bulletPatterns) || [];

  const overlongBullets: string[] = [];
  const MAX_BULLET_LENGTH = 180;

  for (const bullet of bullets) {
    if (bullet.trim().length > MAX_BULLET_LENGTH) {
      overlongBullets.push(bullet.trim().slice(0, 50) + '...');
    }
  }

  if (overlongBullets.length > 0) {
    issues.push({
      type: 'warning',
      category: 'content',
      issue: `${overlongBullets.length} bullet point(s) exceed 180 characters`,
      fix: 'Split long bullets into multiple shorter points for readability',
      autoFixable: true,
      location: overlongBullets[0],
    });
  }

  return issues;
}

/**
 * Detect special characters that may cause parsing issues
 */
export function detectSpecialCharacters(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];

  const specialChars = text.match(/[★☆●◆■□▪▫→←↑↓⚫⚪✓✗✔✘♦♢⬤◯]/g);
  if (specialChars && specialChars.length > 3) {
    issues.push({
      type: 'warning',
      category: 'format',
      issue: `Special symbols detected (${[...new Set(specialChars)].join(' ')})`,
      fix: 'Replace special symbols with standard bullets (• or -)',
      autoFixable: true,
    });
  }

  // Check for smart quotes
  if (/[""'']/g.test(text)) {
    issues.push({
      type: 'info',
      category: 'format',
      issue: 'Smart quotes detected',
      fix: 'Replace smart quotes with straight quotes for better compatibility',
      autoFixable: true,
    });
  }

  return issues;
}

/**
 * Detect missing contact information
 */
export function detectMissingContactInfo(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];

  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasLinkedIn = /linkedin\.com|linkedin/i.test(text);

  if (!hasEmail) {
    issues.push({
      type: 'error',
      category: 'content',
      issue: 'No email address found',
      fix: 'Add your email address in the contact section',
      autoFixable: false,
    });
  }

  if (!hasPhone) {
    issues.push({
      type: 'warning',
      category: 'content',
      issue: 'No phone number found',
      fix: 'Add your phone number in the contact section',
      autoFixable: false,
    });
  }

  if (!hasLinkedIn) {
    issues.push({
      type: 'info',
      category: 'content',
      issue: 'No LinkedIn profile detected',
      fix: 'Consider adding your LinkedIn URL',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Detect missing standard sections
 */
export function detectMissingSections(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];
  const upperText = text.toUpperCase();

  const requiredSections = [
    { patterns: ['EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT'], name: 'Experience/Work History' },
    { patterns: ['EDUCATION', 'DEGREE', 'UNIVERSITY', 'COLLEGE'], name: 'Education' },
    { patterns: ['SKILLS', 'TECHNICAL', 'COMPETENC'], name: 'Skills' },
  ];

  const missingSections: string[] = [];

  for (const section of requiredSections) {
    const found = section.patterns.some(p => upperText.includes(p));
    if (!found) {
      missingSections.push(section.name);
    }
  }

  if (missingSections.length > 0) {
    issues.push({
      type: 'warning',
      category: 'structure',
      issue: `Missing standard sections: ${missingSections.join(', ')}`,
      fix: 'Include clearly labeled sections for Experience, Education, and Skills',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Check resume length
 */
export function checkResumeLength(text: string): ATSIssue[] {
  const issues: ATSIssue[] = [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 150) {
    issues.push({
      type: 'warning',
      category: 'content',
      issue: `Resume appears too short (${wordCount} words)`,
      fix: 'Aim for 300-700 words with detailed achievements',
      autoFixable: false,
    });
  } else if (wordCount > 1000) {
    issues.push({
      type: 'info',
      category: 'content',
      issue: `Resume may be too long (${wordCount} words)`,
      fix: 'Consider condensing to 1-2 pages for most roles',
      autoFixable: false,
    });
  }

  return issues;
}

/**
 * Run all ATS checks and return comprehensive analysis
 */
export function runATSAnalysis(text: string): ATSAnalysis {
  if (!text || text.length < 50) {
    return {
      score: 0,
      issues: [],
      passedChecks: [],
    };
  }

  const allIssues: ATSIssue[] = [
    ...detectTables(text),
    ...detectUnusualHeadings(text),
    ...detectMissingDates(text),
    ...detectOverlongBullets(text),
    ...detectSpecialCharacters(text),
    ...detectMissingContactInfo(text),
    ...detectMissingSections(text),
    ...checkResumeLength(text),
  ];

  // Calculate score
  let score = 100;
  for (const issue of allIssues) {
    switch (issue.type) {
      case 'error':
        score -= 15;
        break;
      case 'warning':
        score -= 8;
        break;
      case 'info':
        score -= 3;
        break;
    }
  }
  score = Math.max(0, Math.min(100, score));

  // Determine passed checks
  const passedChecks: string[] = [];
  
  if (!detectTables(text).length) {
    passedChecks.push('No tables or complex layouts');
  }
  if (!detectSpecialCharacters(text).length) {
    passedChecks.push('Standard characters only');
  }
  if (!detectMissingSections(text).length) {
    passedChecks.push('All standard sections present');
  }
  if (detectMissingContactInfo(text).filter(i => i.type === 'error').length === 0) {
    passedChecks.push('Contact information found');
  }
  
  const lengthIssues = checkResumeLength(text);
  if (!lengthIssues.length) {
    passedChecks.push('Appropriate resume length');
  }

  return {
    score,
    issues: allIssues,
    passedChecks,
  };
}

/**
 * Auto-fix functions for fixable issues
 */
export function autoFixTables(text: string): string {
  // Replace pipe tables with bullet points
  let fixed = text.replace(/\|([^|]+)\|([^|]+)\|/g, (_, col1, col2) => {
    return `• ${col1.trim()}: ${col2.trim()}`;
  });

  // Replace multiple tabs with single space
  fixed = fixed.replace(/\t{2,}/g, ' ');

  return fixed;
}

export function autoFixSpecialCharacters(text: string): string {
  // Replace special bullets with standard ones
  let fixed = text.replace(/[★☆●◆■□▪▫⬤◯]/g, '•');
  
  // Replace arrow characters
  fixed = fixed.replace(/[→←↑↓]/g, '-');
  
  // Replace checkmarks with [x]
  fixed = fixed.replace(/[✓✔]/g, '[x]');
  fixed = fixed.replace(/[✗✘]/g, '[ ]');
  
  // Replace smart quotes
  fixed = fixed.replace(/[""]/g, '"');
  fixed = fixed.replace(/['']/g, "'");

  return fixed;
}

export function autoFixOverlongBullets(text: string): string {
  const lines = text.split('\n');
  const MAX_LENGTH = 180;

  const fixedLines = lines.map(line => {
    const bulletMatch = line.match(/^([\s]*[•\-\*]\s*)/);
    if (!bulletMatch || line.length <= MAX_LENGTH) {
      return line;
    }

    const prefix = bulletMatch[1];
    const content = line.slice(prefix.length);
    
    // Split at sentence boundaries or commas
    const parts = content.split(/(?<=[.;,])\s+/);
    if (parts.length <= 1) return line;

    // Rebuild as multiple bullets
    const rebuilt: string[] = [];
    let current = '';
    
    for (const part of parts) {
      if ((current + ' ' + part).length > MAX_LENGTH - prefix.length && current) {
        rebuilt.push(prefix + current.trim());
        current = part;
      } else {
        current = current ? current + ' ' + part : part;
      }
    }
    if (current) {
      rebuilt.push(prefix + current.trim());
    }

    return rebuilt.join('\n');
  });

  return fixedLines.join('\n');
}

/**
 * Apply all auto-fixes to text
 */
export function autoFixAll(text: string): string {
  let fixed = text;
  fixed = autoFixTables(fixed);
  fixed = autoFixSpecialCharacters(fixed);
  fixed = autoFixOverlongBullets(fixed);
  return fixed;
}

/**
 * Get ATS score badge info
 */
export function getATSScoreBadge(score: number): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (score >= 85) return { label: 'Excellent', variant: 'default' };
  if (score >= 70) return { label: 'Good', variant: 'default' };
  if (score >= 50) return { label: 'Fair', variant: 'secondary' };
  return { label: 'Needs Work', variant: 'destructive' };
}

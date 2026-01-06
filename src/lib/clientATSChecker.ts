import { ClientATSIssue } from '@/components/resume-match/types';

/**
 * Client-side ATS compliance checker
 * Runs instantly without API calls
 */
export function checkATSCompliance(resumeText: string): ClientATSIssue[] {
  const issues: ClientATSIssue[] = [];

  if (!resumeText || resumeText.length < 50) {
    return issues;
  }

  // Check for tables (common ATS killer)
  if (/\|.*\|.*\|/m.test(resumeText) || /\t{2,}/.test(resumeText)) {
    issues.push({
      type: 'error',
      category: 'format',
      issue: 'Table-like formatting detected',
      fix: 'Use simple bullet points instead of tables or columns'
    });
  }

  // Check for multi-column layout indicators
  if (/\s{10,}[A-Za-z]/.test(resumeText)) {
    issues.push({
      type: 'warning',
      category: 'format',
      issue: 'Possible multi-column layout detected',
      fix: 'Use a single-column layout for better ATS parsing'
    });
  }

  // Check for special characters that may cause issues
  const specialChars = resumeText.match(/[★☆●◆■□▪▫→←↑↓⚫⚪✓✗✔✘]/g);
  if (specialChars && specialChars.length > 3) {
    issues.push({
      type: 'warning',
      category: 'format',
      issue: `Special symbols detected (${[...new Set(specialChars)].join(' ')})`,
      fix: 'Replace special symbols with standard bullets (• or -)'
    });
  }

  // Check for header/footer patterns
  if (/page\s*\d+\s*(of\s*\d+)?/i.test(resumeText)) {
    issues.push({
      type: 'info',
      category: 'format',
      issue: 'Page number detected',
      fix: 'Remove page numbers - they can confuse ATS parsing'
    });
  }

  // Check for graphics/image references
  if (/\[image\]|\[photo\]|\[logo\]|\.png|\.jpg|\.jpeg|\.gif/i.test(resumeText)) {
    issues.push({
      type: 'error',
      category: 'format',
      issue: 'Image reference detected',
      fix: 'Remove images and graphics - ATS cannot read them'
    });
  }

  // Check for missing contact info sections
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText);
  const hasPhone = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(resumeText);
  
  if (!hasEmail) {
    issues.push({
      type: 'error',
      category: 'content',
      issue: 'No email address found',
      fix: 'Add your email address in the contact section'
    });
  }

  if (!hasPhone) {
    issues.push({
      type: 'warning',
      category: 'content',
      issue: 'No phone number found',
      fix: 'Add your phone number in the contact section'
    });
  }

  // Check for missing key sections
  const sections = resumeText.toUpperCase();
  const missingSections: string[] = [];
  
  if (!/(EXPERIENCE|WORK HISTORY|EMPLOYMENT)/.test(sections)) {
    missingSections.push('Experience/Work History');
  }
  if (!/(EDUCATION|DEGREE|UNIVERSITY|COLLEGE)/.test(sections)) {
    missingSections.push('Education');
  }
  if (!/(SKILLS|TECHNICAL|COMPETENC)/.test(sections)) {
    missingSections.push('Skills');
  }

  if (missingSections.length > 0) {
    issues.push({
      type: 'warning',
      category: 'structure',
      issue: `Missing standard sections: ${missingSections.join(', ')}`,
      fix: 'Include clearly labeled sections for Experience, Education, and Skills'
    });
  }

  // Check resume length
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 150) {
    issues.push({
      type: 'warning',
      category: 'content',
      issue: `Resume appears too short (${wordCount} words)`,
      fix: 'Aim for 300-700 words with detailed achievements'
    });
  } else if (wordCount > 1000) {
    issues.push({
      type: 'info',
      category: 'content',
      issue: `Resume may be too long (${wordCount} words)`,
      fix: 'Consider condensing to 1-2 pages for most roles'
    });
  }

  // Check for all caps abuse
  const allCapsWords = resumeText.match(/\b[A-Z]{6,}\b/g);
  if (allCapsWords && allCapsWords.length > 10) {
    issues.push({
      type: 'info',
      category: 'format',
      issue: 'Excessive use of ALL CAPS',
      fix: 'Use title case for headings - all caps can appear aggressive'
    });
  }

  // Check for acronyms without explanation
  const acronyms = resumeText.match(/\b[A-Z]{2,4}\b/g);
  if (acronyms && acronyms.length > 15) {
    issues.push({
      type: 'info',
      category: 'content',
      issue: 'Many acronyms detected',
      fix: 'Spell out important acronyms at least once for ATS keyword matching'
    });
  }

  return issues;
}

/**
 * Calculate an overall ATS compliance score (0-100)
 */
export function calculateATSScore(issues: ClientATSIssue[]): number {
  let score = 100;
  
  for (const issue of issues) {
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
  
  return Math.max(0, Math.min(100, score));
}

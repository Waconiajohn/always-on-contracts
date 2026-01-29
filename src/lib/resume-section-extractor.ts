/**
 * Resume Section Extractor
 * 
 * Extracts section-specific content from parsed resume JSON
 */

interface ParsedExperience {
  title?: string;
  company?: string;
  dates?: string;
  bullets?: string[];
}

interface ParsedEducation {
  degree?: string;
  institution?: string;
  year?: string;
  details?: string[];
}

interface ParsedResume {
  summary?: string;
  skills?: string[];
  experience?: ParsedExperience[];
  education?: ParsedEducation[];
  certifications?: string[];
}

export function extractSectionContent(parsedJson: unknown, sectionName: string): string {
  if (!parsedJson || typeof parsedJson !== 'object') return '';
  
  const resume = parsedJson as ParsedResume;
  
  switch (sectionName) {
    case 'summary':
      return resume.summary || '';
      
    case 'skills':
      // Extract skills as bullet list
      const skills = resume.skills || [];
      if (skills.length === 0) return '';
      return skills.map(s => `• ${s}`).join('\n');
      
    case 'experience':
      // Extract work experience with headers and bullets
      const experience = resume.experience || [];
      if (experience.length === 0) return '';
      
      return experience.map(exp => {
        const parts: string[] = [];
        
        // Build header line
        const header = [exp.title, exp.company, exp.dates]
          .filter(Boolean)
          .join(' | ');
        if (header) parts.push(header);
        
        // Add bullets
        const bullets = exp.bullets || [];
        bullets.forEach(b => {
          parts.push(`• ${b}`);
        });
        
        return parts.join('\n');
      }).join('\n\n');
      
    case 'education':
      // Extract education entries
      const education = resume.education || [];
      const certifications = resume.certifications || [];
      
      const educationLines = education.map(edu => {
        const parts: string[] = [];
        const header = [edu.degree, edu.institution, edu.year]
          .filter(Boolean)
          .join(' - ');
        if (header) parts.push(header);
        
        // Add any details
        const details = edu.details || [];
        details.forEach(d => parts.push(`• ${d}`));
        
        return parts.join('\n');
      });
      
      // Add certifications if any
      if (certifications.length > 0) {
        educationLines.push('\nCertifications:');
        certifications.forEach(c => educationLines.push(`• ${c}`));
      }
      
      return educationLines.join('\n');
      
    default:
      return '';
  }
}

/**
 * Map section names to evidence categories for filtering
 */
export const SECTION_EVIDENCE_CATEGORIES: Record<string, string[]> = {
  summary: ['skill', 'domain', 'leadership', 'metric'],
  skills: ['skill', 'tool', 'domain', 'certification'],
  experience: ['responsibility', 'metric', 'leadership', 'achievement'],
  education: ['domain', 'skill', 'certification'],
};

/**
 * Get evidence categories relevant to a section
 */
export function getRelevantCategories(sectionName: string): string[] {
  return SECTION_EVIDENCE_CATEGORIES[sectionName] || [];
}

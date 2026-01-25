/**
 * Template-specific formatting logic for resume exports
 * Applies different formatting rules based on selected template
 */

import type { RBVersion } from '@/types/resume-builder';

export type TemplateId = 'executive' | 'standard' | 'ats-safe';

interface TemplateConfig {
  maxBulletsPerPosition: number;
  maxSummaryLength: number;
  skillsFormat: 'bullets' | 'comma-separated' | 'categorized';
  bulletPrefix: string;
  useHeadingCase: 'upper' | 'title' | 'normal';
  allowFormatting: boolean;
  maxPages: number;
}

const TEMPLATE_CONFIGS: Record<TemplateId, TemplateConfig> = {
  executive: {
    maxBulletsPerPosition: 3,
    maxSummaryLength: 200, // ~2 sentences
    skillsFormat: 'comma-separated',
    bulletPrefix: '•',
    useHeadingCase: 'upper',
    allowFormatting: true,
    maxPages: 1,
  },
  standard: {
    maxBulletsPerPosition: 8,
    maxSummaryLength: 500,
    skillsFormat: 'categorized',
    bulletPrefix: '•',
    useHeadingCase: 'upper',
    allowFormatting: true,
    maxPages: 2,
  },
  'ats-safe': {
    maxBulletsPerPosition: 6,
    maxSummaryLength: 400,
    skillsFormat: 'comma-separated',
    bulletPrefix: '-',
    useHeadingCase: 'upper',
    allowFormatting: false,
    maxPages: 2,
  },
};

interface FormattedSection {
  title: string;
  content: string;
  bullets: string[];
}

/**
 * Get template configuration
 */
export function getTemplateConfig(templateId: TemplateId): TemplateConfig {
  return TEMPLATE_CONFIGS[templateId];
}

/**
 * Format heading based on template rules
 */
function formatHeading(heading: string, caseStyle: 'upper' | 'title' | 'normal'): string {
  switch (caseStyle) {
    case 'upper':
      return heading.toUpperCase();
    case 'title':
      return heading
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    case 'normal':
    default:
      return heading;
  }
}

/**
 * Truncate summary to max length while preserving sentence boundaries
 */
function truncateSummary(summary: string, maxLength: number): string {
  if (summary.length <= maxLength) return summary;
  
  // Find the last sentence boundary before maxLength
  const sentences = summary.split(/(?<=[.!?])\s+/);
  let result = '';
  
  for (const sentence of sentences) {
    if ((result + sentence).length > maxLength) break;
    result += (result ? ' ' : '') + sentence;
  }
  
  return result || summary.slice(0, maxLength).trim() + '...';
}

/**
 * Parse bullets from content
 */
function parseBullets(content: string): string[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
    .map(line => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Format skills section based on template
 */
function formatSkills(content: string, config: TemplateConfig): string {
  const skills = parseBullets(content);
  
  if (skills.length === 0) {
    // Try splitting by commas or newlines
    const allSkills = content
      .split(/[,\n]/)
      .map(s => s.replace(/^[•\-*]\s*/, '').trim())
      .filter(Boolean);
    
    if (config.skillsFormat === 'comma-separated') {
      return allSkills.join(', ');
    }
    return allSkills.map(s => `${config.bulletPrefix} ${s}`).join('\n');
  }
  
  switch (config.skillsFormat) {
    case 'comma-separated':
      return skills.join(', ');
    case 'bullets':
      return skills.map(s => `${config.bulletPrefix} ${s}`).join('\n');
    case 'categorized':
    default:
      return skills.map(s => `${config.bulletPrefix} ${s}`).join('\n');
  }
}

/**
 * Truncate experience bullets to max allowed
 */
function formatExperience(content: string, config: TemplateConfig): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let currentBulletCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*');
    
    if (!isBullet) {
      // This is likely a job title/company line - reset bullet count
      currentBulletCount = 0;
      result.push(trimmed);
    } else if (currentBulletCount < config.maxBulletsPerPosition) {
      // Add bullet with template prefix
      const bulletContent = trimmed.replace(/^[•\-*]\s*/, '');
      result.push(`${config.bulletPrefix} ${bulletContent}`);
      currentBulletCount++;
    }
    // Skip bullets beyond max
  }
  
  return result.join('\n');
}

/**
 * Apply template formatting to a section
 */
function formatSection(
  sectionName: string,
  content: string,
  config: TemplateConfig
): FormattedSection {
  const sectionTitles: Record<string, string> = {
    summary: 'Professional Summary',
    skills: 'Skills & Competencies',
    experience: 'Professional Experience',
    education: 'Education & Certifications',
  };
  
  const title = formatHeading(
    sectionTitles[sectionName] || sectionName,
    config.useHeadingCase
  );
  
  let formattedContent = content;
  let bullets: string[] = [];
  
  switch (sectionName) {
    case 'summary':
      formattedContent = truncateSummary(content, config.maxSummaryLength);
      break;
    case 'skills':
      formattedContent = formatSkills(content, config);
      break;
    case 'experience':
      formattedContent = formatExperience(content, config);
      bullets = parseBullets(formattedContent);
      break;
    case 'education':
      // Education typically doesn't need bullet truncation
      formattedContent = content.replace(/^[•\-*]\s*/gm, `${config.bulletPrefix} `);
      break;
  }
  
  return { title, content: formattedContent, bullets };
}

/**
 * Apply template formatting to all versions
 */
export function applyTemplateFormatting(
  versions: RBVersion[],
  templateId: TemplateId
): FormattedSection[] {
  const config = getTemplateConfig(templateId);
  const sectionOrder = ['summary', 'skills', 'experience', 'education'];
  
  const sortedVersions = [...versions].sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a.section_name);
    const bIndex = sectionOrder.indexOf(b.section_name);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });
  
  return sortedVersions.map(version =>
    formatSection(version.section_name, version.content, config)
  );
}

/**
 * Compile formatted sections to plain text
 */
export function compileToPlainText(
  sections: FormattedSection[],
  templateId: TemplateId
): string {
  const config = getTemplateConfig(templateId);
  
  return sections
    .map(section => {
      const divider = config.useHeadingCase === 'upper' 
        ? '─'.repeat(section.title.length) 
        : '';
      return `${section.title}\n${divider ? divider + '\n' : ''}${section.content}`;
    })
    .join('\n\n');
}

/**
 * Get template-specific styles for DOCX generation
 */
export function getDocxStyles(templateId: TemplateId) {
  const config = getTemplateConfig(templateId);
  
  return {
    title: {
      size: templateId === 'executive' ? 28 : 24,
      bold: true,
    },
    heading: {
      size: templateId === 'executive' ? 14 : 12,
      bold: true,
      allCaps: config.useHeadingCase === 'upper',
    },
    body: {
      size: templateId === 'executive' ? 10 : 11,
      lineSpacing: templateId === 'executive' ? 1.0 : 1.15,
    },
    bullet: {
      prefix: config.bulletPrefix,
      indent: 0.25,
    },
    margins: templateId === 'executive' 
      ? { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
      : { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
  };
}

/**
 * Get template-specific styles for PDF generation
 */
export function getPdfStyles(templateId: TemplateId) {
  return {
    title: {
      fontSize: templateId === 'executive' ? 18 : 16,
      fontStyle: 'bold',
    },
    heading: {
      fontSize: templateId === 'executive' ? 11 : 12,
      fontStyle: 'bold',
    },
    body: {
      fontSize: templateId === 'executive' ? 9 : 10,
    },
    margins: templateId === 'executive' ? 15 : 20,
    lineHeight: templateId === 'executive' ? 4 : 5,
    sectionGap: templateId === 'executive' ? 6 : 8,
  };
}

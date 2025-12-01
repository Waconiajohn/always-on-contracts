/**
 * Resume Export Types & Formatting
 * 
 * Defines the final resume structure and provides
 * formatting functions for different output formats.
 */

// ============================================================================
// FINAL RESUME STRUCTURE
// ============================================================================

export interface FinalResumeRole {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location?: string;
  bullets: string[]; // Only accepted/edited text, no AI markers
}

export interface FinalResume {
  /**
   * Contact info (from user profile)
   */
  contact?: {
    name: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };

  /**
   * Professional Summary (2-4 sentences)
   */
  summary: string;

  /**
   * Key Highlights (4-6 impact statements)
   */
  highlights: string[];

  /**
   * Professional Experience (roles with bullets)
   */
  experience: FinalResumeRole[];

  /**
   * Skills (comma-separated or grouped)
   */
  skills: string[];

  /**
   * Education (optional)
   */
  education?: Array<{
    institution: string;
    degree: string;
    year?: string;
    details?: string;
  }>;

  /**
   * Certifications (optional)
   */
  certifications?: string[];

  /**
   * Metadata for tracking
   */
  metadata: {
    targetJobTitle: string;
    targetCompany?: string;
    generatedAt: Date;
    initialScore: number;
    finalScore: number;
    gapsResolved: {
      critical: number;
      criticalTotal: number;
      important: number;
      importantTotal: number;
    };
    jobId?: string;
  };
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export type ResumeTemplate = 'classic' | 'modern' | 'executive';

export const TEMPLATE_CONFIG: Record<ResumeTemplate, {
  name: string;
  description: string;
  sectionOrder: Array<keyof Omit<FinalResume, 'metadata' | 'contact'>>;
  showHighlights: boolean;
  skillsFormat: 'inline' | 'grouped';
}> = {
  classic: {
    name: 'Classic',
    description: 'Traditional format, widely accepted',
    sectionOrder: ['summary', 'highlights', 'experience', 'skills', 'education', 'certifications'],
    showHighlights: true,
    skillsFormat: 'inline',
  },
  modern: {
    name: 'Modern',
    description: 'Clean layout with visual hierarchy',
    sectionOrder: ['summary', 'highlights', 'skills', 'experience', 'education'],
    showHighlights: true,
    skillsFormat: 'grouped',
  },
  executive: {
    name: 'Executive',
    description: 'Leadership-focused format',
    sectionOrder: ['summary', 'highlights', 'experience', 'education', 'skills'],
    showHighlights: true,
    skillsFormat: 'inline',
  },
};

// ============================================================================
// FORMATTING FUNCTIONS
// ============================================================================

/**
 * Format date range for display
 */
export function formatDateRange(startDate: string, endDate: string, isCurrent: boolean): string {
  const formatDate = (date: string) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  const start = formatDate(startDate);
  const end = isCurrent ? 'Present' : formatDate(endDate);
  
  return `${start} – ${end}`;
}

/**
 * Render resume to plain text (for clipboard copy)
 */
export function renderResumeToPlainText(resume: FinalResume): string {
  const lines: string[] = [];

  // Contact (if available)
  if (resume.contact?.name) {
    lines.push(resume.contact.name.toUpperCase());
    if (resume.contact.email || resume.contact.phone) {
      lines.push([resume.contact.email, resume.contact.phone].filter(Boolean).join(' | '));
    }
    if (resume.contact.location || resume.contact.linkedin) {
      lines.push([resume.contact.location, resume.contact.linkedin].filter(Boolean).join(' | '));
    }
    lines.push('');
  }

  // Summary
  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('─'.repeat(50));
    lines.push(resume.summary);
    lines.push('');
  }

  // Highlights
  if (resume.highlights.length > 0) {
    lines.push('KEY HIGHLIGHTS');
    lines.push('─'.repeat(50));
    resume.highlights.forEach(h => lines.push(`• ${h}`));
    lines.push('');
  }

  // Experience
  if (resume.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    lines.push('─'.repeat(50));
    resume.experience.forEach(role => {
      lines.push(`${role.title.toUpperCase()}`);
      lines.push(`${role.company} | ${formatDateRange(role.startDate, role.endDate, role.isCurrent)}`);
      role.bullets.forEach(b => lines.push(`• ${b}`));
      lines.push('');
    });
  }

  // Skills
  if (resume.skills.length > 0) {
    lines.push('SKILLS');
    lines.push('─'.repeat(50));
    lines.push(resume.skills.join(', '));
    lines.push('');
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    lines.push('EDUCATION');
    lines.push('─'.repeat(50));
    resume.education.forEach(edu => {
      lines.push(`${edu.degree} – ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`);
      if (edu.details) lines.push(edu.details);
    });
    lines.push('');
  }

  // Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    lines.push('─'.repeat(50));
    resume.certifications.forEach(c => lines.push(`• ${c}`));
  }

  return lines.join('\n');
}

/**
 * Render resume to HTML (for preview and PDF generation)
 */
export function renderResumeToHTML(resume: FinalResume, template: ResumeTemplate = 'classic'): string {
  const config = TEMPLATE_CONFIG[template];
  
  let html = `
    <div class="resume-container" style="font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.5;">
  `;

  // Contact header
  if (resume.contact?.name) {
    html += `
      <header style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 28px; margin: 0 0 10px; font-weight: 600;">${resume.contact.name}</h1>
        ${resume.contact.email || resume.contact.phone ? `
          <p style="margin: 5px 0; color: #666;">
            ${[resume.contact.email, resume.contact.phone].filter(Boolean).join(' | ')}
          </p>
        ` : ''}
        ${resume.contact.location || resume.contact.linkedin ? `
          <p style="margin: 5px 0; color: #666;">
            ${[resume.contact.location, resume.contact.linkedin].filter(Boolean).join(' | ')}
          </p>
        ` : ''}
      </header>
    `;
  }

  // Summary
  if (resume.summary) {
    html += `
      <section style="margin-bottom: 25px;">
        <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
          Professional Summary
        </h2>
        <p style="margin: 0; text-align: justify;">${resume.summary}</p>
      </section>
    `;
  }

  // Highlights
  if (resume.highlights.length > 0 && config.showHighlights) {
    html += `
      <section style="margin-bottom: 25px;">
        <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
          Key Highlights
        </h2>
        <ul style="margin: 0; padding-left: 20px;">
          ${resume.highlights.map(h => `<li style="margin-bottom: 5px;">${h}</li>`).join('')}
        </ul>
      </section>
    `;
  }

  // Experience
  if (resume.experience.length > 0) {
    html += `
      <section style="margin-bottom: 25px;">
        <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 15px;">
          Professional Experience
        </h2>
        ${resume.experience.map(role => `
          <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <h3 style="font-size: 16px; font-weight: 600; margin: 0;">${role.title}</h3>
              <span style="font-size: 13px; color: #666;">${formatDateRange(role.startDate, role.endDate, role.isCurrent)}</span>
            </div>
            <p style="margin: 3px 0 10px; font-style: italic; color: #444;">${role.company}${role.location ? ` | ${role.location}` : ''}</p>
            <ul style="margin: 0; padding-left: 20px;">
              ${role.bullets.map(b => `<li style="margin-bottom: 5px;">${b}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </section>
    `;
  }

  // Skills
  if (resume.skills.length > 0) {
    html += `
      <section style="margin-bottom: 25px;">
        <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
          Skills
        </h2>
        <p style="margin: 0;">${resume.skills.join(', ')}</p>
      </section>
    `;
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    html += `
      <section style="margin-bottom: 25px;">
        <h2 style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px;">
          Education
        </h2>
        ${resume.education.map(edu => `
          <p style="margin: 5px 0;">
            <strong>${edu.degree}</strong> – ${edu.institution}${edu.year ? ` (${edu.year})` : ''}
            ${edu.details ? `<br><span style="color: #666;">${edu.details}</span>` : ''}
          </p>
        `).join('')}
      </section>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * Prepare data for DOCX generation (can be used with docx library)
 */
export interface DOCXSection {
  type: 'heading' | 'paragraph' | 'bulletList' | 'roleHeader';
  content: string | string[];
  style?: Record<string, any>;
}

export function prepareForDOCX(resume: FinalResume): DOCXSection[] {
  const sections: DOCXSection[] = [];

  // Contact
  if (resume.contact?.name) {
    sections.push({ type: 'heading', content: resume.contact.name, style: { level: 1 } });
    const contactLine = [resume.contact.email, resume.contact.phone, resume.contact.location]
      .filter(Boolean)
      .join(' | ');
    if (contactLine) {
      sections.push({ type: 'paragraph', content: contactLine, style: { alignment: 'center' } });
    }
  }

  // Summary
  if (resume.summary) {
    sections.push({ type: 'heading', content: 'Professional Summary', style: { level: 2 } });
    sections.push({ type: 'paragraph', content: resume.summary });
  }

  // Highlights
  if (resume.highlights.length > 0) {
    sections.push({ type: 'heading', content: 'Key Highlights', style: { level: 2 } });
    sections.push({ type: 'bulletList', content: resume.highlights });
  }

  // Experience
  if (resume.experience.length > 0) {
    sections.push({ type: 'heading', content: 'Professional Experience', style: { level: 2 } });
    resume.experience.forEach(role => {
      sections.push({ 
        type: 'roleHeader', 
        content: `${role.title} | ${role.company} | ${formatDateRange(role.startDate, role.endDate, role.isCurrent)}` 
      });
      sections.push({ type: 'bulletList', content: role.bullets });
    });
  }

  // Skills
  if (resume.skills.length > 0) {
    sections.push({ type: 'heading', content: 'Skills', style: { level: 2 } });
    sections.push({ type: 'paragraph', content: resume.skills.join(', ') });
  }

  // Education
  if (resume.education && resume.education.length > 0) {
    sections.push({ type: 'heading', content: 'Education', style: { level: 2 } });
    resume.education.forEach(edu => {
      sections.push({ 
        type: 'paragraph', 
        content: `${edu.degree} – ${edu.institution}${edu.year ? ` (${edu.year})` : ''}` 
      });
    });
  }

  return sections;
}

/**
 * Copy resume text to clipboard
 */
export async function copyResumeToClipboard(resume: FinalResume): Promise<boolean> {
  try {
    const text = renderResumeToPlainText(resume);
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * ResumeTemplate - Centralized resume HTML template generator
 * 
 * Extracted from ResumeOptimizer.tsx to:
 * - Improve maintainability
 * - Enable template reuse
 * - Separate concerns
 */

interface ResumeSections {
  name?: string;
  contact?: string;
  summary?: string;
  skills: string[];
  achievements: string[];
  experience: Array<{
    title: string;
    company: string;
    location?: string;
    dates: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school?: string;
    location?: string;
  }>;
}

/**
 * Generates HTML template from parsed resume sections
 * @param sections - Parsed resume data
 * @returns HTML string
 */
export function generateResumeHTML(sections: ResumeSections): string {
  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;');
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Calibri', 'Arial', sans-serif; 
      line-height: 1.5; 
      color: #1f2937; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 0.75in; 
      font-size: 11pt;
    }
    
    /* Header */
    .header { 
      text-align: center; 
      margin-bottom: 28px; 
      border-bottom: 3px solid #2563eb; 
      padding-bottom: 18px; 
    }
    .header h1 { 
      font-size: 26pt; 
      font-weight: 700; 
      color: #1e3a8a; 
      margin-bottom: 10px; 
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header .contact { 
      font-size: 10pt; 
      color: #64748b; 
      line-height: 1.6;
    }
    
    /* Section Titles */
    .section-title { 
      font-size: 13pt; 
      font-weight: 700; 
      color: #1e3a8a; 
      text-transform: uppercase; 
      border-bottom: 2px solid #cbd5e1; 
      padding-bottom: 5px; 
      margin: 22px 0 14px 0; 
      letter-spacing: 1px;
    }
    
    /* Summary */
    .summary { 
      font-size: 11pt; 
      line-height: 1.65; 
      text-align: justify; 
      margin-bottom: 18px;
      color: #374151;
    }
    
    /* Skills Grid - 3 columns */
    .skills-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 8px 14px; 
      margin-bottom: 18px;
    }
    .skill-item { 
      font-size: 10pt; 
      padding: 6px 10px;
      background: #f1f5f9;
      border-left: 3px solid #3b82f6;
      border-radius: 3px;
      transition: background 0.2s;
    }
    
    /* Achievements */
    .achievements { 
      margin-bottom: 18px; 
    }
    .achievement-item { 
      font-size: 10.5pt; 
      margin-bottom: 10px; 
      padding-left: 18px;
      line-height: 1.6;
      position: relative;
      color: #374151;
    }
    .achievement-item:before {
      content: '▶';
      position: absolute;
      left: 0;
      color: #3b82f6;
      font-size: 9pt;
      top: 2px;
    }
    
    /* Experience */
    .job { 
      margin-bottom: 20px; 
      page-break-inside: avoid; 
    }
    .job-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start;
      margin-bottom: 8px;
      background: #f8fafc;
      padding: 10px 14px;
      border-left: 4px solid #2563eb;
      border-radius: 2px;
    }
    .job-title { 
      font-size: 12pt; 
      font-weight: 700; 
      color: #1e3a8a; 
      line-height: 1.3;
    }
    .job-company { 
      font-size: 10.5pt; 
      color: #475569; 
      font-weight: 500;
      margin-top: 3px;
    }
    .job-meta { 
      font-size: 10pt; 
      color: #64748b; 
      text-align: right;
      font-style: italic;
      white-space: nowrap;
    }
    .job-bullets { 
      margin: 10px 0 0 22px; 
      padding: 0;
    }
    .job-bullets li { 
      font-size: 10pt; 
      margin-bottom: 7px; 
      line-height: 1.55;
      list-style-type: disc;
      color: #374151;
    }
    
    /* Education */
    .education-item { 
      margin-bottom: 10px; 
      padding: 10px 14px;
      background: #f8fafc;
      border-left: 4px solid #2563eb;
      border-radius: 2px;
    }
    .education-item .degree { 
      font-size: 11pt; 
      font-weight: 600; 
      color: #1e3a8a;
      margin-bottom: 3px;
    }
    .education-item .school { 
      font-size: 10pt; 
      color: #64748b; 
    }
    
    @media print { 
      body { padding: 0.5in; } 
      .job, .education-item { page-break-inside: avoid; }
      .skill-item { background: #f9fafb; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(sections.name || 'Professional Resume')}</h1>
    <div class="contact">${escapeHtml(sections.contact || '')}</div>
  </div>

  ${sections.summary ? `
  <div class="section-title">Professional Summary</div>
  <div class="summary">${escapeHtml(sections.summary)}</div>
  ` : ''}

  ${sections.skills.length > 0 ? `
  <div class="section-title">Technical Skills</div>
  <div class="skills-grid">
    ${sections.skills.map((skill: string) => 
      `<div class="skill-item">${escapeHtml(skill)}</div>`
    ).join('')}
  </div>
  ` : ''}

  ${sections.achievements.length > 0 ? `
  <div class="section-title">Key Achievements</div>
  <div class="achievements">
    ${sections.achievements.map((achievement: string) => 
      `<div class="achievement-item">${escapeHtml(achievement)}</div>`
    ).join('')}
  </div>
  ` : ''}

  ${sections.experience.length > 0 ? `
  <div class="section-title">Professional Experience</div>
  ${sections.experience.map((job: any) => `
    <div class="job">
      <div class="job-header">
        <div>
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-company">${escapeHtml(job.company)}${job.location ? ' | ' + escapeHtml(job.location) : ''}</div>
        </div>
        <div class="job-meta">${escapeHtml(job.dates)}</div>
      </div>
      ${job.bullets && job.bullets.length > 0 ? `
        <ul class="job-bullets">
          ${job.bullets.map((bullet: string) => 
            `<li>${escapeHtml(bullet)}</li>`
          ).join('')}
        </ul>
      ` : ''}
    </div>
  `).join('')}
  ` : ''}

  ${sections.education.length > 0 ? `
  <div class="section-title">Education</div>
  ${sections.education.map((edu: any) => `
    <div class="education-item">
      <div class="degree">${escapeHtml(edu.degree)}</div>
      ${edu.school ? `<div class="school">${escapeHtml(edu.school)}${edu.location ? ' | ' + escapeHtml(edu.location) : ''}</div>` : ''}
    </div>
  `).join('')}
  ` : ''}
</body>
</html>`.trim();
}

// =====================================================
// Resume Builder V3 - Shared Formatting Utilities
// =====================================================

import type { OptimizedResume } from "@/stores/resumeBuilderV3Store";

/**
 * Formats an OptimizedResume object as plain text
 */
export function formatResumeAsText(resume: OptimizedResume): string {
  if (!resume) return "";
  
  let text = "";
  
  // Header
  text += `${resume.header.name}\n`;
  text += `${resume.header.title}\n`;
  if (resume.header.contact) text += `${resume.header.contact}\n`;
  text += "\n";
  
  // Summary
  text += "PROFESSIONAL SUMMARY\n";
  text += `${resume.summary}\n\n`;
  
  // Experience
  text += "EXPERIENCE\n";
  resume.experience.forEach((exp) => {
    text += `${exp.title} | ${exp.company} | ${exp.dates}\n`;
    exp.bullets.forEach((bullet) => {
      text += `• ${bullet}\n`;
    });
    text += "\n";
  });
  
  // Skills
  text += "SKILLS\n";
  text += resume.skills.join(" • ") + "\n\n";
  
  // Education
  if (resume.education?.length) {
    text += "EDUCATION\n";
    resume.education.forEach((edu) => {
      text += `${edu.degree} - ${edu.institution}`;
      if (edu.year) text += ` (${edu.year})`;
      text += "\n";
    });
    text += "\n";
  }
  
  // Certifications
  if (resume.certifications?.length) {
    text += "CERTIFICATIONS\n";
    resume.certifications.forEach((cert) => {
      text += `• ${cert}\n`;
    });
  }
  
  return text;
}

/**
 * Experience entry structure for export
 */
export interface ExperienceEntry {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}

/**
 * Export section with proper typing
 */
export interface ExportSection {
  title: string;
  type: "summary" | "experience" | "skills" | "education" | "certifications";
  content: string;
  bullets: string[];
  paragraph?: string;
  entries?: ExperienceEntry[]; // Structured experience data
}

/**
 * Prepares resume data for DOCX/PDF export with proper structure
 */
export function prepareExportData(resume: OptimizedResume) {
  const sections: ExportSection[] = [
    {
      title: "Professional Summary",
      type: "summary",
      content: resume.summary,
      bullets: [],
      paragraph: resume.summary,
    },
    {
      title: "Experience",
      type: "experience",
      content: "",
      bullets: [], // Keep empty for backwards compatibility
      entries: resume.experience.map(exp => ({
        title: exp.title,
        company: exp.company,
        dates: exp.dates,
        bullets: exp.bullets,
      })),
    },
    {
      title: "Skills",
      type: "skills",
      content: resume.skills.join(" • "),
      bullets: resume.skills,
    },
  ];

  if (resume.education?.length) {
    sections.push({
      title: "Education",
      type: "education",
      content: "",
      bullets: resume.education.map(edu => 
        `${edu.degree} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`
      ),
    });
  }

  if (resume.certifications?.length) {
    sections.push({
      title: "Certifications",
      type: "certifications",
      content: "",
      bullets: resume.certifications,
    });
  }

  // Parse contact info more robustly
  const contactParts = resume.header.contact?.split(/[|,]/).map(s => s.trim()).filter(Boolean) || [];
  
  return {
    name: resume.header.name,
    contact: {
      headline: resume.header.title,
      email: contactParts.find(p => p.includes('@')) || contactParts[0],
      phone: contactParts.find(p => /\d{3}.*\d{3}.*\d{4}/.test(p)) || contactParts[1],
      location: contactParts.find(p => !p.includes('@') && !/\d{3}.*\d{3}.*\d{4}/.test(p)) || contactParts[2],
    },
    sections,
  };
}

// PDF export colors - using fixed colors for consistent PDF output
const PDF_COLORS = {
  primary: "#7c3aed",
  text: "#1f2937",
  textMuted: "#64748b",
  border: "#e5e7eb",
};

/**
 * Escapes HTML entities to prevent XSS in generated HTML
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Generates HTML for PDF export with fixed colors (no CSS variables)
 */
export function generateResumeHTML(data: ReturnType<typeof prepareExportData>): string {
  const sectionsHTML = data.sections.map((section) => {
    let content: string;
    
    // Handle experience section with structured entries
    if (section.type === "experience" && section.entries?.length) {
      content = section.entries.map(exp => `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
            <div>
              <strong style="color: ${PDF_COLORS.text};">${escapeHtml(exp.title)}</strong>
              <span style="color: ${PDF_COLORS.textMuted};"> | ${escapeHtml(exp.company)}</span>
            </div>
            <span style="color: ${PDF_COLORS.textMuted}; font-size: 14px;">${escapeHtml(exp.dates)}</span>
          </div>
          <ul style="margin-left: 16px; margin-top: 8px;">
            ${exp.bullets.map(b => `<li style="margin-bottom: 4px;">${escapeHtml(b)}</li>`).join('')}
          </ul>
        </div>
      `).join('');
    } else if (section.bullets?.length) {
      content = `<ul>${section.bullets.map((b: string) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`;
    } else {
      content = `<p>${escapeHtml(section.content || '')}</p>`;
    }
    
    return `
      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: ${PDF_COLORS.primary}; border-bottom: 1px solid ${PDF_COLORS.border}; padding-bottom: 8px; margin-bottom: 12px;">${escapeHtml(section.title)}</h2>
        ${content}
      </section>
    `;
  }).join('');

  const contactParts = [
    data.contact?.email,
    data.contact?.phone,
    data.contact?.location
  ].filter(Boolean).map(p => escapeHtml(p as string));

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${data.name} - Resume</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Inter', 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: ${PDF_COLORS.text};
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        header { 
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${PDF_COLORS.primary};
        }
        h1 { font-size: 28px; color: ${PDF_COLORS.primary}; margin-bottom: 8px; }
        .headline { color: ${PDF_COLORS.textMuted}; font-size: 16px; }
        .contact { margin-top: 10px; color: ${PDF_COLORS.textMuted}; font-size: 14px; }
        ul { list-style-position: inside; padding-left: 0; }
        li { margin-bottom: 8px; padding-left: 16px; text-indent: -16px; }
        p { margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <header>
        <h1>${escapeHtml(data.name)}</h1>
        ${data.contact?.headline ? `<p class="headline">${escapeHtml(data.contact.headline)}</p>` : ''}
        ${contactParts.length > 0 ? `<p class="contact">${contactParts.join(' | ')}</p>` : ''}
      </header>
      <main>${sectionsHTML}</main>
    </body>
    </html>
  `;
}

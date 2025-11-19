import { supabase } from '@/integrations/supabase/client';
import { CanonicalResume, CanonicalResumeSection } from './resumeModel';
import { canonicalResumeToHTML } from './resumeSerialization';

/**
 * Render a canonical resume with a specific template's styling
 * @param canonical - The canonical resume data
 * @param templateId - The resume template ID from resume_templates table
 */
export async function renderResumeWithTemplate(
  canonical: CanonicalResume,
  templateId: string
): Promise<string> {
  // Fetch template from database
  const { data: template, error } = await supabase
    .from('resume_templates')
    .select('html_structure, css_styles, template_name')
    .eq('id', templateId)
    .maybeSingle();

  if (error || !template) {
    console.warn('[TEMPLATE-RENDER] Template not found, using default HTML', templateId);
    return canonicalResumeToHTML(canonical);
  }

  console.log('[TEMPLATE-RENDER] Applying template:', template.template_name);

  try {
    let html = template.html_structure || '';

    // Replace header placeholders
    html = html.replace(/\{\{fullName\}\}/g, escapeHtml(canonical.header.fullName));
    html = html.replace(/\{\{headline\}\}/g, escapeHtml(canonical.header.headline || ''));
    html = html.replace(/\{\{contactLine\}\}/g, escapeHtml(canonical.header.contactLine || ''));

    // Render sections
    const sectionsHtml = canonical.sections
      .map(section => renderSection(section, template))
      .join('\n');
    
    html = html.replace(/\{\{sections\}\}/g, sectionsHtml);

    // Inject CSS
    if (template.css_styles) {
      html = `<style>${template.css_styles}</style>\n${html}`;
    }

    return html;
  } catch (error) {
    console.error('[TEMPLATE-RENDER] Error applying template:', error);
    return canonicalResumeToHTML(canonical);
  }
}

/**
 * Render a single section with template formatting
 */
function renderSection(section: CanonicalResumeSection, _template: any): string {
  const heading = escapeHtml(section.heading);
  
  // Handle paragraph-style sections (like Summary)
  if (section.paragraph) {
    return `
      <div class="resume-section">
        <h2 class="section-heading">${heading}</h2>
        <p class="section-paragraph">${escapeHtml(section.paragraph)}</p>
      </div>
    `;
  }

  // Handle bullet-point sections
  const bullets = section.bullets
    .map(bullet => `<li class="section-bullet">${escapeHtml(bullet)}</li>`)
    .join('\n');

  return `
    <div class="resume-section">
      <h2 class="section-heading">${heading}</h2>
      <ul class="section-bullets">
        ${bullets}
      </ul>
    </div>
  `;
}

/**
 * Escape HTML to prevent injection
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

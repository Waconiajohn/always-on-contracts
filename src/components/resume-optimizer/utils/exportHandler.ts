import { ResumeVersion, CareerProfile } from '../types';
import { exportFormats } from '@/lib/resumeExportUtils';

interface ExportableResumeData {
  name: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    headline?: string;
  };
  sections: Array<{
    title: string;
    type: string;
    content?: string;
    bullets?: string[];
    paragraph?: string;
  }>;
}

export function prepareForExport(
  version: ResumeVersion,
  careerProfile?: CareerProfile | null,
  jobTitle?: string
): ExportableResumeData {
  // Use fullName from career profile, fallback to extracting from UVP or default
  const name = careerProfile?.fullName || 'Your Name';
  
  return {
    name: name,
    contact: {
      email: careerProfile?.email,
      phone: careerProfile?.phone,
      location: careerProfile?.location,
      headline: jobTitle || careerProfile?.careerTrajectory || 'Professional'
    },
    sections: version.sections.map(section => ({
      title: section.title,
      type: section.type,
      content: section.content.join('\n'),
      bullets: section.content,
      paragraph: section.type === 'summary' ? section.content.join(' ') : undefined
    }))
  };
}

export function generateResumeHTML(data: ExportableResumeData): string {
  const sectionsHTML = data.sections.map(section => {
    const bulletsHTML = section.bullets?.length 
      ? `<ul>${section.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`
      : `<p>${section.content || ''}</p>`;
    
    return `
      <section class="resume-section">
        <h2>${section.title}</h2>
        ${bulletsHTML}
      </section>
    `;
  }).join('');

  // Build contact info string
  const contactParts = [
    data.contact.email,
    data.contact.phone,
    data.contact.location
  ].filter(Boolean);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.name} - Resume</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        header { 
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #2563eb;
        }
        h1 { 
          font-size: 28px;
          color: #1e3a8a;
          margin-bottom: 8px;
        }
        .headline {
          color: #64748b;
          font-size: 16px;
        }
        .contact {
          margin-top: 10px;
          color: #64748b;
          font-size: 14px;
        }
        .resume-section {
          margin-bottom: 24px;
        }
        h2 {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #1e3a8a;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        ul {
          list-style-position: inside;
          padding-left: 0;
        }
        li {
          margin-bottom: 8px;
          padding-left: 16px;
          text-indent: -16px;
        }
        p {
          margin-bottom: 12px;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>${data.name}</h1>
        ${data.contact.headline ? `<p class="headline">${data.contact.headline}</p>` : ''}
        ${contactParts.length > 0 ? `<p class="contact">${contactParts.join(' | ')}</p>` : ''}
      </header>
      <main>
        ${sectionsHTML}
      </main>
    </body>
    </html>
  `;
}

export async function exportResume(
  format: 'pdf' | 'docx' | 'html' | 'txt',
  version: ResumeVersion,
  careerProfile?: CareerProfile | null,
  jobTitle?: string,
  templateId?: string
): Promise<void> {
  const data = prepareForExport(version, careerProfile, jobTitle);
  const fileName = `${data.name.replace(/\s+/g, '-')}-Resume`;

  switch (format) {
    case 'pdf': {
      const html = generateResumeHTML(data);
      await exportFormats.standardPDF(html, fileName);
      break;
    }
    case 'docx': {
      await exportFormats.docxExport(data, fileName, templateId || 'modern');
      break;
    }
    case 'html': {
      const html = generateResumeHTML(data);
      await exportFormats.htmlExport(html, fileName);
      break;
    }
    case 'txt': {
      await exportFormats.txtExport(data, fileName);
      break;
    }
  }
}

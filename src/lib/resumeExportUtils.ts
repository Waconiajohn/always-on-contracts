import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { formatResumeContent } from './resumeFormatting';
import { ExecutiveDocxGenerator } from './docx/executiveTemplate';
import { TechnicalDocxGenerator } from './docx/technicalTemplate';
import { FunctionalDocxGenerator } from './docx/functionalTemplate';
import { HybridDocxGenerator } from './docx/hybridTemplate';

// Debug mode for export logging
const EXPORT_DEBUG = import.meta.env.DEV;

export const exportFormats = {
  async standardPDF(htmlContent: string, fileName: string) {
    if (EXPORT_DEBUG) {
      console.log('[EXPORT] standardPDF called with:', {
        fileName,
        contentLength: htmlContent?.length || 0,
        hasContent: !!htmlContent && htmlContent.trim().length > 0
      });
    }

    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error('Cannot export: Resume content is empty. Please generate your resume sections first.');
    }

    const container = createContainer(htmlContent, {
      width: '8.5in',
      padding: '0.75in',
      backgroundColor: 'white'
    });
    const pdf = await htmlToPDF(container);
    pdf.save(`${fileName}.pdf`);
    cleanupContainer(container);
  },
  
  async atsPDF(structuredData: any, fileName: string) {
    const doc = new jsPDF('p', 'mm', 'a4');
    let y = 20;
    
    doc.setFont('helvetica');
    doc.setFontSize(16);
    doc.text(structuredData.name || 'Resume', 20, y);
    y += 10;
    
    doc.setFontSize(10);
    const contact = structuredData.contact || {};
    doc.text(contact.email || '', 20, y);
    doc.text(contact.phone || '', 120, y);
    y += 15;
    
    doc.setFontSize(11);
    const sections = structuredData.sections || [];
    for (const section of sections) {
      doc.setFont('helvetica', 'bold');
      doc.text(section.title.toUpperCase(), 20, y);
      y += 7;
      
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(section.content, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 5;
      
      if (y > 270) break;
    }
    
    doc.save(`${fileName}-ATS.pdf`);
  },
  
  async printPDF(htmlContent: string, fileName: string) {
    const container = createContainer(htmlContent, {
      width: '8.5in',
      padding: '0.5in',
      backgroundColor: 'white'
    });
    const pdf = await htmlToPDF(container, { scale: 3 });
    pdf.save(`${fileName}-Print.pdf`);
    cleanupContainer(container);
  },
  
  plainText(structuredData: any): string {
    let text = '';
    text += `${structuredData.name || 'Resume'}\n`;
    const contact = structuredData.contact || {};
    text += `${contact.email || ''} | ${contact.phone || ''}\n`;
    text += `${contact.location || ''}\n\n`;
    
    const sections = structuredData.sections || [];
    for (const section of sections) {
      text += `${section.title.toUpperCase()}\n`;
      text += `${'='.repeat(section.title.length)}\n`;
      text += `${section.content}\n\n`;
    }
    
    return text;
  },
  
  linkedInFormat(structuredData: any): string {
    let text = '';
    
    text += `📋 ABOUT\n${structuredData.summary || ''}\n\n`;
    
    text += `💼 EXPERIENCE\n\n`;
    const workHistory = structuredData.workHistory || [];
    for (const job of workHistory) {
      text += `${job.title} at ${job.company}\n`;
      text += `${job.dates}\n`;
      const bullets = job.bullets || [];
      bullets.forEach((bullet: string) => {
        text += `• ${bullet}\n`;
      });
      text += `\n`;
    }
    
    text += `🛠️ SKILLS\n`;
    const skills = structuredData.skills || [];
    text += skills.join(' • ');
    
    return text;
  },

  async generateDOCX(structuredData: any, fileName: string, templateId?: string) {
    if (EXPORT_DEBUG) {
      console.log('[EXPORT] generateDOCX called with:', {
        templateId,
        name: structuredData.name,
        sectionsCount: structuredData.sections?.length || 0,
        sections: structuredData.sections?.map((s: any) => ({
          title: s.title,
          type: s.type,
          hasContent: !!s.content,
          contentLength: s.content?.length || 0,
          hasBullets: !!s.bullets,
          bulletsCount: s.bullets?.length || 0,
          bulletsSample: s.bullets?.[0]?.substring(0, 50)
        }))
      });
    }

    const resumeData = {
      header: {
        fullName: structuredData.name,
        email: structuredData.contact.email,
        phone: structuredData.contact.phone,
        location: structuredData.contact.location,
        linkedin: structuredData.contact.linkedin,
        headline: structuredData.contact.headline
      },
      sections: structuredData.sections
    };

    try {
      let doc;
      
      if (templateId === 'executive') {
        if (EXPORT_DEBUG) console.log('[EXPORT] Using Executive generator');
        const generator = new ExecutiveDocxGenerator(resumeData);
        doc = generator.generate();
      } else if (templateId === 'technical') {
        if (EXPORT_DEBUG) console.log('[EXPORT] Using Technical generator');
        const generator = new TechnicalDocxGenerator(resumeData);
        doc = generator.generate();
      } else if (templateId === 'functional') {
        if (EXPORT_DEBUG) console.log('[EXPORT] Using Functional generator');
        const generator = new FunctionalDocxGenerator(resumeData);
        doc = generator.generate();
      } else if (templateId === 'hybrid') {
        if (EXPORT_DEBUG) console.log('[EXPORT] Using Hybrid generator');
        const generator = new HybridDocxGenerator(resumeData);
        doc = generator.generate();
      }

      if (doc) {
        if (EXPORT_DEBUG) console.log('[EXPORT] Template generator succeeded, creating blob');
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${fileName}.docx`);
        return;
      }
    } catch (error) {
      if (EXPORT_DEBUG) console.error(`[EXPORT] ${templateId} generation failed, falling back to standard:`, error);
    }

    // Helper to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x26;/g, '&')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#(\d+);/g, (_: string, dec: string) => String.fromCharCode(parseInt(dec)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    };

    // Recursively decode HTML entities in all string values
    const deepDecodeEntities = (obj: any): any => {
      if (typeof obj === 'string') {
        return decodeHtmlEntities(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(deepDecodeEntities);
      }
      if (obj && typeof obj === 'object') {
        const decoded: any = {};
        for (const key in obj) {
          decoded[key] = deepDecodeEntities(obj[key]);
        }
        return decoded;
      }
      return obj;
    };

    // Pre-process all data to decode entities
    const cleanedData = deepDecodeEntities(structuredData);

    const children: any[] = [
      new Paragraph({
        text: cleanedData.name || 'Resume',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Paragraph({
        text: [
          cleanedData.contact?.email || '',
          cleanedData.contact?.phone || '',
          cleanedData.contact?.location || ''
        ].filter(Boolean).join(' | '),
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      })
    ];

    // Add sections with proper formatting
    (cleanedData.sections || []).forEach((section: any) => {
      const isExperienceSection = section.title.toLowerCase().includes('experience') || section.type === 'experience';
      const isSkillsSection = section.title.toLowerCase().includes('skill') || section.type === 'skills';

      // Section heading
      children.push(
        new Paragraph({
          text: section.title.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          thematicBreak: false
        })
      );

      // Handle paragraph content (e.g., Summary) - but skip for Experience sections
      if (section.content && !isExperienceSection) {
        children.push(
          new Paragraph({
            text: section.content,
            spacing: { after: 120 }
          })
        );
      }

      // Handle structured experience entries (new format from formatters.ts)
      if (isExperienceSection && section.entries && Array.isArray(section.entries)) {
        section.entries.forEach((exp: { title: string; company: string; dates: string; bullets: string[] }) => {
          // Job title
          children.push(new Paragraph({
            text: exp.title,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 180, after: 60 }
          }));
          
          // Company and dates
          children.push(new Paragraph({
            children: [
              new TextRun({ text: exp.company, italics: true }),
              new TextRun({ text: ` | ${exp.dates}` })
            ],
            spacing: { after: 60 }
          }));
          
          // Bullets
          if (exp.bullets && Array.isArray(exp.bullets)) {
            exp.bullets.forEach((bullet: string) => {
              const cleanBullet = formatResumeContent(bullet);
              if (cleanBullet) {
                children.push(new Paragraph({
                  text: cleanBullet,
                  bullet: { level: 0 },
                  spacing: { after: 60 }
                }));
              }
            });
          }
        });
      }
      // Handle legacy bullet format for experience
      else if (section.bullets && Array.isArray(section.bullets) && section.bullets.length > 0) {
        if (isExperienceSection) {
          // Parse experience bullets which may contain job entries (legacy format)
          let currentJob: { title?: string; company?: string; bullets: string[] } | null = null;

          section.bullets.forEach((bullet: string) => {
            const cleanedBullet = formatResumeContent(bullet);
            const jobTitleMatch = cleanedBullet.match(/^(.+?)\s*[|–]\s*(.+?)(?:\s*\(([^)]+)\))?$/);
            
            if (jobTitleMatch && !cleanedBullet.startsWith('-') && !cleanedBullet.startsWith('•')) {
              if (currentJob && currentJob.bullets.length > 0) {
                const job = currentJob;
                if (job.title) {
                  children.push(new Paragraph({
                    text: job.title,
                    heading: HeadingLevel.HEADING_3,
                    spacing: { before: 180, after: 60 }
                  }));
                }
                if (job.company) {
                  children.push(new Paragraph({
                    children: [new TextRun({ text: job.company, italics: true })],
                    spacing: { after: 60 }
                  }));
                }
                job.bullets.forEach((b: string) => {
                  children.push(new Paragraph({
                    text: formatResumeContent(b),
                    bullet: { level: 0 },
                    spacing: { after: 60 }
                  }));
                });
              }

              const [, jobTitle, companyInfo] = jobTitleMatch;
              currentJob = {
                title: jobTitle.trim(),
                company: companyInfo.trim(),
                bullets: []
              };
            } else {
              const bulletText = cleanedBullet.replace(/^[-•#]\s*/, '').trim();
              if (bulletText) {
                if (currentJob) {
                  currentJob.bullets.push(bulletText);
                } else {
                  children.push(new Paragraph({
                    text: formatResumeContent(bulletText),
                    bullet: { level: 0 },
                    spacing: { after: 60 }
                  }));
                }
              }
            }
          });

          if (currentJob) {
            const job: { title?: string; company?: string; bullets: string[] } = currentJob;
            if (job.bullets.length > 0) {
              if (job.title) {
                children.push(new Paragraph({
                  text: job.title,
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 180, after: 60 }
                }));
              }
              if (job.company) {
                children.push(new Paragraph({
                  children: [new TextRun({ text: job.company, italics: true })],
                  spacing: { after: 60 }
                }));
              }
              job.bullets.forEach((b: string) => {
                children.push(new Paragraph({
                  text: formatResumeContent(b),
                  bullet: { level: 0 },
                  spacing: { after: 60 }
                }));
              });
            }
          }
        } else if (isSkillsSection) {
          const skillsText = section.bullets
            .map((b: string) => formatResumeContent(b.replace(/^[-•]\s*/, '').trim()))
            .filter(Boolean)
            .join(' • ');
          
          children.push(new Paragraph({
            text: skillsText,
            spacing: { after: 120 }
          }));
        } else {
          section.bullets.forEach((bullet: string) => {
            const cleanBullet = bullet.replace(/^[-•]\s*/, '').trim();
            if (cleanBullet) {
              children.push(new Paragraph({
                text: cleanBullet,
                bullet: { level: 0 },
                spacing: { after: 60 }
              }));
            }
          });
        }
      }
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${fileName}.docx`);
  },

  // Alias for generateDOCX with validation
  async docxExport(structuredData: any, fileName: string, templateId?: string) {
    if (EXPORT_DEBUG) {
      console.log('[EXPORT] docxExport called with:', {
        fileName,
        templateId,
        hasSections: !!structuredData?.sections,
        sectionsCount: structuredData?.sections?.length || 0,
        sectionsDetail: structuredData?.sections?.map((s: any) => ({
          type: s.type,
          heading: s.heading,
          hasBullets: !!s.bullets,
          bulletsCount: s.bullets?.length || 0,
          hasParagraph: !!s.paragraph,
          firstBullet: s.bullets?.[0]?.substring(0, 50) || 'N/A'
        }))
      });
    }

    if (!structuredData || !structuredData.sections || structuredData.sections.length === 0) {
      throw new Error('Cannot export: Resume data is empty. Please generate your resume sections first.');
    }

    const hasAnyContent = structuredData.sections.some((s: any) => 
      (s.bullets && s.bullets.length > 0 && s.bullets.some((b: string) => b && b.trim().length > 0)) ||
      (s.paragraph && s.paragraph.trim().length > 0)
    );

    if (!hasAnyContent) {
      if (EXPORT_DEBUG) console.error('[EXPORT] No content found in sections:', structuredData.sections);
      throw new Error('Cannot export: Resume sections have no content. Please generate content for your sections first.');
    }

    if (EXPORT_DEBUG) console.log('[EXPORT] Validation passed, generating DOCX...');
    return this.generateDOCX(structuredData, fileName, templateId);
  },

  // HTML export
  async htmlExport(htmlContent: string, fileName: string) {
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    saveAs(blob, `${fileName}.html`);
  },

  // Plain text export
  async txtExport(structuredData: any, fileName: string) {
    const textContent = this.plainText(structuredData);
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `${fileName}.txt`);
  }
};

function createContainer(html: string, styles: any): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  Object.assign(container.style, styles);
  document.body.appendChild(container);
  return container;
}

function cleanupContainer(container: HTMLElement): void {
  document.body.removeChild(container);
}

async function htmlToPDF(container: HTMLElement, options: any = {}): Promise<jsPDF> {
  const canvas = await html2canvas(container, {
    scale: options.scale || 2,
    useCORS: true,
    logging: false
  });
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
  return pdf;
}

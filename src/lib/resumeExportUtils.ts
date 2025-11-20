import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export const exportFormats = {
  async standardPDF(htmlContent: string, fileName: string) {
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

  async generateDOCX(structuredData: any, fileName: string) {
    // Helper to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x26;/g, '&')
        .replace(/&#(\d+);/g, (_: string, dec: string) => String.fromCharCode(parseInt(dec)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));
    };

    const children: any[] = [
      new Paragraph({
        text: decodeHtmlEntities(structuredData.name || 'Resume'),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      }),
      new Paragraph({
        text: decodeHtmlEntities([
          structuredData.contact?.email || '',
          structuredData.contact?.phone || '',
          structuredData.contact?.location || ''
        ].filter(Boolean).join(' | ')),
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 }
      })
    ];

    // Add sections with proper formatting
    (structuredData.sections || []).forEach((section: any) => {
      const isExperienceSection = section.title.toLowerCase().includes('experience');
      const isSkillsSection = section.title.toLowerCase().includes('skill');

      // Section heading
      children.push(
        new Paragraph({
          text: decodeHtmlEntities(section.title.toUpperCase()),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          thematicBreak: false
        })
      );

      // Handle paragraph content (e.g., Summary)
      if (section.content) {
        children.push(
          new Paragraph({
            text: decodeHtmlEntities(section.content),
            spacing: { after: 120 }
          })
        );
      }

      // Handle bullet points
      if (section.bullets && Array.isArray(section.bullets) && section.bullets.length > 0) {
        if (isExperienceSection) {
          // Parse experience bullets which may contain job entries
          let currentJob: { title?: string; company?: string; bullets: string[] } | null = null;

          section.bullets.forEach((bullet: string) => {
            const decoded = decodeHtmlEntities(bullet);
            
            // Check if this is a job title (starts with # or is all caps)
            if (decoded.startsWith('#')) {
              // Flush previous job if exists
              if (currentJob) {
                const job: { title?: string; company?: string; bullets: string[] } = currentJob;
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
                    text: b,
                    bullet: { level: 0 },
                    spacing: { after: 60 }
                  }));
                });
              }

              // Start new job
              currentJob = {
                title: decoded.replace(/^#+\s*/, '').trim(),
                company: undefined,
                bullets: []
              };
            } else if (currentJob && decoded.includes('|') && !decoded.startsWith('-') && !decoded.startsWith('•')) {
              // This is likely a company | date line
              currentJob.company = decoded;
            } else if (currentJob) {
              // This is a bullet for the current job
              const cleanBullet = decoded.replace(/^[-•]\s*/, '').trim();
              if (cleanBullet) {
                currentJob.bullets.push(cleanBullet);
              }
            } else {
              // No current job context, just add as bullet
              const cleanBullet = decoded.replace(/^[-•]\s*/, '').trim();
              if (cleanBullet) {
                children.push(new Paragraph({
                  text: cleanBullet,
                  bullet: { level: 0 },
                  spacing: { after: 60 }
                }));
              }
            }
          });

          // Flush last job if exists
          if (currentJob) {
            const job: { title?: string; company?: string; bullets: string[] } = currentJob;
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
                text: b,
                bullet: { level: 0 },
                spacing: { after: 60 }
              }));
            });
          }
        } else if (isSkillsSection) {
          // Format skills in a more compact way
          const skillsText = section.bullets
            .map((b: string) => decodeHtmlEntities(b).replace(/^[-•]\s*/, '').trim())
            .filter(Boolean)
            .join(' • ');
          
          children.push(new Paragraph({
            text: skillsText,
            spacing: { after: 120 }
          }));
        } else {
          // Regular bullets for other sections
          section.bullets.forEach((bullet: string) => {
            const decoded = decodeHtmlEntities(bullet);
            const cleanBullet = decoded.replace(/^[-•]\s*/, '').trim();
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

  // Alias for generateDOCX
  async docxExport(structuredData: any, fileName: string) {
    return this.generateDOCX(structuredData, fileName);
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

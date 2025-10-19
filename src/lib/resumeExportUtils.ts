import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
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
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: structuredData.name || 'Resume',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: `${structuredData.contact?.email || ''} | ${structuredData.contact?.phone || ''}`,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: '' }),
          ...(structuredData.sections || []).flatMap((section: any) => [
            new Paragraph({
              text: section.title.toUpperCase(),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 }
            }),
            new Paragraph({
              text: section.content,
              spacing: { after: 240 }
            })
          ])
        ]
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

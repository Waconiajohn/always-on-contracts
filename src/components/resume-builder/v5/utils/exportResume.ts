import jsPDF from 'jspdf';
import type { EliteResumeData } from '../types';

export function exportResumeAsPDF(resumeData: EliteResumeData) {
  const doc = new jsPDF();
  
  // Set up fonts and margins
  const margin = 20;
  const lineHeight = 7;
  let y = margin;
  
  // Contact Info
  doc.setFontSize(18);
  doc.text(resumeData.contactInfo.name, margin, y);
  y += lineHeight + 3;
  
  doc.setFontSize(10);
  const contactLine = [
    resumeData.contactInfo.email,
    resumeData.contactInfo.phone,
    resumeData.contactInfo.location
  ].filter(Boolean).join(' • ');
  doc.text(contactLine, margin, y);
  y += lineHeight * 2;
  
  // Sections
  for (const section of resumeData.sections) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title.toUpperCase(), margin, y);
    y += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    
    // Role info
    if (section.roleInfo) {
      doc.setFont('helvetica', 'bold');
      doc.text(section.roleInfo.title, margin, y);
      y += lineHeight;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${section.roleInfo.company} • ${section.roleInfo.dates}`, margin, y);
      y += lineHeight;
    }
    
    // Paragraph
    if (section.paragraph) {
      const splitParagraph = doc.splitTextToSize(section.paragraph, 170);
      doc.text(splitParagraph, margin, y);
      y += splitParagraph.length * lineHeight;
    }
    
    // Bullets
    if (section.bullets) {
      for (const bullet of section.bullets) {
        const bulletText = bullet.userEditedText || bullet.text;
        const splitText = doc.splitTextToSize(`• ${bulletText}`, 165);
        doc.text(splitText, margin + 5, y);
        y += splitText.length * lineHeight;
        
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
      }
    }
    
    y += lineHeight;
  }
  
  doc.save('elite-resume.pdf');
}

export function exportResumeAsText(resumeData: EliteResumeData): string {
  let text = '';
  
  // Contact Info
  text += `${resumeData.contactInfo.name}\n`;
  text += `${resumeData.contactInfo.email} • ${resumeData.contactInfo.phone} • ${resumeData.contactInfo.location}\n`;
  if (resumeData.contactInfo.linkedin) {
    text += `${resumeData.contactInfo.linkedin}\n`;
  }
  text += '\n';
  
  // Sections
  for (const section of resumeData.sections) {
    text += `${section.title.toUpperCase()}\n`;
    text += '='.repeat(section.title.length) + '\n\n';
    
    // Role info
    if (section.roleInfo) {
      text += `${section.roleInfo.title}\n`;
      text += `${section.roleInfo.company} • ${section.roleInfo.dates}\n\n`;
    }
    
    // Paragraph content
    if (section.paragraph) {
      text += `${section.paragraph}\n\n`;
    }
    
    // Bullets
    if (section.bullets) {
      for (const bullet of section.bullets) {
        const bulletText = bullet.userEditedText || bullet.text;
        text += `• ${bulletText}\n`;
      }
    }
    
    text += '\n';
  }
  
  return text;
}

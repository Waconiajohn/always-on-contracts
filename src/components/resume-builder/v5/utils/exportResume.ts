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
    
    // Experience section with multiple positions
    if (section.type === 'experience' && section.positions) {
      // Company header
      if (section.company) {
        doc.setFont('helvetica', 'bold');
        doc.text(section.company, margin, y);
        y += lineHeight;
      }
      
      // Each position under the company
      for (const position of section.positions) {
        doc.setFont('helvetica', 'bold');
        doc.text(position.title, margin + 5, y);
        y += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        doc.text(position.dates, margin + 5, y);
        y += lineHeight;
        
        // Position bullets
        for (const bullet of position.bullets) {
          const bulletText = bullet.userEditedText || bullet.text;
          const splitText = doc.splitTextToSize(`• ${bulletText}`, 160);
          doc.text(splitText, margin + 10, y);
          y += splitText.length * lineHeight;
          
          if (y > 270) {
            doc.addPage();
            y = margin;
          }
        }
        y += lineHeight / 2;
      }
    }
    // Education section
    else if (section.type === 'education' && section.entries) {
      for (const entry of section.entries) {
        const eduEntry = entry as { institution: string; degree: string; field?: string; graduationYear?: string; gpa?: string };
        doc.setFont('helvetica', 'bold');
        doc.text(eduEntry.institution, margin, y);
        y += lineHeight;
        
        doc.setFont('helvetica', 'normal');
        const degreeLine = `${eduEntry.degree}${eduEntry.field ? ` in ${eduEntry.field}` : ''}`;
        doc.text(degreeLine, margin, y);
        y += lineHeight;
        
        if (eduEntry.graduationYear) {
          doc.text(eduEntry.graduationYear, margin, y);
          y += lineHeight;
        }
        
        if (eduEntry.gpa) {
          doc.text(`GPA: ${eduEntry.gpa}`, margin, y);
          y += lineHeight;
        }
        y += lineHeight / 2;
      }
    }
    // Certifications section
    else if (section.type === 'certifications' && section.entries) {
      for (const entry of section.entries) {
        const certEntry = entry as { name: string; issuer?: string; year?: string };
        const certLine = [certEntry.name, certEntry.issuer, certEntry.year].filter(Boolean).join(' • ');
        doc.text(certLine, margin, y);
        y += lineHeight;
      }
    }
    // Skills section
    else if (section.type === 'skills' && section.skills) {
      const skillsText = section.skills.join(', ');
      const splitSkills = doc.splitTextToSize(skillsText, 170);
      doc.text(splitSkills, margin, y);
      y += splitSkills.length * lineHeight;
    }
    // Standard section (summary, etc.)
    else {
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
    
    // Experience section with multiple positions
    if (section.type === 'experience' && section.positions) {
      // Company header
      if (section.company) {
        text += `${section.company}\n`;
      }
      
      // Each position under the company
      for (const position of section.positions) {
        text += `  ${position.title}\n`;
        text += `  ${position.dates}\n`;
        
        // Position bullets
        for (const bullet of position.bullets) {
          const bulletText = bullet.userEditedText || bullet.text;
          text += `    • ${bulletText}\n`;
        }
        text += '\n';
      }
    }
    // Education section
    else if (section.type === 'education' && section.entries) {
      for (const entry of section.entries) {
        const eduEntry = entry as { institution: string; degree: string; field?: string; graduationYear?: string; gpa?: string };
        text += `${eduEntry.institution}\n`;
        text += `${eduEntry.degree}${eduEntry.field ? ` in ${eduEntry.field}` : ''}\n`;
        if (eduEntry.graduationYear) {
          text += `${eduEntry.graduationYear}\n`;
        }
        if (eduEntry.gpa) {
          text += `GPA: ${eduEntry.gpa}\n`;
        }
        text += '\n';
      }
    }
    // Certifications section
    else if (section.type === 'certifications' && section.entries) {
      for (const entry of section.entries) {
        const certEntry = entry as { name: string; issuer?: string; year?: string };
        text += `• ${certEntry.name}`;
        if (certEntry.issuer) text += ` • ${certEntry.issuer}`;
        if (certEntry.year) text += ` • ${certEntry.year}`;
        text += '\n';
      }
    }
    // Skills section
    else if (section.type === 'skills' && section.skills) {
      text += section.skills.join(', ') + '\n';
    }
    // Standard section (summary, etc.)
    else {
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
    }
    
    text += '\n';
  }
  
  return text;
}

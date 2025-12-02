/**
 * Export utilities for Elite Resume Builder
 */

import type { EliteResumeData } from '../types';

export async function exportResumeAsPDF(resumeData: EliteResumeData): Promise<void> {
  // Create a simple text version for now
  // In production, you'd use jspdf or similar
  const text = formatResumeAsText(resumeData);
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resumeData.contactInfo.name.replace(/\s+/g, '_')}_Resume.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportResumeAsDocx(resumeData: EliteResumeData): Promise<void> {
  // Create a simple text version for now
  // In production, you'd use docx library
  const text = formatResumeAsText(resumeData);
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resumeData.contactInfo.name.replace(/\s+/g, '_')}_Resume.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatResumeAsText(resumeData: EliteResumeData): string {
  let text = '';
  
  // Header
  text += `${resumeData.contactInfo.name}\n`;
  text += `${resumeData.contactInfo.email} | ${resumeData.contactInfo.phone}\n`;
  text += `${resumeData.contactInfo.location}`;
  if (resumeData.contactInfo.linkedin) {
    text += ` | ${resumeData.contactInfo.linkedin}`;
  }
  text += '\n\n';
  
  // Sections
  for (const section of resumeData.sections) {
    text += `${section.title.toUpperCase()}\n`;
    text += '─'.repeat(50) + '\n\n';
    
    // Role info for experience sections
    if (section.roleInfo) {
      text += `${section.roleInfo.title}\n`;
      text += `${section.roleInfo.company} | ${section.roleInfo.dates}\n\n`;
    }
    
    // Paragraph content
    if (section.paragraph) {
      text += `${section.paragraph}\n\n`;
    }
    
    // Bullets
    for (const bullet of section.bullets) {
      const bulletText = bullet.userEditedText || bullet.text;
      text += `• ${bulletText}\n`;
    }
    
    text += '\n';
  }
  
  return text;
}

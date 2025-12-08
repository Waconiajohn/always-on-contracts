/**
 * V8 Resume Export Utilities
 * PDF, DOCX, and TXT generation
 */

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { ResumeSection, SectionType, DetectedInfo } from '../types';

interface ExportData {
  sections: Record<SectionType, ResumeSection>;
  detected: DetectedInfo;
  finalScore: number;
}

const SECTION_ORDER: SectionType[] = ['summary', 'experience', 'skills', 'education', 'certifications'];

/**
 * Export resume as PDF
 */
export async function exportAsPDF(data: ExportData): Promise<void> {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  // Title - Detected Role
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.detected.role, margin, y);
  y += 8;

  // Subtitle - Industry & Level
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`${data.detected.industry} • ${data.detected.level}`, margin, y);
  doc.setTextColor(0);
  y += 12;

  // Horizontal line
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Sections
  for (const sectionId of SECTION_ORDER) {
    const section = data.sections[sectionId];
    if (!section.content.trim()) continue;

    // Check for page break
    if (y > 260) {
      doc.addPage();
      y = margin;
    }

    // Section Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title.toUpperCase(), margin, y);
    y += 7;

    // Section Content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const lines = doc.splitTextToSize(section.content, maxWidth);
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 5;
    }
    
    y += 8;
  }

  // Save with role-based filename
  const filename = `${data.detected.role.replace(/\s+/g, '_')}_resume.pdf`;
  doc.save(filename);
}

/**
 * Export resume as DOCX
 */
export async function exportAsDOCX(data: ExportData): Promise<void> {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: data.detected.role,
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 }
    })
  );

  // Subtitle
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${data.detected.industry} • ${data.detected.level}`,
          italics: true,
          color: '666666'
        })
      ],
      spacing: { after: 300 }
    })
  );

  // Sections
  for (const sectionId of SECTION_ORDER) {
    const section = data.sections[sectionId];
    if (!section.content.trim()) continue;

    // Section Header
    children.push(
      new Paragraph({
        text: section.title.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 }
      })
    );

    // Section Content - split by paragraphs
    const paragraphs = section.content.split('\n').filter(p => p.trim());
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para })],
          spacing: { after: 100 }
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${data.detected.role.replace(/\s+/g, '_')}_resume.docx`;
  saveAs(blob, filename);
}

/**
 * Export resume as plain text
 */
export async function exportAsTXT(data: ExportData): Promise<void> {
  let text = '';

  // Header
  text += data.detected.role + '\n';
  text += `${data.detected.industry} | ${data.detected.level}\n`;
  text += '='.repeat(50) + '\n\n';

  // Sections
  for (const sectionId of SECTION_ORDER) {
    const section = data.sections[sectionId];
    if (!section.content.trim()) continue;

    text += section.title.toUpperCase() + '\n';
    text += '-'.repeat(section.title.length) + '\n';
    text += section.content + '\n\n';
  }

  // Create and download file
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const filename = `${data.detected.role.replace(/\s+/g, '_')}_resume.txt`;
  saveAs(blob, filename);
}

/**
 * Copy resume to clipboard
 */
export async function copyToClipboard(data: ExportData): Promise<boolean> {
  let text = '';

  for (const sectionId of SECTION_ORDER) {
    const section = data.sections[sectionId];
    if (!section.content.trim()) continue;

    text += section.title.toUpperCase() + '\n';
    text += section.content + '\n\n';
  }

  try {
    await navigator.clipboard.writeText(text.trim());
    return true;
  } catch {
    return false;
  }
}

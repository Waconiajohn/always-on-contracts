// =====================================================
// EXPORT OPTIONS - V3 Resume Export
// =====================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileType, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OptimizedResume } from "@/stores/resumeBuilderV3Store";
import { exportFormats } from "@/lib/resumeExportUtils";

interface ExportOptionsV3Props {
  resume: OptimizedResume;
}

export function ExportOptionsV3({ resume }: ExportOptionsV3Props) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const formatResumeAsText = (r: OptimizedResume) => {
    let text = "";
    
    // Header
    text += `${r.header.name}\n`;
    text += `${r.header.title}\n`;
    if (r.header.contact) text += `${r.header.contact}\n`;
    text += "\n";
    
    // Summary
    text += "PROFESSIONAL SUMMARY\n";
    text += `${r.summary}\n\n`;
    
    // Experience
    text += "EXPERIENCE\n";
    r.experience.forEach((exp) => {
      text += `${exp.title} | ${exp.company} | ${exp.dates}\n`;
      exp.bullets.forEach((bullet) => {
        text += `• ${bullet}\n`;
      });
      text += "\n";
    });
    
    // Skills
    text += "SKILLS\n";
    text += r.skills.join(" • ") + "\n\n";
    
    // Education
    if (r.education?.length) {
      text += "EDUCATION\n";
      r.education.forEach((edu) => {
        text += `${edu.degree} - ${edu.institution}`;
        if (edu.year) text += ` (${edu.year})`;
        text += "\n";
      });
      text += "\n";
    }
    
    // Certifications
    if (r.certifications?.length) {
      text += "CERTIFICATIONS\n";
      r.certifications.forEach((cert) => {
        text += `• ${cert}\n`;
      });
    }
    
    return text;
  };

  const prepareExportData = (r: OptimizedResume) => {
    const sections = [
      {
        title: "Professional Summary",
        type: "summary",
        content: r.summary,
        bullets: [],
        paragraph: r.summary,
      },
      {
        title: "Experience",
        type: "experience",
        content: "",
        bullets: r.experience.flatMap(exp => [
          `${exp.title} | ${exp.company} | ${exp.dates}`,
          ...exp.bullets.map(b => `• ${b}`)
        ]),
      },
      {
        title: "Skills",
        type: "skills",
        content: r.skills.join(" • "),
        bullets: r.skills,
      },
    ];

    if (r.education?.length) {
      sections.push({
        title: "Education",
        type: "education",
        content: "",
        bullets: r.education.map(edu => 
          `${edu.degree} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`
        ),
      });
    }

    if (r.certifications?.length) {
      sections.push({
        title: "Certifications",
        type: "certifications",
        content: "",
        bullets: r.certifications,
      });
    }

    return {
      name: r.header.name,
      contact: {
        headline: r.header.title,
        email: r.header.contact?.split('|')[0]?.trim(),
        phone: r.header.contact?.split('|')[1]?.trim(),
        location: r.header.contact?.split('|')[2]?.trim(),
      },
      sections,
    };
  };

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    setIsExporting(format);
    const fileName = `${resume.header.name.replace(/\s+/g, '-')}-Resume`;

    try {
      if (format === 'txt') {
        const textContent = formatResumeAsText(resume);
        const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Resume downloaded as TXT");
      } else if (format === 'docx') {
        const data = prepareExportData(resume);
        await exportFormats.docxExport(data, fileName, 'modern');
        toast.success("Resume downloaded as DOCX");
      } else if (format === 'pdf') {
        const data = prepareExportData(resume);
        const html = generateResumeHTML(data);
        await exportFormats.standardPDF(html, fileName);
        toast.success("Resume downloaded as PDF");
      }
    } catch (error) {
      console.error(`Export ${format} failed:`, error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={!!isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-1" />
          )}
          Download
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('txt')} disabled={!!isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Plain Text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('docx')} disabled={!!isExporting}>
          <FileType className="h-4 w-4 mr-2" />
          Word Document (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={!!isExporting}>
          <File className="h-4 w-4 mr-2" />
          PDF Document (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Simple HTML generator for PDF export
function generateResumeHTML(data: any): string {
  const sectionsHTML = data.sections.map((section: any) => {
    const content = section.bullets?.length 
      ? `<ul>${section.bullets.map((b: string) => `<li>${b}</li>`).join('')}</ul>`
      : `<p>${section.content || ''}</p>`;
    
    return `
      <section style="margin-bottom: 20px;">
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">${section.title}</h2>
        ${content}
      </section>
    `;
  }).join('');

  const contactParts = [
    data.contact?.email,
    data.contact?.phone,
    data.contact?.location
  ].filter(Boolean);

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
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        header { 
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #7c3aed;
        }
        h1 { font-size: 28px; color: #7c3aed; margin-bottom: 8px; }
        .headline { color: #64748b; font-size: 16px; }
        .contact { margin-top: 10px; color: #64748b; font-size: 14px; }
        ul { list-style-position: inside; padding-left: 0; }
        li { margin-bottom: 8px; padding-left: 16px; text-indent: -16px; }
        p { margin-bottom: 12px; }
      </style>
    </head>
    <body>
      <header>
        <h1>${data.name}</h1>
        ${data.contact?.headline ? `<p class="headline">${data.contact.headline}</p>` : ''}
        ${contactParts.length > 0 ? `<p class="contact">${contactParts.join(' | ')}</p>` : ''}
      </header>
      <main>${sectionsHTML}</main>
    </body>
    </html>
  `;
}

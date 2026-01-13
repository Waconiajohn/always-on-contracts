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
import { formatResumeAsText, prepareExportData, generateResumeHTML } from "./utils/formatters";

interface ExportOptionsV3Props {
  resume: OptimizedResume;
}

// Sanitize filename by removing special characters and limiting length
const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')            // Spaces to dashes
    .replace(/-+/g, '-')             // Collapse multiple dashes
    .substring(0, 100);              // Limit length
};

export function ExportOptionsV3({ resume }: ExportOptionsV3Props) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'txt' | 'docx' | 'pdf') => {
    setIsExporting(format);
    const fileName = sanitizeFilename(`${resume.header.name}-Resume`);

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
        // Use 'executive' template for professional formatting
        await exportFormats.docxExport(data, fileName, 'executive');
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
        <DropdownMenuItem 
          onClick={() => handleExport('txt')} 
          disabled={!!isExporting}
          aria-label="Download resume as plain text file"
        >
          <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
          Plain Text (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('docx')} 
          disabled={!!isExporting}
          aria-label="Download resume as Word document"
        >
          <FileType className="h-4 w-4 mr-2" aria-hidden="true" />
          Word Document (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport('pdf')} 
          disabled={!!isExporting}
          aria-label="Download resume as PDF document"
        >
          <File className="h-4 w-4 mr-2" aria-hidden="true" />
          PDF Document (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// HTML generation moved to utils/formatters.ts

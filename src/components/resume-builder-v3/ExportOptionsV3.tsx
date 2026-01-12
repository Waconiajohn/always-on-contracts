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

export function ExportOptionsV3({ resume }: ExportOptionsV3Props) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

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

// HTML generation moved to utils/formatters.ts

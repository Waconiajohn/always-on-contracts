import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit2, FileText, Clock, TrendingUp, Download, FileType, Loader2 } from "lucide-react";
import { MasterResume } from "@/types/master-resume";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

interface MasterResumeViewerProps {
  resume: MasterResume;
  onEdit: () => void;
}

export const MasterResumeViewer = ({ resume, onEdit }: MasterResumeViewerProps) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'txt' | 'pdf') => {
    setIsExporting(format);
    const fileName = `Master-Resume-v${resume.version}`;

    try {
      if (format === 'txt') {
        const blob = new Blob([resume.content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `${fileName}.txt`);
        toast.success("Master Resume exported as TXT");
      } else if (format === 'pdf') {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - margin * 2;
        
        doc.setFont('helvetica');
        doc.setFontSize(12);
        
        const lines = doc.splitTextToSize(resume.content, maxWidth);
        let y = margin;
        const lineHeight = 6;
        const pageHeight = doc.internal.pageSize.getHeight();
        
        for (const line of lines) {
          if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
        
        doc.save(`${fileName}.pdf`);
        toast.success("Master Resume exported as PDF");
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Your Master Resume</h2>
            <p className="text-sm text-muted-foreground">
              Your complete career history in one place
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={!!isExporting}>
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('txt')} className="gap-2">
                <FileType className="h-4 w-4" />
                Plain Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="gap-2">
                <FileText className="h-4 w-4" />
                PDF Document (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onEdit} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Resume
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          {resume.word_count || 0} words
        </Badge>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          Version {resume.version}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Updated {formatDistanceToNow(new Date(resume.updated_at), { addSuffix: true })}
        </Badge>
      </div>

      <ScrollArea className="h-[600px] rounded-lg border bg-muted/30 p-6">
        <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {resume.content || (
            <p className="text-muted-foreground italic">
              No content yet. Click "Edit Resume" to add your resume content.
            </p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

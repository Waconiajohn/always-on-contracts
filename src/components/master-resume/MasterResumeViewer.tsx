import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, FileText, Clock, TrendingUp } from "lucide-react";
import { MasterResume } from "@/types/master-resume";
import { formatDistanceToNow } from "date-fns";

interface MasterResumeViewerProps {
  resume: MasterResume;
  onEdit: () => void;
}

export const MasterResumeViewer = ({ resume, onEdit }: MasterResumeViewerProps) => {
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
        <Button onClick={onEdit} className="gap-2">
          <Edit2 className="h-4 w-4" />
          Edit Resume
        </Button>
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

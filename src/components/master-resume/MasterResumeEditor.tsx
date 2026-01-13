import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, FileText, Loader2 } from "lucide-react";
import { MasterResume } from "@/types/master-resume";

interface MasterResumeEditorProps {
  resume: MasterResume | null;
  onSave: (content: string) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const MasterResumeEditor = ({ 
  resume, 
  onSave, 
  onCancel, 
  isSaving 
}: MasterResumeEditorProps) => {
  const [content, setContent] = useState(resume?.content || "");

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const handleSave = () => {
    onSave(content);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {resume ? "Edit Master Resume" : "Create Master Resume"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {resume 
                ? "Update your complete career history" 
                : "Paste your most comprehensive resume to get started"
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Resume
          </Button>
        </div>
      </div>

      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Paste your complete resume below
        </span>
        <span className="text-sm text-muted-foreground">
          {wordCount} words
        </span>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Paste your complete resume here...

Include:
• Contact information
• Professional summary
• All work experience with detailed bullet points
• Education
• Skills
• Certifications
• Achievements

The more comprehensive, the better! This will be your master source for all tailored resumes.`}
        className="min-h-[600px] font-mono text-sm resize-none"
      />

      <p className="mt-4 text-xs text-muted-foreground">
        💡 Tip: Include everything you've ever accomplished. When you create tailored resumes, 
        new content will be suggested to add back here, so your Master Resume grows over time.
      </p>
    </Card>
  );
};

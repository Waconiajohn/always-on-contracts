import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LiveResumeCanvas } from "./LiveResumeCanvas";
import { CanonicalResume } from "@/lib/resumeModel";
import { RESUME_FORMATS } from "@/lib/resumeFormats";
import { useState } from "react";

interface TemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplateId: string;
  resumeData: CanonicalResume;
}

export function TemplatePreviewModal({
  open,
  onClose,
  onSelectTemplate,
  currentTemplateId,
  resumeData
}: TemplatePreviewModalProps) {
  const [previewId, setPreviewId] = useState(currentTemplateId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-6 overflow-hidden">
          {/* Sidebar: Template List */}
          <div className="w-64 flex flex-col gap-2 overflow-y-auto pr-2">
            {RESUME_FORMATS.map(format => (
              <div
                key={format.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  previewId === format.templateId
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:border-muted bg-muted/50"
                }`}
                onClick={() => setPreviewId(format.templateId)}
              >
                <div className="text-2xl mb-2">{format.icon}</div>
                <div className="font-semibold">{format.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{format.description}</div>
              </div>
            ))}
          </div>

          {/* Preview Area */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 overflow-auto p-8 flex justify-center">
                <LiveResumeCanvas
                  resumeData={resumeData}
                  templateId={previewId}
                  onSectionClick={() => {}}
                  scale={0.7}
                />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            onSelectTemplate(previewId);
            onClose();
          }}>
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, X, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: any;
  order: number;
  vaultItemsUsed?: string[];
}

interface ResumePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ResumeSection[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  currentSectionId?: string;
  overallQuality?: {
    atsScore: number;
    requirementCoverage: number;
    completedSections: number;
    totalSections: number;
  };
  onExport?: (format: 'pdf' | 'docx' | 'html') => void;
}

export const ResumePreviewModal = ({
  isOpen,
  onClose,
  sections,
  contactInfo = {
    name: "Your Name",
    email: "",
    phone: "",
    location: "",
    linkedin: ""
  },
  currentSectionId,
  overallQuality = {
    atsScore: 0,
    requirementCoverage: 0,
    completedSections: 0,
    totalSections: 0
  },
  onExport
}: ResumePreviewModalProps) => {

  const renderSectionContent = (content: any) => {
    if (typeof content === 'string') {
      return <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>;
    } else if (Array.isArray(content)) {
      return (
        <ul className="space-y-2">
          {content.map((item: any, idx: number) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{typeof item === 'string' ? item : item.content || JSON.stringify(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else if (typeof content === 'object' && content.content) {
      return renderSectionContent(content.content);
    }
    return <pre className="text-xs">{JSON.stringify(content, null, 2)}</pre>;
  };

  const completedSections = sections.filter(s => s.content && 
    (typeof s.content === 'string' ? s.content.length > 0 : 
     Array.isArray(s.content) ? s.content.length > 0 : 
     Object.keys(s.content).length > 0)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Resume Preview</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Live preview of your resume as you build
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Overall Quality Indicators */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                overallQuality.atsScore >= 80 ? "bg-success/20" :
                overallQuality.atsScore >= 60 ? "bg-warning/20" : "bg-destructive/20"
              )}>
                <Target className={cn(
                  "h-6 w-6",
                  overallQuality.atsScore >= 80 ? "text-success" :
                  overallQuality.atsScore >= 60 ? "text-warning" : "text-destructive"
                )} />
              </div>
              <div>
                <div className="text-2xl font-bold">{overallQuality.atsScore}%</div>
                <div className="text-xs text-muted-foreground">ATS Score</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center",
                overallQuality.requirementCoverage >= 80 ? "bg-success/20" :
                overallQuality.requirementCoverage >= 60 ? "bg-warning/20" : "bg-destructive/20"
              )}>
                <TrendingUp className={cn(
                  "h-6 w-6",
                  overallQuality.requirementCoverage >= 80 ? "text-success" :
                  overallQuality.requirementCoverage >= 60 ? "text-warning" : "text-destructive"
                )} />
              </div>
              <div>
                <div className="text-2xl font-bold">{overallQuality.requirementCoverage}%</div>
                <div className="text-xs text-muted-foreground">Requirements</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {completedSections.length}
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {completedSections.length}/{sections.length}
                </div>
                <div className="text-xs text-muted-foreground">Sections</div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            {/* Resume Document */}
            <div className="bg-white text-black p-12 rounded-lg shadow-2xl min-h-[1000px] max-w-4xl mx-auto">
              {/* Contact Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-gray-800">
                <h1 className="text-4xl font-bold mb-3">{contactInfo.name}</h1>
                <div className="text-sm space-y-1 text-gray-700">
                  {contactInfo.email && <div>{contactInfo.email}</div>}
                  {contactInfo.phone && <div>{contactInfo.phone}</div>}
                  {contactInfo.location && <div>{contactInfo.location}</div>}
                  {contactInfo.linkedin && <div>{contactInfo.linkedin}</div>}
                </div>
              </div>

              {/* Resume Sections */}
              {sections
                .sort((a, b) => a.order - b.order)
                .map((section) => {
                  const isCurrentSection = currentSectionId === section.id;
                  const hasContent = section.content && 
                    (typeof section.content === 'string' ? section.content.length > 0 : 
                     Array.isArray(section.content) ? section.content.length > 0 : 
                     Object.keys(section.content).length > 0);

                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "mb-8 pb-6 border-b border-gray-300 transition-all",
                        isCurrentSection && "ring-2 ring-primary rounded-lg p-4 -mx-4"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                          {section.title}
                        </h2>
                        {isCurrentSection && (
                          <Badge variant="default" className="ml-2">
                            Current Section
                          </Badge>
                        )}
                      </div>

                      {hasContent ? (
                        <div className="prose prose-sm max-w-none text-gray-800">
                          {renderSectionContent(section.content)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic py-4">
                          Section not completed yet
                        </div>
                      )}

                      {section.vaultItemsUsed && section.vaultItemsUsed.length > 0 && (
                        <div className="mt-3 text-xs text-gray-500">
                          ✓ {section.vaultItemsUsed.length} vault item{section.vaultItemsUsed.length !== 1 ? 's' : ''} used
                        </div>
                      )}
                    </div>
                  );
                })}

              {completedSections.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-lg mb-2">No sections completed yet</p>
                  <p className="text-sm">Start generating sections to see your resume preview</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        {onExport && completedSections.length > 0 && (
          <div className="px-6 py-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Export your resume when ready
              </p>
              <div className="flex gap-2">
                <Button onClick={() => onExport('pdf')} variant="default" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button onClick={() => onExport('docx')} variant="outline">
                  Export DOCX
                </Button>
                <Button onClick={() => onExport('html')} variant="outline">
                  Export HTML
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

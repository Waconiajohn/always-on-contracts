import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Download, 
  X, 
  TrendingUp, 
  Target, 
  Edit2, 
  Check, 
  GripVertical, 
  Wand2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatResumeContent } from "@/lib/resumeFormatting";
import { useToast } from "@/hooks/use-toast";

// =============================================================================
// SMART RESUME PREVIEW COMPONENT
// Unified from ResumePreviewModal.tsx + EditableResumePreview.tsx
// =============================================================================

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ResumeSection {
  id: string;
  type: string;
  title: string;
  content: any;
  order: number;
  resumeItemsUsed?: string[];
}

interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
}

interface OverallQuality {
  atsScore: number;
  requirementCoverage: number;
  completedSections: number;
  totalSections: number;
}

interface SmartResumePreviewProps {
  mode: 'view' | 'edit' | 'modal';
  
  // Data
  sections: ResumeSection[];
  contactInfo?: ContactInfo;
  structuredData?: any;
  
  // Modal-specific
  isOpen?: boolean;
  onClose?: () => void;
  
  // Quality indicators (modal/view modes)
  overallQuality?: OverallQuality;
  
  // Edit mode
  onUpdate?: (updatedContent: string) => void;
  
  // Export
  onExport?: (format: 'pdf' | 'docx' | 'html') => void;
  
  // Styling
  currentSectionId?: string;
}

// -----------------------------------------------------------------------------
// Shared Helpers
// -----------------------------------------------------------------------------

const defaultContactInfo: ContactInfo = {
  name: "Your Name",
  email: "",
  phone: "",
  location: "",
  linkedin: ""
};

const defaultQuality: OverallQuality = {
  atsScore: 0,
  requirementCoverage: 0,
  completedSections: 0,
  totalSections: 0
};

function renderSectionContent(content: any) {
  if (typeof content === 'string') {
    const cleaned = formatResumeContent(content);
    return <p className="text-sm leading-relaxed whitespace-pre-line">{cleaned}</p>;
  } else if (Array.isArray(content)) {
    return (
      <ul className="space-y-2">
        {content.map((item: any, idx: number) => {
          const text = typeof item === 'string' ? item : item.content || JSON.stringify(item);
          const cleaned = formatResumeContent(text);
          return (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{cleaned}</span>
            </li>
          );
        })}
      </ul>
    );
  } else if (typeof content === 'object' && content.content) {
    return renderSectionContent(content.content);
  }
  const cleaned = formatResumeContent(JSON.stringify(content, null, 2));
  return <pre className="text-xs">{cleaned}</pre>;
}

function hasContent(section: ResumeSection): boolean {
  return section.content && 
    (typeof section.content === 'string' ? section.content.length > 0 : 
     Array.isArray(section.content) ? section.content.length > 0 : 
     Object.keys(section.content).length > 0);
}

// -----------------------------------------------------------------------------
// Quality Indicators Component
// -----------------------------------------------------------------------------

function QualityIndicators({ quality, completedCount, totalCount }: { 
  quality: OverallQuality; 
  completedCount: number;
  totalCount: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-4 mt-4">
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center",
          quality.atsScore >= 80 ? "bg-success/20" :
          quality.atsScore >= 60 ? "bg-warning/20" : "bg-destructive/20"
        )}>
          <Target className={cn(
            "h-6 w-6",
            quality.atsScore >= 80 ? "text-success" :
            quality.atsScore >= 60 ? "text-warning" : "text-destructive"
          )} />
        </div>
        <div>
          <div className="text-2xl font-bold">{quality.atsScore}%</div>
          <div className="text-xs text-muted-foreground">ATS Score</div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div className={cn(
          "h-12 w-12 rounded-full flex items-center justify-center",
          quality.requirementCoverage >= 80 ? "bg-success/20" :
          quality.requirementCoverage >= 60 ? "bg-warning/20" : "bg-destructive/20"
        )}>
          <TrendingUp className={cn(
            "h-6 w-6",
            quality.requirementCoverage >= 80 ? "text-success" :
            quality.requirementCoverage >= 60 ? "text-warning" : "text-destructive"
          )} />
        </div>
        <div>
          <div className="text-2xl font-bold">{quality.requirementCoverage}%</div>
          <div className="text-xs text-muted-foreground">Requirements</div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="text-xl font-bold text-primary">
            {completedCount}
          </span>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-muted-foreground">Sections</div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Resume Document Component (shared between view and modal)
// -----------------------------------------------------------------------------

function ResumeDocument({ 
  sections, 
  contactInfo, 
  currentSectionId 
}: { 
  sections: ResumeSection[]; 
  contactInfo: ContactInfo;
  currentSectionId?: string;
}) {
  const completedSections = sections.filter(hasContent);

  return (
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
          const sectionHasContent = hasContent(section);

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

              {sectionHasContent ? (
                <div className="prose prose-sm max-w-none text-gray-800">
                  {renderSectionContent(section.content)}
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic py-4">
                  Section not completed yet
                </div>
              )}

              {section.resumeItemsUsed && section.resumeItemsUsed.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  ✓ {section.resumeItemsUsed.length} resume item{section.resumeItemsUsed.length !== 1 ? 's' : ''} used
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
  );
}

// -----------------------------------------------------------------------------
// Edit Mode Component
// -----------------------------------------------------------------------------

interface EditSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'list' | 'experience';
}

function EditMode({ 
  structuredData, 
  onUpdate 
}: { 
  structuredData: any; 
  onUpdate: (content: string) => void;
}) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sections, setSections] = useState<EditSection[]>([
    { id: 'header', title: 'Header', content: structuredData?.name || '', order: 1, type: 'text' },
    { id: 'summary', title: 'Professional Summary', content: structuredData?.summary || '', order: 2, type: 'text' },
    { id: 'experience', title: 'Experience', content: JSON.stringify(structuredData?.experience || []), order: 3, type: 'experience' },
    { id: 'skills', title: 'Skills', content: structuredData?.skills?.join(', ') || '', order: 4, type: 'list' },
    { id: 'education', title: 'Education', content: JSON.stringify(structuredData?.education || []), order: 5, type: 'text' },
  ]);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEdit = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const handleSave = (sectionId: string, newContent: string) => {
    setSections(prev => 
      prev.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
    );
    setEditingSection(null);
    
    const updatedHtml = sections.map(s => `<div class="section">${s.content}</div>`).join('\n');
    onUpdate(updatedHtml);
    
    toast({
      title: "Section updated",
      description: "Your changes have been saved"
    });
  };

  const handleCancel = () => {
    setEditingSection(null);
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;

    setSections(prev => {
      const draggedIndex = prev.findIndex(s => s.id === draggedSection);
      const targetIndex = prev.findIndex(s => s.id === targetId);
      
      const newSections = [...prev];
      const [removed] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, removed);
      
      return newSections.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    toast({
      title: "Section reordered",
      description: "Resume layout updated"
    });
  };

  const handleAISuggestion = async (_sectionId: string) => {
    toast({
      title: "Generating suggestion...",
      description: "AI is analyzing this section"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Edit2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Visual Editor Mode</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Click sections to edit • Drag to reorder
        </span>
      </div>

      <Card className="border-2 border-dashed border-muted-foreground/20">
        <div className="p-8 bg-white space-y-6">
          {sections.sort((a, b) => a.order - b.order).map(section => (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(section.id)}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative p-4 rounded-lg border-2 transition-all",
                editingSection === section.id 
                  ? "border-primary bg-primary/5" 
                  : "border-transparent hover:border-muted-foreground/20 hover:bg-muted/30",
                draggedSection === section.id && "opacity-50"
              )}
            >
              {/* Drag Handle */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* Edit Controls */}
              {editingSection !== section.id && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAISuggestion(section.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(section.id)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              <div className="pr-20">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                  {section.title}
                </h3>

                {editingSection === section.id ? (
                  <div className="space-y-2">
                    {section.type === 'text' && (
                      <Textarea
                        defaultValue={section.content}
                        className="min-h-[100px] font-sans"
                        id={`edit-${section.id}`}
                      />
                    )}
                    
                    {section.type === 'list' && (
                      <Input
                        defaultValue={section.content}
                        placeholder="Comma-separated items"
                        id={`edit-${section.id}`}
                      />
                    )}

                    {section.type === 'experience' && (
                      <Textarea
                        defaultValue={section.content}
                        className="min-h-[200px] font-mono text-xs"
                        placeholder="Edit experience JSON"
                        id={`edit-${section.id}`}
                      />
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`edit-${section.id}`) as HTMLInputElement | HTMLTextAreaElement;
                          handleSave(section.id, input.value);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {section.type === 'experience' ? (
                      <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                        {section.content}
                      </pre>
                    ) : (
                      <p className="text-foreground whitespace-pre-wrap">
                        {section.content}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
        <p className="font-semibold">Quick Tips:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Hover over any section to see edit options</li>
          <li>Use the wand icon for AI-powered content suggestions</li>
          <li>Drag sections by the grip handle to reorder</li>
          <li>Changes are saved automatically</li>
        </ul>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function SmartResumePreview({
  mode,
  sections,
  contactInfo = defaultContactInfo,
  structuredData,
  isOpen = false,
  onClose,
  overallQuality = defaultQuality,
  onUpdate,
  onExport,
  currentSectionId
}: SmartResumePreviewProps) {
  const completedSections = sections.filter(hasContent);

  // Modal mode
  if (mode === 'modal') {
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

            <QualityIndicators 
              quality={overallQuality} 
              completedCount={completedSections.length}
              totalCount={sections.length}
            />
          </DialogHeader>

          <ScrollArea className="flex-1 px-6">
            <div className="py-6">
              <ResumeDocument 
                sections={sections} 
                contactInfo={contactInfo}
                currentSectionId={currentSectionId}
              />
            </div>
          </ScrollArea>

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
  }

  // Edit mode
  if (mode === 'edit' && onUpdate) {
    return <EditMode structuredData={structuredData} onUpdate={onUpdate} />;
  }

  // View mode (default)
  return (
    <div className="space-y-4">
      <QualityIndicators 
        quality={overallQuality} 
        completedCount={completedSections.length}
        totalCount={sections.length}
      />
      <ResumeDocument 
        sections={sections} 
        contactInfo={contactInfo}
        currentSectionId={currentSectionId}
      />
      
      {onExport && completedSections.length > 0 && (
        <div className="flex gap-2 justify-end">
          <Button onClick={() => onExport('pdf')} variant="default" className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={() => onExport('docx')} variant="outline">
            Export DOCX
          </Button>
        </div>
      )}
    </div>
  );
}

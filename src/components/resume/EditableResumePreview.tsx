import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X, GripVertical, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Section {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'list' | 'experience';
}

interface EditableResumePreviewProps {
  htmlContent: string;
  structuredData: any;
  onUpdate: (updatedContent: string) => void;
}

export function EditableResumePreview({ 
  structuredData,
  onUpdate 
}: Omit<EditableResumePreviewProps, 'htmlContent'>) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sections, setSections] = useState<Section[]>([
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
    
    // Rebuild HTML from sections
    const updatedHtml = rebuildHtml();
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

  const rebuildHtml = () => {
    // Rebuild HTML from current sections state
    return sections.map(s => `<div class="section">${s.content}</div>`).join('\n');
  };

  const handleAISuggestion = async (_sectionId: string) => {
    toast({
      title: "Generating suggestion...",
      description: "AI is analyzing this section"
    });
    // This would call an AI endpoint to get suggestions
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

      {/* Quick Tips */}
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

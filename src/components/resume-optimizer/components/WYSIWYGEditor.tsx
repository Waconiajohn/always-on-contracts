import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ResumeSection } from '../types';
import { 
  List, 
  Edit3, 
  Eye,
  Check,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WYSIWYGEditorProps {
  sections: ResumeSection[];
  onSectionUpdate: (sectionId: string, content: string[]) => void;
  readOnly?: boolean;
}

export function WYSIWYGEditor({ sections, onSectionUpdate, readOnly = false }: WYSIWYGEditorProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string[]>([]);
  const [modifiedSections, setModifiedSections] = useState<Set<string>>(new Set());

  const handleStartEdit = (section: ResumeSection) => {
    if (readOnly) return;
    setEditingSection(section.id);
    setEditedContent([...section.content]);
  };

  const handleSaveEdit = useCallback(() => {
    if (editingSection) {
      onSectionUpdate(editingSection, editedContent);
      setModifiedSections(prev => new Set(prev).add(editingSection));
      setEditingSection(null);
      setEditedContent([]);
    }
  }, [editingSection, editedContent, onSectionUpdate]);

  const handleCancelEdit = useCallback(() => {
    setEditingSection(null);
    setEditedContent([]);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editingSection) return;
      
      // Escape to cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
      
      // Cmd/Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveEdit();
      }
      
      // Cmd/Ctrl+Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingSection, handleSaveEdit, handleCancelEdit]);

  const handleContentChange = (index: number, value: string) => {
    const newContent = [...editedContent];
    newContent[index] = value;
    setEditedContent(newContent);
  };

  const handleAddBullet = useCallback(() => {
    setEditedContent(prev => [...prev, '']);
  }, []);

  const handleRemoveBullet = useCallback((index: number) => {
    setEditedContent(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar - Simplified: removed deprecated execCommand buttons */}
      {!readOnly && editingSection && (
        <div className="sticky top-0 z-10 flex items-center gap-1 p-2 bg-muted/80 backdrop-blur rounded-lg border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleAddBullet}>
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add bullet point</TooltipContent>
          </Tooltip>
          
          <div className="flex-1" />
          
          <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveEdit}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      )}

      {/* Sections */}
      <ScrollArea className="h-[55vh]">
        <div className="space-y-6 pr-4">
          {sections.map((section) => {
            const isEditing = editingSection === section.id;
            const isModified = modifiedSections.has(section.id);
            
            return (
              <Card 
                key={section.id} 
                className={cn(
                  'transition-all',
                  isEditing && 'ring-2 ring-primary',
                  !readOnly && !isEditing && 'hover:bg-muted/50 cursor-pointer'
                )}
                onClick={() => !isEditing && handleStartEdit(section)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                      {section.title}
                      {isModified && (
                        <Badge variant="secondary" className="text-xs">
                          Modified
                        </Badge>
                      )}
                    </CardTitle>
                    {!readOnly && !isEditing && (
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    {isEditing && (
                      <Badge variant="default" className="text-xs">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editing
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-2">
                      {editedContent.map((item, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => handleContentChange(idx, e.target.value)}
                            className="flex-1 text-sm px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Enter content..."
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBullet(idx);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBullet();
                        }}
                        className="w-full"
                      >
                        <List className="h-4 w-4 mr-1" />
                        Add Bullet
                      </Button>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {section.content.map((item, idx) => (
                        <li key={idx} className="text-sm pl-4 border-l-2 border-muted">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Mode indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        {readOnly ? (
          <>
            <Eye className="h-3 w-3" />
            Preview mode
          </>
        ) : (
          <>
            <Edit3 className="h-3 w-3" />
            Click any section to edit
          </>
        )}
      </div>
    </div>
  );
}

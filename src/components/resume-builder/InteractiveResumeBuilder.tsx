import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, GripVertical, Trash2, Download, Eye, Edit3 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'skills' | 'achievements' | 'leadership' | 'projects' | 'education';
  title: string;
  content: ResumeItem[];
  order: number;
}

interface ResumeItem {
  id: string;
  content: string;
  vaultItemId?: string;
  atsKeywords?: string[];
  satisfiesRequirements?: string[];
}

interface InteractiveResumeBuilderProps {
  sections: ResumeSection[];
  onUpdateSection: (sectionId: string, content: ResumeItem[]) => void;
  onAddItem: (sectionType: string, item: ResumeItem) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onReorderSections: (sections: ResumeSection[]) => void;
  onExport: (format: string) => void;
  requirementCoverage: number;
  atsScore: number;
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
}

export const InteractiveResumeBuilder = ({
  sections,
  onUpdateSection,
  onAddItem,
  onRemoveItem,
  onExport,
  requirementCoverage = 0,
  atsScore = 0,
  mode,
  onModeChange
}: InteractiveResumeBuilderProps) => {
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: ""
  });

  const sectionIcons: { [key: string]: string } = {
    summary: "📋",
    experience: "💼",
    skills: "⚡",
    achievements: "🏆",
    leadership: "👥",
    projects: "🚀",
    education: "🎓"
  };

  const ResumeItemComponent = ({ item, sectionId }: { item: ResumeItem; sectionId: string }) => {
    const isEditing = editingItem === item.id;

    return (
      <div className="group relative p-3 bg-white rounded border hover:border-primary transition-all">
        <div className="flex items-start gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 cursor-move" />

          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Textarea
                value={item.content}
                onChange={(e) => {
                  const updatedContent = sections
                    .find(s => s.id === sectionId)
                    ?.content.map(i => i.id === item.id ? { ...i, content: e.target.value } : i) || [];
                  onUpdateSection(sectionId, updatedContent);
                }}
                onBlur={() => setEditingItem(null)}
                className="text-sm"
                rows={3}
                autoFocus
              />
            ) : (
              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
            )}

            {item.atsKeywords && item.atsKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.atsKeywords.map((kw, i) => (
                  <Badge key={i} className="text-xs bg-green-100 text-green-800">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}

            {item.satisfiesRequirements && item.satisfiesRequirements.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground">
                ✓ Addresses: {item.satisfiesRequirements.slice(0, 2).join(', ')}
                {item.satisfiesRequirements.length > 2 && ` +${item.satisfiesRequirements.length - 2} more`}
              </div>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditingItem(item.id)}
              className="h-7 w-7 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveItem(sectionId, item.id)}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const SectionComponent = ({ section }: { section: ResumeSection }) => {
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemContent, setNewItemContent] = useState("");

    const handleAddItem = () => {
      if (newItemContent.trim()) {
        onAddItem(section.type, {
          id: `item-${Date.now()}`,
          content: newItemContent
        });
        setNewItemContent("");
        setIsAddingItem(false);
      }
    };

    return (
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <span>{sectionIcons[section.type]}</span>
            <span>{section.title}</span>
            <Badge variant="outline" className="text-xs">{section.content.length}</Badge>
          </h3>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {section.content.map(item => (
            <ResumeItemComponent key={item.id} item={item} sectionId={section.id} />
          ))}

          {isAddingItem && (
            <div className="p-3 bg-white rounded border border-primary">
              <Textarea
                placeholder="Enter content..."
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                className="text-sm mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddItem} className="h-7 text-xs">
                  Add Item
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItemContent("");
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {section.content.length === 0 && !isAddingItem && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No items yet. Click "Add" or drag from Career Vault →
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">Resume Builder</h3>
            <p className="text-xs text-muted-foreground">
              Drag items from Career Vault or add manually
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === 'edit' ? 'default' : 'outline'}
              onClick={() => onModeChange('edit')}
              className="h-8 text-xs"
            >
              <Edit3 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant={mode === 'preview' ? 'default' : 'outline'}
              onClick={() => onModeChange('preview')}
              className="h-8 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Requirement Coverage</span>
              <span className="font-semibold">{requirementCoverage}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  requirementCoverage >= 80 ? "bg-green-500" :
                  requirementCoverage >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${requirementCoverage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">ATS Score</span>
              <span className="font-semibold">{atsScore}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all",
                  atsScore >= 80 ? "bg-green-500" :
                  atsScore >= 60 ? "bg-yellow-500" : "bg-red-500"
                )}
                style={{ width: `${atsScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {mode === 'edit' ? (
            <>
              {/* Contact Info */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>👤</span>
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Full Name"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    className="text-sm h-9"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="text-sm h-9"
                  />
                  <Input
                    placeholder="Phone"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="text-sm h-9"
                  />
                  <Input
                    placeholder="Location"
                    value={contactInfo.location}
                    onChange={(e) => setContactInfo({ ...contactInfo, location: e.target.value })}
                    className="text-sm h-9"
                  />
                  <Input
                    placeholder="LinkedIn URL"
                    value={contactInfo.linkedin}
                    onChange={(e) => setContactInfo({ ...contactInfo, linkedin: e.target.value })}
                    className="text-sm h-9 col-span-2"
                  />
                </div>
              </div>

              {/* Sections */}
              {sections
                .sort((a, b) => a.order - b.order)
                .map(section => (
                  <SectionComponent key={section.id} section={section} />
                ))}

              {/* Export */}
              <div className="flex gap-2 mt-6">
                <Button onClick={() => onExport('pdf')} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button onClick={() => onExport('docx')} variant="outline" className="flex-1">
                  Export DOCX
                </Button>
                <Button onClick={() => onExport('html')} variant="outline" className="flex-1">
                  Export HTML
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded shadow-lg min-h-[800px]">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">{contactInfo.name || "Your Name"}</h1>
                <div className="text-sm text-muted-foreground space-y-1">
                  {contactInfo.email && <div>{contactInfo.email}</div>}
                  {contactInfo.phone && <div>{contactInfo.phone}</div>}
                  {contactInfo.location && <div>{contactInfo.location}</div>}
                  {contactInfo.linkedin && <div>{contactInfo.linkedin}</div>}
                </div>
              </div>

              {sections
                .sort((a, b) => a.order - b.order)
                .map(section => (
                  <div key={section.id} className="mb-6">
                    <h2 className="text-xl font-bold mb-3 pb-2 border-b-2 border-primary">
                      {section.title}
                    </h2>
                    <div className="space-y-3">
                      {section.content.map(item => (
                        <div key={item.id} className="text-sm">
                          {item.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { ResumeAssessment, ResumeSection } from "@/types/mustInterviewBuilder";
import { 
  Loader2, 
  CheckCircle2, 
  Edit3,
  Sparkles,
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface SectionBuilderProps {
  assessment: ResumeAssessment;
  resumeText: string;
  jobDescription: string;
  selectedFormat: string;
  sections: ResumeSection[];
  onSectionsUpdated: (sections: ResumeSection[], newScore?: number) => void;
  onComplete: () => void;
  onBack: () => void;
}

const SECTION_TYPES = [
  { id: 'professional_summary', title: 'Professional Summary', required: true },
  { id: 'highlights', title: 'Key Highlights', required: true },
  { id: 'experience', title: 'Professional Experience', required: true },
  { id: 'skills', title: 'Technical Skills', required: true },
  { id: 'education', title: 'Education', required: false },
  { id: 'certifications', title: 'Certifications', required: false },
];

export const SectionBuilder = ({
  assessment,
  resumeText,
  jobDescription,
  selectedFormat,
  sections,
  onSectionsUpdated,
  onComplete,
  onBack
}: SectionBuilderProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<ResumeSection[]>(sections);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Generate all sections on mount if empty
  useEffect(() => {
    if (localSections.length === 0) {
      generateAllSections();
    }
  }, []);

  const generateAllSections = async () => {
    setIsGenerating(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newSections: ResumeSection[] = [];
      
      for (const sectionType of SECTION_TYPES) {
        setCurrentSection(sectionType.id);
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-dual-resume-section', {
            body: {
              section_type: sectionType.id,
              vault_items: [],
              resume_milestones: [],
              user_id: user.id,
              job_title: assessment.roleTitle,
              industry: assessment.industry,
              seniority: assessment.seniority,
              ats_keywords: assessment.atsKeywords,
              requirements: assessment.gaps.map(g => g.requirement),
              existing_resume: resumeText
            }
          });

          if (error) throw error;

          const content = data?.personalizedVersion?.content || data?.content || [];
          const items = typeof content === 'string' 
            ? content.split('\n').filter(Boolean).map((line: string, i: number) => ({
                id: `${sectionType.id}-${i}`,
                content: line,
                order: i
              }))
            : Array.isArray(content) 
              ? content.map((item: any, i: number) => ({
                  id: `${sectionType.id}-${i}`,
                  content: typeof item === 'string' ? item : item.content || '',
                  order: i
                }))
              : [];

          newSections.push({
            id: sectionType.id,
            type: sectionType.id,
            title: sectionType.title,
            items,
            order: newSections.length,
            required: sectionType.required,
            status: 'generated',
            gapsAddressed: [],
            atsKeywordsUsed: data?.atsKeywords || [],
            vaultItemsUsed: data?.vaultItemsUsed || []
          });

          setLocalSections([...newSections]);
          onSectionsUpdated([...newSections]);

        } catch (error) {
          console.error(`Error generating ${sectionType.id}:`, error);
          // Add empty section on error
          newSections.push({
            id: sectionType.id,
            type: sectionType.id,
            title: sectionType.title,
            items: [],
            order: newSections.length,
            required: sectionType.required,
            status: 'pending',
            gapsAddressed: [],
            atsKeywordsUsed: [],
            vaultItemsUsed: []
          });
        }
      }

      toast({
        title: "Sections generated!",
        description: "Review and edit each section below",
      });

    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentSection(null);
    }
  };

  const handleEditSection = (sectionId: string) => {
    const section = localSections.find(s => s.id === sectionId);
    if (section) {
      setEditText(section.items.map(i => i.content).join('\n'));
      setEditingSection(sectionId);
    }
  };

  const handleSaveEdit = (sectionId: string) => {
    const updatedSections = localSections.map(s => {
      if (s.id === sectionId) {
        const items = editText.split('\n').filter(Boolean).map((line, i) => ({
          id: `${sectionId}-${i}`,
          content: line,
          order: i
        }));
        return { ...s, items, status: 'edited' as const };
      }
      return s;
    });
    
    setLocalSections(updatedSections);
    onSectionsUpdated(updatedSections);
    setEditingSection(null);
    setEditText("");
    
    toast({
      title: "Section updated",
      description: "Your changes have been saved",
    });
  };

  const handleApproveSection = (sectionId: string) => {
    const updatedSections = localSections.map(s => 
      s.id === sectionId ? { ...s, status: 'approved' as const } : s
    );
    setLocalSections(updatedSections);
    onSectionsUpdated(updatedSections);
  };

  const handleRegenerateSection = async (sectionId: string) => {
    // TODO: Implement regeneration for single section
    toast({
      title: "Coming soon",
      description: "Single section regeneration will be available soon",
    });
  };

  const approvedCount = localSections.filter(s => s.status === 'approved').length;
  const totalRequired = localSections.filter(s => s.required).length;
  const canProceed = approvedCount >= totalRequired || localSections.every(s => s.status !== 'pending');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Build Your Must-Interview Résumé</h1>
          <p className="text-muted-foreground">
            Review and refine each section. AI has generated content based on your profile and the job requirements.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {approvedCount}/{localSections.length} sections ready
        </Badge>
      </div>

      {/* Generation Progress */}
      {isGenerating && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div>
                <p className="font-medium">Generating sections...</p>
                <p className="text-sm text-muted-foreground">
                  {currentSection ? `Working on: ${SECTION_TYPES.find(s => s.id === currentSection)?.title}` : 'Preparing...'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <Accordion type="single" collapsible className="space-y-4">
        {localSections.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  {section.status === 'approved' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : section.status === 'generated' || section.status === 'edited' ? (
                    <Edit3 className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                  <span className="font-medium">{section.title}</span>
                  {section.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                </div>
                <Badge 
                  variant="secondary"
                  className={cn(
                    section.status === 'approved' && "bg-green-500/10 text-green-600",
                    section.status === 'edited' && "bg-amber-500/10 text-amber-600",
                    section.status === 'generated' && "bg-blue-500/10 text-blue-600"
                  )}
                >
                  {section.status}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {editingSection === section.id ? (
                <div className="space-y-4">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                    placeholder="Edit section content..."
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleSaveEdit(section.id)}>
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditingSection(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Content Display */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    {section.items.length > 0 ? (
                      <ul className="space-y-2">
                        {section.items.map((item, i) => (
                          <li key={item.id} className="text-sm">
                            {item.content.startsWith('•') ? item.content : `• ${item.content}`}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No content generated yet
                      </p>
                    )}
                  </div>

                  {/* ATS Keywords Used */}
                  {section.atsKeywordsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground mr-2">ATS Keywords:</span>
                      {section.atsKeywordsUsed.slice(0, 5).map((kw, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSection(section.id)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateSection(section.id)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    {section.status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveSection(section.id)}
                        className="ml-auto"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Gaps Alert */}
      {assessment.gaps.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">Gaps to Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {assessment.gaps.slice(0, 3).map((gap, i) => (
                <li key={i} className="text-muted-foreground">• {gap.requirement}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Make sure these are addressed in your experience or highlights sections.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          Back to Assessment
        </Button>
        <Button
          size="lg"
          onClick={onComplete}
          disabled={!canProceed || isGenerating}
          className="gap-2"
        >
          <Sparkles className="h-5 w-5" />
          Continue to Hiring Manager Review
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

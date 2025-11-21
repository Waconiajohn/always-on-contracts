import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { InteractiveResumeBuilder } from "./legacy/InteractiveResumeBuilder";
import { IntelligentVaultPanel } from "./IntelligentVaultPanel";
import { GapSolutionsCard } from "./GapSolutionsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Lightbulb, ChevronRight, ChevronLeft, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeSection {
  id: string;
  type: 'summary' | 'experience' | 'skills' | 'achievements' | 'leadership' | 'projects' | 'education';
  title: string;
  content: any[];
  order: number;
}

interface VaultMatch {
  vaultItemId: string;
  vaultCategory: string;
  content: any;
  matchScore: number;
  matchReasons: string[];
  suggestedPlacement: string;
  enhancedLanguage?: string;
  satisfiesRequirements: string[];
  atsKeywords: string[];
  differentiatorScore: number;
  added?: boolean;
}

interface ResumeEditorWithVaultPanelProps {
  sections: ResumeSection[];
  vaultMatches: any;
  jobAnalysis: any;
  onUpdateSection: (sectionId: string, content: any[]) => void;
  onAddItem: (sectionType: string, item: any) => void;
  onRemoveItem: (sectionId: string, itemId: string) => void;
  onReorderSections: (sections: ResumeSection[]) => void;
  onExport: (format: string) => void;
  mode: 'edit' | 'preview';
  onModeChange: (mode: 'edit' | 'preview') => void;
}

export const ResumeEditorWithVaultPanel = ({
  sections,
  vaultMatches,
  jobAnalysis,
  onUpdateSection,
  onAddItem,
  onRemoveItem,
  onReorderSections,
  onExport,
  mode,
  onModeChange
}: ResumeEditorWithVaultPanelProps) => {
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [addedMatches, setAddedMatches] = useState<Set<string>>(new Set());
  const [vaultPanelCollapsed, setVaultPanelCollapsed] = useState(false);

  const handleAddToResume = (vaultMatch: VaultMatch, placement: string) => {
    // Add the match to the appropriate section
    const content = vaultMatch.enhancedLanguage || getDisplayContent(vaultMatch.content);
    
    onAddItem(placement, {
      id: `item-${Date.now()}`,
      content: content,
      vaultItemId: vaultMatch.vaultItemId,
      atsKeywords: vaultMatch.atsKeywords,
      satisfiesRequirements: vaultMatch.satisfiesRequirements
    });

    // Mark as added
    setAddedMatches(prev => new Set(prev).add(vaultMatch.vaultItemId));

    toast({
      title: "Added to resume",
      description: `Added to ${placement} section`
    });
  };

  const handleEnhanceLanguage = () => {
    toast({
      title: "Enhanced language applied",
      description: "Using AI-optimized version for this job"
    });
  };

  // Helper to get displayable content from vault item
  const getDisplayContent = (content: any): string => {
    if (typeof content === 'string') return content;
    
    const fields = [
      'competency_area', 'inferred_capability',
      'phrase', 'quantifiable_result',
      'skill_name', 'trait_name',
      'job_title', 'company', 'accomplishment',
      'question', 'strong_answer',
      'philosophy_statement', 'value_name', 'manifestation',
      'title', 'description', 'evidence', 'context', 'name'
    ];
    
    for (const field of fields) {
      if (content[field] && typeof content[field] === 'string' && content[field].length > 3) {
        return content[field];
      }
    }
    
    return "Vault item content";
  };

  // Filter vault matches by selected section
  const getFilteredMatches = () => {
    const items = vaultMatches?.matchedItems || [];
    if (!selectedSection) return items;
    return items.filter((m: VaultMatch) => m.suggestedPlacement === selectedSection);
  };

  // Get filtered matches with added status
  const matchesWithAddedStatus = getFilteredMatches().map((match: VaultMatch) => ({
    ...match,
    added: addedMatches.has(match.vaultItemId)
  }));

  return (
    <div className="h-full relative">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={vaultPanelCollapsed ? 95 : 60} minSize={40}>
          <InteractiveResumeBuilder
            sections={sections}
            onUpdateSection={onUpdateSection}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            onReorderSections={onReorderSections}
            onExport={onExport}
            requirementCoverage={vaultMatches?.coverageScore || 0}
            atsScore={vaultMatches?.coverageScore || 0}
            mode={mode}
            onModeChange={onModeChange}
            jobAnalysis={jobAnalysis}
            vaultMatches={vaultMatches?.matchedItems || []}
          />
        </ResizablePanel>

        {!vaultPanelCollapsed && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={30}>
              <Card className="h-full flex flex-col">
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Career Vault Reference</h3>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {vaultMatches?.matchedItems?.length || 0} items
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Browse vault items to supplement AI-generated sections
                  </p>
                </div>

                <Tabs defaultValue="vault" className="flex-1 flex flex-col">
                  <div className="px-4 pt-4">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="vault" className="text-xs gap-1">
                        <Sparkles className="h-3 w-3" />
                        All Matches
                      </TabsTrigger>
                      <TabsTrigger value="gaps" className="text-xs gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Gap Solutions
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="vault" className="h-full m-0">
                      {/* Section filter buttons */}
                      <div className="px-4 pt-4 pb-2 border-b">
                        <p className="text-xs text-muted-foreground mb-2">Filter by section:</p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant={selectedSection === null ? "default" : "outline"}
                            onClick={() => setSelectedSection(null)}
                            className="h-7 text-xs"
                          >
                            All Sections
                          </Button>
                          {sections.map(section => (
                            <Button
                              key={section.id}
                              size="sm"
                              variant={selectedSection === section.type ? "default" : "outline"}
                              onClick={() => setSelectedSection(section.type)}
                              className="h-7 text-xs"
                            >
                              {section.title}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <IntelligentVaultPanel
                        matches={matchesWithAddedStatus}
                        recommendations={vaultMatches?.recommendations}
                        onAddToResume={handleAddToResume}
                        onEnhanceLanguage={handleEnhanceLanguage}
                        loading={false}
                      />
                    </TabsContent>

                    <TabsContent value="gaps" className="h-full m-0">
                      <ScrollArea className="h-full">
                        <div className="p-4 space-y-4">
                          {vaultMatches?.unmatchedRequirements && vaultMatches.unmatchedRequirements.length > 0 ? (
                            <>
                              <div className="p-3 bg-muted/50 rounded-lg border">
                                <p className="text-sm font-medium mb-1">
                                  {vaultMatches.unmatchedRequirements.length} Gap Solutions Available
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  These are job requirements not directly covered by your vault. 
                                  AI has generated strategic approaches to address each gap.
                                </p>
                              </div>

                              {vaultMatches.unmatchedRequirements.map((req: string, idx: number) => (
                                <GapSolutionsCard
                                  key={idx}
                                  requirement={req}
                                  vaultMatches={vaultMatches.matchedItems || []}
                                  jobContext={{
                                    title: jobAnalysis?.jobTitle || '',
                                    industry: jobAnalysis?.industry || '',
                                    seniority: jobAnalysis?.seniorityLevel || ''
                                  }}
                                  onUseSuggestion={(_solution, _action) => {
                                    // Handled by store
                                  }}
                                />
                              ))}
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                                <Sparkles className="h-8 w-8 text-success" />
                              </div>
                              <h3 className="font-semibold text-lg mb-2">No Gaps Found!</h3>
                              <p className="text-sm text-muted-foreground max-w-xs">
                                Your Career Vault has excellent coverage of all job requirements.
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              </Card>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Collapse/Expand Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute top-6 right-2 z-10 h-8 w-8 p-0"
        onClick={() => setVaultPanelCollapsed(!vaultPanelCollapsed)}
      >
        {vaultPanelCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
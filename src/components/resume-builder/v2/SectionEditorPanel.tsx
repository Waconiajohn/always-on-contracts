import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Loader2,
  Edit3,
  Maximize2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";
import { DualGenerationComparison } from "@/components/resume-builder/DualGenerationComparison";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { VaultSourcingPanel } from "./VaultSourcingPanel";
import { JDMatchPanel } from "./JDMatchPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequirementBulletMapper } from "./RequirementBulletMapper";

interface SectionEditorPanelProps {
  sectionId: string;
  onClose: () => void;
}

export function SectionEditorPanel({ sectionId, onClose }: SectionEditorPanelProps) {
  const store = useResumeBuilderStore();
  const { toast } = useToast();
  
  // Find section data
  const section = store.resumeSections.find(s => s.id === sectionId);
  
  // Derived Data
  const atsKeywords = store.jobAnalysis?.atsKeywords || { critical: [], important: [], nice_to_have: [] };
  const allKeywords = [...atsKeywords.critical, ...atsKeywords.important, ...atsKeywords.nice_to_have];
  const sectionContentStr = Array.isArray(section?.content) 
      ? section?.content.map((i: any) => i.content || i).join(' ') 
      : typeof section?.content === 'string' ? section?.content : '';
  
  const matchedKeywords = allKeywords.filter(kw => sectionContentStr.toLowerCase().includes(kw.toLowerCase()));
  const missingKeywords = allKeywords.filter(kw => !sectionContentStr.toLowerCase().includes(kw.toLowerCase())).slice(0, 10);
  const matchScore = Math.round((matchedKeywords.length / (allKeywords.length || 1)) * 100);

  // Vault Items (Mock logic for now - ideally stored on section)
  const vaultItems = store.vaultMatches?.matchedItems || [];
  const usedVaultItems = vaultItems.filter((item: any) => sectionContentStr.includes(item.content.substring(0, 20)));
  const suggestedVaultItems = vaultItems.filter((item: any) => 
      !sectionContentStr.includes(item.content.substring(0, 20)) && 
      item.suggestedPlacement?.includes(section?.type)
  ).slice(0, 5);

  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [showComparison, setShowComparison] = useState(false);
  const [generationData, setGenerationData] = useState<any>(null);
  
  // New Evidence-Based State
  const [showRequirementMapper, setShowRequirementMapper] = useState(false);
  const [evidenceMatrix, setEvidenceMatrix] = useState<any[]>([]);

  useEffect(() => {
    // Initialize content for editing
    if (section?.content) {
        const contentStr = Array.isArray(section.content) 
            ? section.content.map((i: any) => i.content || i).join('\n')
            : typeof section.content === 'string' ? section.content : '';
        setEditedContent(contentStr);
    }
  }, [section]);

  if (!section) return null;

  const handleGenerate = async () => {
    if (!store.jobAnalysis) {
      toast({
        title: "Job Analysis Required",
        description: "Please complete the job analysis step first.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setShowComparison(false);
    setShowRequirementMapper(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Match Requirements to Bullets (Phase 1 - Backend)
      // Only do this for Experience/Projects/Summary sections where mapping matters
      if (['experience', 'projects', 'summary'].includes(section.type)) {
          toast({ title: "Mapping career history..." });
          
          const { data: matrixData, error: matrixError } = await invokeEdgeFunction(
              'match-requirements-to-bullets',
              {
                  userId: user.id,
                  jobRequirements: store.jobAnalysis.jobRequirements?.required || [],
                  atsKeywords: store.jobAnalysis.atsKeywords
              }
          );

          if (!matrixError && matrixData.evidenceMatrix.length > 0) {
              setEvidenceMatrix(matrixData.evidenceMatrix);
              setShowRequirementMapper(true);
              setIsGenerating(false);
              return; // Stop here to let user review
          }
          // If no matrix, fall back to standard generation
      }

      // Standard Generation (or fallback)
      await executeStandardGeneration(user.id);

    } catch (error: any) {
      logger.error('Generation failed', error);
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };

  const handleEvidenceComplete = async (selections: Record<string, any>) => {
      setShowRequirementMapper(false);
      setIsGenerating(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          // Save evidence selections to database for audit trail
          const mappings = evidenceMatrix.map(item => {
            const selection = selections[item.requirementId];
            return {
              user_id: user.id,
              requirement_text: item.requirementText,
              requirement_category: item.requirementCategory,
              milestone_id: selection?.swappedEvidenceId || item.milestoneId,
              original_bullet: selection?.swappedOriginalBullet || item.originalBullet,
              original_job_title: item.originalSource?.jobTitle,
              original_company: item.originalSource?.company,
              original_date_range: item.originalSource?.dateRange,
              match_score: item.matchScore,
              match_reasons: item.matchReasons || [],
              enhanced_bullet: item.enhancedBullet,
              ats_keywords: item.atsKeywords || [],
              user_selection: selection?.version || 'enhanced',
              custom_edit: selection?.customText
            };
          });

          const { error: saveError } = await supabase
            .from('resume_requirement_mappings')
            .upsert(mappings);

          if (saveError) {
            logger.error('Failed to save evidence mappings', saveError);
          }

          await executeStandardGeneration(user.id, selections);
      }
  };

  const executeStandardGeneration = async (userId: string, selections: Record<string, any> = {}) => {
      // 1. Research (Simplified for MVP - usually cached)
      const researchPayload = {
        research_type: 'resume_job_analysis',
        query_params: {
          job_description: store.displayJobText || '',
          job_title: store.jobAnalysis.roleProfile?.title || '',
          company: store.jobAnalysis.roleProfile?.company || '',
          industry: store.jobAnalysis.roleProfile?.industry || '',
          location: store.jobAnalysis.roleProfile?.location || ''
        }
      };

      const { data: researchData, error: researchError } = await invokeEdgeFunction(
        'perplexity-research',
        researchPayload
      );

      if (researchError) throw researchError;

      // 2. Generate Dual Version
      const dualPayload = {
        section_type: section.type,
        section_guidance: "Professional tone, achievement-focused", 
        job_analysis_research: researchData.research_result,
        vault_items: store.vaultMatches?.matchedItems || [], 
        resume_milestones: store.resumeMilestones || [],
        user_id: userId,
        job_title: store.jobAnalysis.roleProfile?.title || '',
        industry: store.jobAnalysis.roleProfile?.industry || '',
        seniority: store.jobAnalysis.roleProfile?.seniority || 'mid-level',
        ats_keywords: store.jobAnalysis.atsKeywords || { critical: [], important: [], nice_to_have: [] },
        requirements: [],
        evidenceMatrix: evidenceMatrix, // Pass matrix if available
        evidenceSelections: selections // Pass user selections
      };

      const { data: dualData, error: dualError } = await invokeEdgeFunction(
        'generate-dual-resume-section',
        dualPayload
      );

      if (dualError) throw dualError;

      setGenerationData({
        dualData,
        research: researchData
      });
      setShowComparison(true);
      setIsGenerating(false);
  };

  const handleSave = (content: any) => {
    // Convert string/array back to store format
    const finalContent = Array.isArray(content) 
        ? content.map(c => ({ id: crypto.randomUUID(), content: c }))
        : typeof content === 'string' 
            ? content.split('\n').filter(Boolean).map(c => ({ id: crypto.randomUUID(), content: c }))
            : content;

    store.updateSection(sectionId, finalContent);
    setShowComparison(false);
    setIsEditing(false);
    toast({ title: "Section Updated" });
  };

  if (showRequirementMapper && evidenceMatrix.length > 0) {
      return (
          <div className="h-full flex flex-col bg-card p-4">
              <RequirementBulletMapper 
                  evidenceMatrix={evidenceMatrix}
                  onComplete={handleEvidenceComplete}
                  onCancel={() => setShowRequirementMapper(false)}
              />
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center shrink-0">
        <div>
            <h2 className="font-semibold">{section.title}</h2>
            <Badge variant="outline" className="text-xs">{section.type}</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
            <Maximize2 className="h-4 w-4" /> {/* Placeholder icon for close/minimize */}
        </Button>
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
            {/* AI Controls */}
            {!showComparison && (
                <Card className="p-4 bg-muted/30 border-dashed">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-medium mb-1">AI Writer</h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Generate content based on your Career Vault and the Job Description.
                            </p>
                            <Button 
                                size="sm" 
                                onClick={handleGenerate} 
                                disabled={isGenerating}
                                className="w-full"
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                {isGenerating ? "Analyzing & Writing..." : "Generate Ideas"}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Comparison View */}
            {showComparison && generationData && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <DualGenerationComparison
                        research={{
                            insights: generationData.research.research_result,
                            citations: generationData.research.citations
                        }}
                        idealContent={generationData.dualData.idealVersion.content}
                        personalizedContent={generationData.dualData.personalizedVersion.content}
                        sectionType={section.type}
                        vaultStrength={{
                            score: 85, // Mock score
                            hasRealNumbers: true,
                            hasDiverseCategories: true
                        }}
                        onSelectIdeal={() => handleSave(generationData.dualData.idealVersion.content)}
                        onSelectPersonalized={() => handleSave(generationData.dualData.personalizedVersion.content)}
                        onOpenEditor={(content) => {
                            setEditedContent(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
                            setIsEditing(true);
                            setShowComparison(false);
                        }}
                    />
                </div>
            )}

            {/* Manual Editor */}
            {(!showComparison || isEditing) && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Content</h3>
                            {!isEditing && (
                                <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setIsEditing(true)}>
                                    <Edit3 className="h-3 w-3 mr-1" /> Edit
                                </Button>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <div className="space-y-2">
                                <Textarea 
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    className="min-h-[200px] font-mono text-sm"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="sm" onClick={() => handleSave(editedContent)}>Save Changes</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3 border rounded-md bg-background text-sm whitespace-pre-wrap">
                                 {editedContent || <span className="text-muted-foreground italic">No content yet.</span>}
                            </div>
                        )}
                    </div>

                    {/* Insights Tabs */}
                    <Tabs defaultValue="vault" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="vault">Vault Sourcing</TabsTrigger>
                            <TabsTrigger value="jd">JD Match</TabsTrigger>
                        </TabsList>
                        <TabsContent value="vault">
                            <VaultSourcingPanel 
                                usedItems={usedVaultItems}
                                suggestedItems={suggestedVaultItems}
                                onAddItem={(item) => {
                                    const newContent = editedContent + "\n" + item.content;
                                    setEditedContent(newContent);
                                    handleSave(newContent);
                                }}
                            />
                        </TabsContent>
                        <TabsContent value="jd">
                            <JDMatchPanel 
                                matchScore={matchScore}
                                matchedKeywords={matchedKeywords}
                                missingKeywords={missingKeywords}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}

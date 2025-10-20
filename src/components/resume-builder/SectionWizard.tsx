import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Lightbulb,
  Sparkles,
  Check,
  Edit3,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResumeSection } from "@/lib/resumeFormats";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DualGenerationComparison } from "./DualGenerationComparison";
import { GenerationProgress } from "./GenerationProgress";

interface VaultMatch {
  vaultItemId: string;
  vaultCategory: string;
  content: any;
  matchScore: number;
  matchReasons: string[];
  satisfiesRequirements: string[];
  atsKeywords: string[];
  enhancedLanguage?: string;
}

interface SectionWizardProps {
  section: ResumeSection;
  vaultMatches: VaultMatch[];
  jobAnalysis: any;
  onSectionComplete: (content: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  totalSections: number;
  currentIndex: number;
}

export const SectionWizard = ({
  section,
  vaultMatches,
  jobAnalysis,
  onSectionComplete,
  onBack,
  onSkip,
  isFirst,
  isLast,
  totalSections,
  currentIndex
}: SectionWizardProps) => {
  const { toast } = useToast();
  const [selectedVaultItems, setSelectedVaultItems] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [showEnhanced, setShowEnhanced] = useState<{ [key: string]: boolean }>({});
  const [jobResearch, setJobResearch] = useState<any>(null);
  const [idealContent, setIdealContent] = useState<any>(null);
  const [personalizedContent, setPersonalizedContent] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [currentGenerationStep, setCurrentGenerationStep] = useState(0);

  // Helper to get section icon
  const getSectionIcon = (sectionId: string): string => {
    const iconMap: { [key: string]: string } = {
      opening_paragraph: '📝',
      summary: '📝',
      core_competencies: '⚡',
      key_skills: '⚡',
      technical_skills: '💻',
      selected_accomplishments: '🏆',
      accomplishments: '🏆',
      achievements: '🏆',
      professional_timeline: '💼',
      experience: '💼',
      employment_history: '💼',
      additional_skills: '🔑',
      education: '🎓',
      projects: '🚀',
      core_capabilities: '🎯'
    };
    return iconMap[sectionId] || '📄';
  };

  // Filter vault matches relevant to this section
  const relevantMatches = vaultMatches.filter(match =>
    section.vaultCategories.includes(match.vaultCategory)
  ).slice(0, 15); // Limit to top 15 for UI performance

  const handleVaultItemToggle = (itemId: string) => {
    setSelectedVaultItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowComparison(false);
    setCurrentGenerationStep(0);

    try {
      const selectedItems = relevantMatches.filter(m =>
        selectedVaultItems.includes(m.vaultItemId)
      );

      // Step 1: Get or fetch job analysis research (cache this globally)
      setCurrentGenerationStep(0);

      let research = jobResearch;
      if (!research) {
        const { data: researchData, error: researchError } = await supabase.functions.invoke(
          'perplexity-research',
          {
            body: {
              research_type: 'resume_job_analysis',
              query_params: {
                job_description: jobAnalysis.originalJobDescription || '',
                job_title: jobAnalysis.roleProfile?.title || '',
                company: jobAnalysis.roleProfile?.company || '',
                industry: jobAnalysis.roleProfile?.industry || '',
                location: jobAnalysis.roleProfile?.location || ''
              }
            }
          }
        );

        if (researchError) {
          throw new Error('Job analysis failed');
        }

        research = researchData;
        setJobResearch(research); // Cache for next sections
      }

      // Step 2: Generate ideal version
      setCurrentGenerationStep(1);

      const { data: idealData, error: idealError } = await supabase.functions.invoke(
        'generate-resume-with-perplexity',
        {
          body: {
            generation_type: 'ideal',
            section_type: section.type,
            section_guidance: section.guidancePrompt,
            job_analysis_research: research.research_result,
            job_title: jobAnalysis.roleProfile?.title || '',
            industry: jobAnalysis.roleProfile?.industry || '',
            seniority: jobAnalysis.roleProfile?.seniority || 'mid-level'
          }
        }
      );

      if (idealError) {
        throw new Error('Ideal generation failed');
      }

      setIdealContent(idealData.content);

      // Step 3: Generate personalized version
      setCurrentGenerationStep(2);

      const { data: personalizedData, error: personalizedError } = await supabase.functions.invoke(
        'generate-resume-with-perplexity',
        {
          body: {
            generation_type: 'personalized',
            section_type: section.type,
            section_guidance: section.guidancePrompt,
            job_analysis_research: research.research_result,
            vault_items: selectedItems,
            job_title: jobAnalysis.roleProfile?.title || '',
            industry: jobAnalysis.roleProfile?.industry || '',
            seniority: jobAnalysis.roleProfile?.seniority || 'mid-level'
          }
        }
      );

      if (personalizedError) {
        throw new Error('Personalized generation failed');
      }

      setPersonalizedContent(personalizedData.content);

      setCurrentGenerationStep(3); // Complete
      setShowComparison(true);

      toast({
        title: "Dual generation complete!",
        description: "Compare industry standard vs your personalized version"
      });

    } catch (error) {
      console.error('Error generating section:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate section content",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedContent(null);
    setEditedContent("");
    setShowComparison(false);
    handleGenerate();
  };

  const handleSelectIdeal = () => {
    setGeneratedContent(idealContent);
    setEditedContent(
      typeof idealContent === 'string'
        ? idealContent
        : JSON.stringify(idealContent, null, 2)
    );
    setShowComparison(false);
    toast({
      title: "Industry standard selected",
      description: "You can edit before approving"
    });
  };

  const handleSelectPersonalized = () => {
    setGeneratedContent(personalizedContent);
    setEditedContent(
      typeof personalizedContent === 'string'
        ? personalizedContent
        : JSON.stringify(personalizedContent, null, 2)
    );
    setShowComparison(false);
    toast({
      title: "Personalized version selected",
      description: "You can edit before approving"
    });
  };

  const handleOpenEditor = (initialContent: any) => {
    setGeneratedContent(initialContent);
    setEditedContent(
      typeof initialContent === 'string'
        ? initialContent
        : JSON.stringify(initialContent, null, 2)
    );
    setIsEditing(true);
    setShowComparison(false);
    toast({
      title: "Editor opened",
      description: "Blend and customize as needed"
    });
  };

  const handleApprove = () => {
    const finalContent = isEditing
      ? editedContent
      : generatedContent;

    onSectionComplete({
      type: section.type,
      content: finalContent,
      vaultItemsUsed: selectedVaultItems
    });
  };

  const renderVaultItem = (match: VaultMatch) => {
    const isSelected = selectedVaultItems.includes(match.vaultItemId);
    const showEnhancedVersion = showEnhanced[match.vaultItemId];

    // Get displayable content from vault item
    const getDisplayContent = (content: any): string => {
      if (typeof content === 'string') return content;
      
      // Try fields matching actual database schema
      if (content.competency_area) return content.competency_area;
      if (content.inferred_capability) return content.inferred_capability;
      if (content.phrase) return content.phrase;
      if (content.skill_name) return content.skill_name;
      if (content.job_title) return content.job_title;
      if (content.question) return content.question;
      if (content.strong_answer) return content.strong_answer;
      if (content.accomplishment) return content.accomplishment;
      if (content.philosophy_statement) return content.philosophy_statement;
      if (content.value_name) return content.value_name;
      if (content.description) return content.description;
      
      // Handle arrays
      if (content.supporting_evidence && Array.isArray(content.supporting_evidence) && content.supporting_evidence.length > 0) {
        return content.supporting_evidence[0];
      }
      
      // Fallback: find first meaningful string (skip IDs, UUIDs, dates)
      const skipFields = ['id', 'user_id', 'vault_id', 'created_at', 'updated_at'];
      const firstString = Object.entries(content)
        .filter(([key, val]) => !skipFields.includes(key) && typeof val === 'string' && val.length > 10 && !val.match(/^[0-9a-f-]{36}$/))
        .map(([_, val]) => val as string)[0];
      
      if (firstString) return firstString;
      
      return JSON.stringify(content).substring(0, 200);
    };

    const displayContent = getDisplayContent(match.content);
    const hasEnhanced = match.enhancedLanguage && match.enhancedLanguage.length > 0;

    return (
      <div
        key={match.vaultItemId}
        className={cn(
          "p-4 rounded-lg border-2 transition-all",
          isSelected
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/50"
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => handleVaultItemToggle(match.vaultItemId)}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {match.vaultCategory.replace(/_/g, ' ')}
              </Badge>
              <Badge className="text-xs">
                {match.matchScore}% match
              </Badge>
            </div>

            <p className="text-sm font-medium mb-2">
              {showEnhancedVersion && hasEnhanced
                ? match.enhancedLanguage
                : displayContent}
            </p>

            {match.satisfiesRequirements && match.satisfiesRequirements.length > 0 && (
              <div className="text-xs text-muted-foreground mb-2">
                <Check className="h-3 w-3 inline mr-1" />
                Addresses: {match.satisfiesRequirements.slice(0, 2).join(', ')}
                {match.satisfiesRequirements.length > 2 && ` +${match.satisfiesRequirements.length - 2} more`}
              </div>
            )}

            {match.atsKeywords && match.atsKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {match.atsKeywords.slice(0, 5).map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            )}

            {hasEnhanced && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setShowEnhanced(prev => ({
                    ...prev,
                    [match.vaultItemId]: !prev[match.vaultItemId]
                  }))
                }
                className="mt-2 h-7 text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                {showEnhancedVersion ? "Show Original" : "Show Enhanced"}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Build Your Resume</h2>
          <span className="text-sm text-muted-foreground">
            Section {currentIndex + 1} of {totalSections}
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalSections) * 100}%` }}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 pb-6 space-y-6">
          {/* Section Header */}
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">{getSectionIcon(section.id)}</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {section.description}
                </p>
                {section.required && (
                  <Badge variant="secondary" className="text-xs">
                    Required Section
                  </Badge>
                )}
              </div>
            </div>
          </Card>

          {/* AI Guidance */}
          <Card className="p-6 bg-primary/5 border-primary/30">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-accent-foreground mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-2">AI Guidance</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {section.guidancePrompt}
                </div>
              </div>
            </div>
          </Card>

          {/* Vault Items Selection */}
          {!generatedContent && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4">
                Select from Your Career Vault ({relevantMatches.length} matches)
              </h4>

              {relevantMatches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No vault items found for this section</p>
                  <p className="text-sm">You can still generate content or add manually</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {relevantMatches.map(renderVaultItem)}
                </div>
              )}

              <div className="mt-6 flex flex-col items-center gap-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedVaultItems.length === 0}
                  size="lg"
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate {section.title}
                      {selectedVaultItems.length > 0 && ` (${selectedVaultItems.length} items)`}
                    </>
                  )}
                </Button>

                {/* Generation Progress with Animations */}
                {isGenerating && (
                  <GenerationProgress
                    currentStep={currentGenerationStep}
                    isComplete={showComparison}
                  />
                )}
              </div>
            </Card>
          )}

          {/* Dual Generation Comparison */}
          {showComparison && idealContent && personalizedContent && jobResearch && (
            <DualGenerationComparison
              research={{
                insights: jobResearch.research_result,
                citations: jobResearch.citations,
                keywords: jobResearch.related_questions
              }}
              idealContent={idealContent}
              personalizedContent={personalizedContent}
              sectionType={section.type}
              vaultStrength={{
                score: Math.min(100, (selectedVaultItems.length / 10) * 100),
                hasRealNumbers: true,
                hasDiverseCategories: true
              }}
              onSelectIdeal={handleSelectIdeal}
              onSelectPersonalized={handleSelectPersonalized}
              onOpenEditor={handleOpenEditor}
              jobTitle={jobAnalysis.roleProfile?.title}
            />
          )}

          {/* Single Content Review (after selection) */}
          {generatedContent && !showComparison && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">Generated {section.title}</h4>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-2"
                  >
                    <Edit3 className="h-3 w-3" />
                    {isEditing ? "Preview" : "Edit"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRegenerate}
                    className="gap-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border p-4 rounded-lg">
                {isEditing ? (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {typeof generatedContent === 'string' ? (
                      <p className="whitespace-pre-wrap">{generatedContent}</p>
                    ) : Array.isArray(generatedContent) ? (
                      <ul className="space-y-2">
                        {generatedContent.map((item: any, i: number) => (
                          <li key={i} className="text-sm">
                            {typeof item === 'string' ? item : item.bullet || JSON.stringify(item)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <pre className="text-sm">{JSON.stringify(generatedContent, null, 2)}</pre>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="border-t p-6 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                onClick={onBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {!section.required && (
              <Button
                variant="ghost"
                onClick={onSkip}
              >
                Skip Section
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {generatedContent && (
              <Button
                onClick={handleApprove}
                size="lg"
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Approve & Continue
                {!isLast && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

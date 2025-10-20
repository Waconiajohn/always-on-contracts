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
  const [researchProgress, setResearchProgress] = useState<string[]>([]);

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
    setResearchProgress([]);

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const selectedItems = relevantMatches.filter(m =>
        selectedVaultItems.includes(m.vaultItemId)
      );

      // Show research progress
      const progressSteps = [
        `Analyzing job requirements for ${jobAnalysis.roleProfile?.title || 'this role'}...`,
        `Researching ${jobAnalysis.roleProfile?.industry || 'industry'} standards...`,
        `Matching your Career Vault items to job requirements...`,
        `Incorporating ATS keywords and optimizing language...`,
        `Generating ${section.title}...`
      ];

      let stepIndex = 0;
      progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length) {
          setResearchProgress(prev => [...prev, progressSteps[stepIndex]]);
          stepIndex++;
        }
      }, 800);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-resume-section`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            sectionType: section.type,
            sectionGuidance: section.guidancePrompt,
            jobAnalysis,
            vaultItems: selectedItems,
            userSelections: selectedVaultItems
          })
        }
      );

      if (progressInterval) clearInterval(progressInterval);
      setResearchProgress(prev => [...prev, '✓ Generation complete!']);

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 429) {
          toast({
            title: "Rate limit exceeded",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive"
          });
        } else if (response.status === 402) {
          toast({
            title: "Credits required",
            description: "Please add credits to your Lovable AI workspace to continue.",
            variant: "destructive"
          });
        } else {
          throw new Error(errorData.error || "Failed to generate section");
        }
        setResearchProgress([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.content);
        setEditedContent(
          typeof data.content === 'string'
            ? data.content
            : JSON.stringify(data.content, null, 2)
        );
        toast({
          title: "Section generated",
          description: "Review the content and approve when ready"
        });
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      setResearchProgress([]);
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
    handleGenerate();
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

                {/* Research Progress Indicator */}
                {researchProgress.length > 0 && (
                  <div className="w-full max-w-md bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="space-y-2">
                      {researchProgress.map((step, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">
                            {step.startsWith('✓') ? '✓' : '•'}
                          </span>
                          <span className={cn(
                            "text-foreground",
                            step.startsWith('✓') && "font-semibold text-success"
                          )}>
                            {step.replace('✓ ', '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Generated Content Review */}
          {generatedContent && (
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

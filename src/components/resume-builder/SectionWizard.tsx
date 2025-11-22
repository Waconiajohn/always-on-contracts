import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
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
import { VaultItemAttributionBadge } from "@/components/career-vault/VaultItemAttributionBadge";
import { RequirementBulletMapper } from "./v2/RequirementBulletMapper";

import { ResumeSection } from "@/lib/resumeFormats";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction, PerplexityResearchSchema, safeValidateInput } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";
import { DualGenerationComparison } from "./DualGenerationComparison";
import { GenerationProgress } from "./GenerationProgress";
import { TooltipHelp } from "./HelpTooltip";
import { getErrorMessage, getRecoverySuggestion, isRetryableError } from "@/lib/errorMessages";
import { GenerationTimer, trackVersionSelection, trackSectionComplete, calculateVaultStrength, analytics } from "@/lib/resumeAnalytics";
import { executeWithRetry } from "@/lib/errorHandling";

interface VaultMatch {
  vaultItemId: string;
  vaultCategory: string;
  content: any;
  matchScore: number;
  matchReasons: string[];
  satisfiesRequirements: string[];
  atsKeywords: string[];
  enhancedLanguage?: string;
  qualityTier?: 'gold' | 'silver' | 'bronze' | 'assumed';
  freshnessScore?: number;
}

interface SectionWizardProps {
  section: ResumeSection;
  vaultMatches: VaultMatch[];
  jobAnalysis: any;
  resumeMilestones?: any[];
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
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<string>("");
  const [jobResearch, setJobResearch] = useState<any>(null);
  const [idealContent] = useState<any>(null);
  const [personalizedContent] = useState<any>(null);
  const [blendContent] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [currentGenerationStep, setCurrentGenerationStep] = useState(0);
  const [vaultItemsUsed] = useState<any[]>([]);
  const [showEvidenceMapper, setShowEvidenceMapper] = useState(false);
  const [evidenceMatrix, setEvidenceMatrix] = useState<any[]>([]);
  const [evidenceSelections, setEvidenceSelections] = useState<Record<string, { version: string; customText?: string }>>({});

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
  // AI automatically uses ALL relevant matches - no manual selection needed
  const relevantMatches = vaultMatches.filter(match =>
    section.vaultCategories.includes(match.vaultCategory)
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowComparison(false);
    setShowEvidenceMapper(false);
    setCurrentGenerationStep(0);

    // Track generation start
    await analytics.trackGenerationStart('section-by-section', {
      section_type: section.type,
      vault_items: relevantMatches.length
    });

    // Start tracking generation time
    const timer = new GenerationTimer(section.type, {
      job_title: jobAnalysis.roleProfile?.title,
      industry: jobAnalysis.roleProfile?.industry,
      section_id: section.id
    });

    try {
      // Use retry logic for generation
      const result = await executeWithRetry(
        async () => {
          // Get authenticated user
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("User not authenticated");

          // Use ALL relevant vault matches automatically - no manual selection
          const vaultStrength = calculateVaultStrength(relevantMatches);

          // Step 1: Get or fetch job analysis research (cache this globally)
          setCurrentGenerationStep(0);

          let research = jobResearch;
          if (!research) {
            const researchPayload = {
              research_type: 'resume_job_analysis' as const,
              query_params: {
                job_description: jobAnalysis.originalJobDescription || '',
                job_title: jobAnalysis.roleProfile?.title || '',
                company: jobAnalysis.roleProfile?.company || '',
                industry: jobAnalysis.roleProfile?.industry || '',
                location: jobAnalysis.roleProfile?.location || ''
              }
            };

            const validation = safeValidateInput(PerplexityResearchSchema, researchPayload);
            if (!validation.success) {
              throw new Error('Invalid research parameters');
            }

            const { data: researchData, error: researchError } = await invokeEdgeFunction(
              'perplexity-research',
              researchPayload
            );

            if (researchError) {
              logger.error('Job analysis failed', researchError);
              throw new Error(`Job analysis failed: ${researchError.message || 'Unable to analyze job description'}`);
            }

            research = researchData;
            setJobResearch(research);
          }

          // Step 1.5: Match requirements to bullets to create evidence matrix
          setCurrentGenerationStep(1);
          const requirementsForSection = [
            ...(jobAnalysis.jobRequirements?.required || []).map((r: any) => ({
              id: r.id || crypto.randomUUID(),
              requirement: r.requirement || r,
              category: 'required' as const
            })),
            ...(jobAnalysis.jobRequirements?.preferred || []).map((r: any) => ({
              id: r.id || crypto.randomUUID(),
              requirement: r.requirement || r,
              category: 'preferred' as const
            }))
          ];

          const { data: matchData, error: matchError } = await invokeEdgeFunction(
            'match-requirements-to-bullets',
            {
              userId: user.id,
              jobRequirements: requirementsForSection,
              atsKeywords: jobAnalysis.atsKeywords || { critical: [], important: [], nice_to_have: [] }
            }
          );

          if (matchError) {
            logger.error('Requirement matching failed', matchError);
            throw new Error(`Requirement matching failed: ${matchError.message}`);
          }

          // Show evidence mapper for user review
          setEvidenceMatrix(matchData.evidenceMatrix || []);
          setShowEvidenceMapper(true);
          setIsGenerating(false);
          return { skipFinalGeneration: true, vaultStrength };
        },
        {
          operationName: 'Evidence Mapping',
          config: { maxRetries: 2 },
          showToasts: true
        }
      );

      if (result.skipFinalGeneration) return;

      // This code should never be reached as we return early after showing evidence mapper
      // Evidence approval will trigger handleEvidenceApprove instead
      
      // This code path should not execute

    } catch (error) {
      logger.error('Error generating section', error);

      // Determine operation context for better error messages
      const operation: 'research' | 'ideal_generation' | 'personalized_generation' | 'general' = 
        currentGenerationStep === 0 ? 'research'
        : currentGenerationStep === 1 ? 'ideal_generation'
        : currentGenerationStep === 2 ? 'personalized_generation'
        : 'general';

      const errorContext = {
        error: error instanceof Error ? error : new Error('Unknown error'),
        operation,
        retryable: error instanceof Error ? isRetryableError(error) : true
      };

      const errorInfo = getErrorMessage(errorContext);
      const suggestions = getRecoverySuggestion(errorContext);

      // Track failed generation
      await timer.fail(errorContext.error, operation);

      toast({
        title: errorInfo.title,
        description: `${errorInfo.description}${suggestions.length > 0 ? '\n\nTips:\n• ' + suggestions.join('\n• ') : ''}`,
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
    setShowEvidenceMapper(false);
    setEvidenceSelections({});
    handleGenerate();
  };

  const handleEvidenceApprove = async () => {
    // User has approved evidence mappings, now generate final bullets
    setShowEvidenceMapper(false);
    setIsGenerating(true);
    setCurrentGenerationStep(2);

    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Save evidence selections to database for audit trail
      const mappings = evidenceMatrix.map(item => ({
        user_id: user.id,
        requirement_id: item.requirementId,
        requirement_text: item.requirementText,
        requirement_category: item.requirementCategory,
        milestone_id: item.milestoneId,
        original_bullet: item.originalBullet,
        original_job_title: item.originalSource?.jobTitle,
        original_company: item.originalSource?.company,
        original_date_range: item.originalSource?.dateRange,
        match_score: item.matchScore,
        match_reasons: item.matchReasons || [],
        enhanced_bullet: item.enhancedBullet,
        ats_keywords: item.atsKeywords || [],
        user_selection: evidenceSelections[item.requirementId]?.version || 'enhanced',
        custom_edit: evidenceSelections[item.requirementId]?.customText
      }));

      const { error: saveError } = await supabase
        .from('resume_requirement_mappings')
        .insert(mappings);

      if (saveError) {
        logger.error('Failed to save evidence mappings', saveError);
        // Don't throw - continue with generation even if save fails
      }

      // Generate final content using evidence
      const { data: finalContent, error: genError } = await invokeEdgeFunction(
        'generate-dual-resume-section',
        {
          sectionType: section.type,
          evidenceMatrix: evidenceMatrix,
          evidenceSelections: evidenceSelections,
          jobAnalysis: jobAnalysis
        }
      );

      if (genError) throw genError;

      setGeneratedContent(finalContent);
      setEditedContent(typeof finalContent === 'string' ? finalContent : JSON.stringify(finalContent, null, 2));
      
      toast({
        title: "Resume section generated",
        description: "Review and approve the generated content"
      });
    } catch (error) {
      logger.error('Error generating final content', error);
      toast({
        title: "Generation failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdeal = async () => {
    setGeneratedContent(idealContent);
    setEditedContent(
      typeof idealContent === 'string'
        ? idealContent
        : JSON.stringify(idealContent, null, 2)
    );
    setShowComparison(false);

    // Track version selection (using all relevant matches)
    await trackVersionSelection('ideal', {
      section_type: section.type,
      vault_items_used: relevantMatches.length,
      vault_strength: calculateVaultStrength(relevantMatches)
    });

    toast({
      title: "Industry standard selected",
      description: "You can edit before approving"
    });
  };

  const handleSelectPersonalized = async () => {
    setGeneratedContent(personalizedContent);
    setEditedContent(
      typeof personalizedContent === 'string'
        ? personalizedContent
        : JSON.stringify(personalizedContent, null, 2)
    );
    setShowComparison(false);

    // Track version selection (using all relevant matches)
    await trackVersionSelection('personalized', {
      section_type: section.type,
      vault_items_used: relevantMatches.length,
      vault_strength: calculateVaultStrength(relevantMatches)
    });

    toast({
      title: "Personalized version selected",
      description: "You can edit before approving"
    });
  };

  const handleSelectBlend = async () => {
    setGeneratedContent(blendContent);
    setEditedContent(
      typeof blendContent === 'string'
        ? blendContent
        : JSON.stringify(blendContent, null, 2)
    );
    setShowComparison(false);

    // Track version selection
    await trackVersionSelection('blend', {
      section_type: section.type,
      vault_items_used: relevantMatches.length,
      vault_strength: calculateVaultStrength(relevantMatches)
    });

    toast({
      title: "Blended version selected",
      description: "AI combined the best of both versions. You can edit before approving"
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

  const handleApprove = async () => {
    const finalContent = isEditing
      ? editedContent
      : generatedContent;

    // Track section completion
    const contentString = typeof finalContent === 'string'
      ? finalContent
      : JSON.stringify(finalContent);

    await trackSectionComplete(section.type, {
      edited: isEditing,
      content_length: contentString.length,
      vault_items_used: relevantMatches.length
    });

    // Convert content to array format if needed
    const contentArray = Array.isArray(finalContent)
      ? finalContent
      : [{ id: crypto.randomUUID(), content: finalContent }];

    onSectionComplete({
      sectionId: section.id,
      type: section.type,
      content: contentArray,
      vaultItemsUsed: vaultItemsUsed
    });
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
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">AI Guidance</h4>
                  <TooltipHelp.SectionGuidance />
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-line">
                  {section.guidancePrompt}
                </div>
              </div>
            </div>
          </Card>

          {/* Ready to Generate */}
          {!generatedContent && (
            <Card className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Ready to Generate</h4>
                  <p className="text-sm text-muted-foreground">
                    AI will use <strong>{relevantMatches.length} relevant Career Vault item{relevantMatches.length !== 1 ? 's' : ''}</strong> to create this section
                  </p>
                </div>

                {relevantMatches.length === 0 && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>No vault matches found</AlertTitle>
                    <AlertDescription>
                      The AI will create content based on job requirements and industry standards.
                      You can add relevant experience to your Career Vault later to improve personalization.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col items-center gap-4 mt-6">
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
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
              </div>
            </Card>
          )}

          {/* Evidence Mapper - Review requirement matches before generating */}
          {showEvidenceMapper && evidenceMatrix.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Review Evidence Matches</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the best version of each bullet to address requirements
                  </p>
                </div>
              </div>
              
              <RequirementBulletMapper
                evidenceMatrix={evidenceMatrix}
                onComplete={(selections) => {
                  setEvidenceSelections(selections);
                  handleEvidenceApprove();
                }}
                onCancel={() => setShowEvidenceMapper(false)}
              />

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowEvidenceMapper(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEvidenceApprove}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Generate Resume Section
                    </>
                  )}
                </Button>
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
              blendContent={blendContent}
              sectionType={section.type}
              vaultStrength={{
                score: calculateVaultStrength(relevantMatches),
                hasRealNumbers: relevantMatches.some(match => {
                  const content = typeof match.content === 'string'
                    ? match.content
                    : JSON.stringify(match.content);
                  return /\d+[%$M]/.test(content);
                }),
                hasDiverseCategories: new Set(relevantMatches.map(m => m.vaultCategory)).size > 2
              }}
              onSelectIdeal={handleSelectIdeal}
              onSelectPersonalized={handleSelectPersonalized}
              onSelectBlend={handleSelectBlend}
              onOpenEditor={handleOpenEditor}
              jobTitle={jobAnalysis.roleProfile?.title}
            />
          )}

          {/* Vault Attribution - Show which items were used */}
          {vaultItemsUsed.length > 0 && generatedContent && !showComparison && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Career Vault Items Used</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-3">
                  {vaultItemsUsed.slice(0, 5).map((item, idx) => {
                    // If item is somehow still a string, try to parse it
                    let safeItem = item;
                    if (typeof item === 'string') {
                      try {
                        safeItem = JSON.parse(item);
                      } catch {
                        return <p key={idx} className="text-xs text-destructive">Invalid vault item data</p>;
                      }
                    }
                    
                    // Ensure required fields exist
                    if (!safeItem.id || !safeItem.category || !safeItem.excerpt) {
                      return null;
                    }
                    
                    return (
                      <VaultItemAttributionBadge
                        key={idx}
                        vaultItem={safeItem}
                        compact
                      />
                    );
                  })}
                  {vaultItemsUsed.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{vaultItemsUsed.length - 5} more vault items used
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
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

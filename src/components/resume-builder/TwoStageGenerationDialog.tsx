import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTwoStageGeneration } from '@/hooks/useTwoStageGeneration';
import { IndustryResearchProgress, defaultResearchSteps, ResearchStep } from './IndustryResearchProgress';
import { IdealExampleCard } from './IdealExampleCard';
import { SideBySideComparison } from './SideBySideComparison';
import { BlendEditor } from './BlendEditor';
import { ResumeStrengthIndicator } from './ResumeStrengthIndicator';
import { analyzeResumeStrength } from '@/lib/resume-strength-analyzer';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';

interface TwoStageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sectionName: string;
  roleTitle: string;
  seniorityLevel: string;
  industry: string;
  jobDescription: string;
  onContentSelect: (content: string) => void;
}

export function TwoStageGenerationDialog({
  open,
  onOpenChange,
  projectId,
  sectionName,
  roleTitle,
  seniorityLevel,
  industry,
  jobDescription,
  onContentSelect,
}: TwoStageGenerationDialogProps) {
  const [showBlendEditor, setShowBlendEditor] = useState(false);
  
  const {
    stage,
    isLoading,
    error,
    industryResearch,
    idealContent,
    personalizedContent,
    userEvidence,
    startGeneration,
    generatePersonalized,
    selectVersion,
    reset,
  } = useTwoStageGeneration();

  // Analyze resume strength when evidence is loaded
  const resumeStrength = useMemo(() => {
    if (userEvidence.length > 0) {
      return analyzeResumeStrength(userEvidence);
    }
    return null;
  }, [userEvidence]);

  // Map stage to research steps with proper statuses (Fix 2: correct indexing)
  const researchSteps: ResearchStep[] = useMemo(() => {
    let currentIndex = -1; // -1 = all pending
    if (stage === 'researching') currentIndex = 0;
    else if (stage === 'generating_ideal') currentIndex = 2;
    else if (stage !== 'idle') currentIndex = 4; // Mark all complete
    
    return defaultResearchSteps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? 'complete' as const : index === currentIndex ? 'active' as const : 'pending' as const,
    }));
  }, [stage]);

  const currentStepIndex = useMemo(() => {
    if (stage === 'researching') return 1;
    if (stage === 'generating_ideal') return 3;
    if (stage !== 'idle') return 4;
    return 0;
  }, [stage]);

  const handleStart = async () => {
    await startGeneration({
      projectId,
      sectionName,
      roleTitle,
      seniorityLevel,
      industry,
      jobDescription,
    });
  };

  const handleSelectIdeal = () => {
    const content = selectVersion('ideal');
    onContentSelect(content);
    handleClose();
  };

  const handleSelectPersonalized = () => {
    const content = selectVersion('personalized');
    onContentSelect(content);
    handleClose();
  };

  const handleBlendComplete = (blendedContent: string) => {
    const content = selectVersion('blend', blendedContent);
    onContentSelect(content);
    handleClose();
  };

  const handleClose = () => {
    reset();
    setShowBlendEditor(false);
    onOpenChange(false);
  };

  // Map section name to section type
  const getSectionType = (): 'summary' | 'skills' | 'experience_bullets' | 'education' => {
    switch (sectionName) {
      case 'summary': return 'summary';
      case 'skills': return 'skills';
      case 'experience': return 'experience_bullets';
      case 'education': return 'education';
      default: return 'summary';
    }
  };

  // Create comparison data from state - Fixed field access (Fix 11: use API word count)
  const comparisonData = useMemo(() => ({
    idealContent: idealContent?.ideal_content || '',
    personalizedContent: personalizedContent?.personalized_content || '',
    idealWordCount: idealContent?.word_count || 0,
    personalizedWordCount: personalizedContent?.word_count || 
      personalizedContent?.personalized_content?.split(/\s+/).filter(Boolean).length || 0,
    similarityScore: personalizedContent?.similarity_to_ideal || 0,
    gapsIdentified: personalizedContent?.gaps_identified || [],
    evidenceUsed: personalizedContent?.evidence_incorporated || [],
  }), [idealContent, personalizedContent]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            World-Class {sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} Generation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Display (Fix 1) */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={reset} className="mt-2">
                Try Again
              </Button>
            </div>
          )}

          {/* Stage: Idle - Start Button */}
          {stage === 'idle' && !error && (
            <div className="text-center space-y-4 py-8">
              <p className="text-muted-foreground">
                Generate a world-class {sectionName} section in two stages:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto text-left">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  Industry research to understand current market standards
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  Generate an ideal "platinum standard" example
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  Personalize with your verified achievements
                </li>
              </ol>
              <Button onClick={handleStart} size="lg" className="mt-4">
                <Wand2 className="h-4 w-4 mr-2" />
                Start Generation
              </Button>
            </div>
          )}

          {/* Stage: Researching or Generating Ideal */}
          {(stage === 'researching' || stage === 'generating_ideal') && (
            <IndustryResearchProgress
              steps={researchSteps}
              currentStepIndex={currentStepIndex}
              roleTitle={roleTitle}
              industry={industry}
              seniorityLevel={seniorityLevel}
            />
          )}

          {/* Stage: Ready for Personalization - Show Ideal + Strength Indicator (Fix 4) */}
          {stage === 'ready_for_personalization' && idealContent && industryResearch && (
            <div className="space-y-6">
              {/* Show strength indicator BEFORE clicking personalize */}
              {resumeStrength && (
                <ResumeStrengthIndicator 
                  strength={resumeStrength} 
                  compact={resumeStrength.isStrongEnough}
                />
              )}
              
              <IdealExampleCard
                sectionType={getSectionType()}
                idealContent={idealContent.ideal_content}
                structureNotes={idealContent.structure_notes}
                keyElements={idealContent.key_elements}
                keywordsIncluded={industryResearch.keywords.slice(0, 8).map(k => k.term)}
                wordCount={idealContent.word_count}
                onUseIdeal={handleSelectIdeal}
                onPersonalize={generatePersonalized}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Stage: Personalizing - Show loading + strength indicator */}
          {stage === 'personalizing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Personalizing with your verified achievements...
              </p>
              
              {/* Show strength indicator during personalization if available */}
              {resumeStrength && !resumeStrength.isStrongEnough && (
                <div className="max-w-md">
                  <div className="flex items-center gap-2 text-warning mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Limited evidence detected</span>
                  </div>
                  <ResumeStrengthIndicator strength={resumeStrength} compact />
                </div>
              )}
            </div>
          )}

          {/* Stage: Comparing - Show both versions + strength warning if weak */}
          {stage === 'comparing' && idealContent && personalizedContent && !showBlendEditor && (
            <div className="space-y-4">
              {/* Strength warning banner */}
              {resumeStrength && !resumeStrength.isStrongEnough && (
                <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        Your resume has limited evidence ({resumeStrength.overallScore}% strength)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The personalized version may be less impactful. Consider adding more achievements to improve results.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <SideBySideComparison
                data={comparisonData}
                onSelectIdeal={handleSelectIdeal}
                onSelectPersonalized={handleSelectPersonalized}
                onBlend={() => setShowBlendEditor(true)}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Blend Editor Mode */}
          {showBlendEditor && idealContent && personalizedContent && (
            <BlendEditor
              idealContent={idealContent.ideal_content}
              personalizedContent={personalizedContent.personalized_content}
              onSave={handleBlendComplete}
              onCancel={() => setShowBlendEditor(false)}
              isLoading={isLoading}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

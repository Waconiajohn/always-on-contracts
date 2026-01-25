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
import { Loader2, Wand2 } from 'lucide-react';

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
    industryResearch,
    idealContent,
    personalizedContent,
    startGeneration,
    generatePersonalized,
    selectVersion,
    reset,
  } = useTwoStageGeneration();

  // Map stage to research steps with proper statuses
  const researchSteps: ResearchStep[] = useMemo(() => {
    const stepsWithStatus = [...defaultResearchSteps];
    
    let currentIndex = 0;
    if (stage === 'researching') currentIndex = 0;
    else if (stage === 'generating_ideal') currentIndex = 2;
    else if (stage === 'ready_for_personalization' || stage === 'personalizing' || stage === 'comparing' || stage === 'complete') currentIndex = 4;
    
    return stepsWithStatus.map((step, index) => ({
      ...step,
      status: index < currentIndex ? 'complete' : index === currentIndex ? 'active' : 'pending',
    }));
  }, [stage]);

  const currentStepIndex = useMemo(() => {
    if (stage === 'researching') return 1;
    if (stage === 'generating_ideal') return 2;
    if (stage === 'ready_for_personalization' || stage === 'personalizing' || stage === 'comparing' || stage === 'complete') return 4;
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

  // Create comparison data from state
  const comparisonData = useMemo(() => ({
    idealContent: idealContent?.content || '',
    personalizedContent: personalizedContent?.content || '',
    idealWordCount: idealContent?.content.split(/\s+/).filter(Boolean).length || 0,
    personalizedWordCount: personalizedContent?.content.split(/\s+/).filter(Boolean).length || 0,
    similarityScore: 75, // Default similarity
    gapsIdentified: [],
    evidenceUsed: [],
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
          {/* Stage: Idle - Start Button */}
          {stage === 'idle' && (
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

          {/* Stage: Ready for Personalization - Show Ideal */}
          {stage === 'ready_for_personalization' && idealContent && industryResearch && (
            <div className="space-y-6">
              <IdealExampleCard
                sectionType={getSectionType()}
                idealContent={idealContent.content}
                structureNotes={idealContent.explanation}
                keyElements={[
                  'Strong action verbs',
                  'Quantified achievements',
                  'Industry keywords',
                  'Results-focused',
                ]}
                keywordsIncluded={industryResearch.keywords.slice(0, 8)}
                wordCount={idealContent.content.split(/\s+/).filter(Boolean).length}
                onUseIdeal={handleSelectIdeal}
                onPersonalize={generatePersonalized}
                isLoading={isLoading}
              />
            </div>
          )}

          {/* Stage: Personalizing */}
          {stage === 'personalizing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Personalizing with your verified achievements...
              </p>
            </div>
          )}

          {/* Stage: Comparing - Show both versions */}
          {stage === 'comparing' && idealContent && personalizedContent && !showBlendEditor && (
            <SideBySideComparison
              data={comparisonData}
              onSelectIdeal={handleSelectIdeal}
              onSelectPersonalized={handleSelectPersonalized}
              onBlend={() => setShowBlendEditor(true)}
              isLoading={isLoading}
            />
          )}

          {/* Blend Editor Mode */}
          {showBlendEditor && idealContent && personalizedContent && (
            <BlendEditor
              idealContent={idealContent.content}
              personalizedContent={personalizedContent.content}
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

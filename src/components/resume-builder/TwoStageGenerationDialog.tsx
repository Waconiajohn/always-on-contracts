import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTwoStageGeneration } from '@/hooks/useTwoStageGeneration';
import { IndustryResearchProgress, defaultResearchSteps, ResearchStep } from './IndustryResearchProgress';
import { IdealExampleCard } from './IdealExampleCard';
import { SideBySideComparison } from './SideBySideComparison';
import { BlendEditor } from './BlendEditor';
import { ResumeStrengthIndicator } from './ResumeStrengthIndicator';
import { analyzeResumeStrength } from '@/lib/resume-strength-analyzer';
import { 
  mapUISectionToAPIType, 
  mapToRBEvidence,
  type PartialEvidence 
} from '@/lib/resume-section-utils';
import { Loader2, Wand2, AlertTriangle } from 'lucide-react';
import type { RBEvidence } from '@/types/resume-builder';

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
  const navigate = useNavigate();
  const [showBlendEditor, setShowBlendEditor] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [previewEvidence, setPreviewEvidence] = useState<RBEvidence[]>([]);
  
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

  // Fix 5: Pre-fetch evidence when dialog opens to show strength in idle state
  useEffect(() => {
    if (open && projectId) {
      supabase
        .from('rb_evidence')
        .select('id, claim_text, evidence_quote, source, category, confidence, is_active, project_id, span_location, created_at')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .then(({ data, error: fetchError }) => {
          if (fetchError) {
            console.error('[TwoStageGenerationDialog] Evidence pre-fetch failed:', fetchError);
            return;
          }
          if (data) {
            setPreviewEvidence(mapToRBEvidence(data as PartialEvidence[]));
          }
        });
    }
  }, [open, projectId]);

  // Analyze resume strength - use hook evidence when available, preview otherwise
  const resumeStrength = useMemo(() => {
    const evidence = userEvidence.length > 0 ? userEvidence : previewEvidence;
    if (evidence.length > 0) {
      return analyzeResumeStrength(evidence);
    }
    return null;
  }, [userEvidence, previewEvidence]);

  // Fix 4: Unified progress step logic - single source of truth
  const { researchSteps, progressPercent } = useMemo(() => {
    let activeIndex = -1;
    if (stage === 'researching') activeIndex = 0;
    else if (stage === 'generating_ideal') activeIndex = 2;
    else if (stage !== 'idle') activeIndex = 4; // All complete

    const steps: ResearchStep[] = defaultResearchSteps.map((step, index) => ({
      ...step,
      status: index < activeIndex ? 'complete' as const : index === activeIndex ? 'active' as const : 'pending' as const,
    }));

    const percent = activeIndex >= 0 
      ? Math.round((Math.min(activeIndex + 1, steps.length) / steps.length) * 100)
      : 0;

    return { researchSteps: steps, progressPercent: percent };
  }, [stage]);

  // Fix 12: Debounced start handler
  const handleStart = async () => {
    if (isStarting || isLoading) return;
    setIsStarting(true);
    try {
      await startGeneration({
        projectId,
        sectionName,
        roleTitle,
        seniorityLevel,
        industry,
        jobDescription,
      });
    } finally {
      setIsStarting(false);
    }
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
    setPreviewEvidence([]);
    onOpenChange(false);
  };

  // Fix 5: Navigate to fix page when user wants to improve strength
  const handleImproveStrength = () => {
    handleClose();
    navigate(`/resume-builder/${projectId}/fix`);
  };

  // Get section type using shared utility
  const sectionType = mapUISectionToAPIType(sectionName);

  // Create comparison data from state - uses API word count when available
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

          {/* Stage: Idle - Start Button with Strength Preview */}
          {stage === 'idle' && !error && (
            <div className="text-center space-y-4 py-8">
              {/* Show strength indicator in idle state */}
              {resumeStrength && !resumeStrength.isStrongEnough && (
                <div className="max-w-md mx-auto mb-4">
                  <ResumeStrengthIndicator 
                    strength={resumeStrength} 
                    onImprove={handleImproveStrength}
                    compact 
                  />
                </div>
              )}
              
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
              <Button 
                onClick={handleStart} 
                size="lg" 
                className="mt-4"
                disabled={isStarting || isLoading}
              >
                {isStarting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Start Generation
              </Button>
            </div>
          )}

          {/* Stage: Researching or Generating Ideal */}
          {(stage === 'researching' || stage === 'generating_ideal') && (
            <IndustryResearchProgress
              steps={researchSteps}
              progressPercent={progressPercent}
              roleTitle={roleTitle}
              industry={industry}
              seniorityLevel={seniorityLevel}
            />
          )}

          {/* Stage: Ready for Personalization - Show Ideal + Strength Indicator (Fix 4) */}
          {stage === 'ready_for_personalization' && idealContent && industryResearch && (
            <div className="space-y-6">
              {resumeStrength && (
                <ResumeStrengthIndicator 
                  strength={resumeStrength} 
                  compact={resumeStrength.isStrongEnough}
                  onImprove={handleImproveStrength}
                />
              )}
              
              <IdealExampleCard
                sectionType={sectionType}
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

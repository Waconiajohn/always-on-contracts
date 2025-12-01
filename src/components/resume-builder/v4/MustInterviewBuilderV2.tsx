/**
 * MustInterviewBuilderV2 - Main Orchestrator
 * 
 * The complete 5-step guided resume builder that ties everything together.
 * Features:
 * - Step stepper with progress visualization
 * - Central state management via useBuilderState
 * - Job change detection with warning
 * - Loading states for AI analysis
 * - Export functionality
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Types
import type { 
  JobBlueprint, 
  GapAnalysis, 
  RoleData, 
  BulletSuggestion,
  BuilderStep 
} from "./types/builderV2Types";

// Hooks
import { useBuilderState } from "./hooks/useBuilderState";

// Steps
import { ResumeOverviewStep } from "./steps/ResumeOverviewStep";
import { HighlightsStep } from "./steps/HighlightsStep";
import { ExperienceStep } from "./steps/ExperienceStep";
import { SkillsStep } from "./steps/SkillsStep";
import { ReviewStep } from "./steps/ReviewStep";

// Config
import { STEP_CONFIG } from "./config/resumeBuilderRules";

import {
  Target,
  Star,
  Briefcase,
  Wrench,
  FileCheck,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from "lucide-react";

// ============================================================================
// PROPS
// ============================================================================

interface MustInterviewBuilderV2Props {
  jobDescription: string;
  jobTitle: string;
  companyName?: string;
  
  // Data from AI analysis (can be passed in or fetched)
  initialJobBlueprint?: JobBlueprint;
  initialGaps?: GapAnalysis[];
  initialRoles?: RoleData[];
  initialHighlightSuggestions?: BulletSuggestion[];
  initialScore?: number;
  
  // Callbacks for AI operations
  onAnalyzeJob?: (jobDescription: string) => Promise<{
    blueprint: JobBlueprint;
    gaps: GapAnalysis[];
    roles: RoleData[];
    highlightSuggestions: BulletSuggestion[];
    score: number;
  }>;
  onRescore?: (resumeText: string) => Promise<number>;
  onExportDOCX?: (resumeHtml: string) => Promise<void>;
  onExportPDF?: (resumeHtml: string) => Promise<void>;
}

// ============================================================================
// STEP ICONS
// ============================================================================

const stepIcons: Record<BuilderStep, React.ElementType> = {
  1: Target,
  2: Star,
  3: Briefcase,
  4: Wrench,
  5: FileCheck,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const MustInterviewBuilderV2 = ({
  jobDescription,
  jobTitle,
  companyName,
  initialJobBlueprint,
  initialGaps,
  initialRoles,
  initialHighlightSuggestions,
  initialScore = 0,
  onAnalyzeJob,
  onRescore,
  onExportDOCX,
  onExportPDF,
}: MustInterviewBuilderV2Props) => {
  // State management
  const builder = useBuilderState({
    jobDescription,
    jobTitle,
    companyName,
    persistKey: `builder_v2_${jobTitle.toLowerCase().replace(/\s+/g, '_')}`,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      // If we have initial data, use it
      if (initialJobBlueprint && initialGaps && initialRoles) {
        builder.setJobBlueprint(initialJobBlueprint);
        builder.setGaps(initialGaps);
        builder.setRoles(initialRoles);
        builder.setScores({ 
          initialScore, 
          currentScore: initialScore, 
          projectedScore: initialScore + 20 
        });
        
        // Initialize bullets
        if (initialHighlightSuggestions) {
          builder.initializeBullets('highlights', initialHighlightSuggestions);
        }
        initialRoles.forEach(role => {
          if (role.suggestions) {
            builder.initializeBullets(`role_${role.id}`, role.suggestions);
          }
        });
        return;
      }

      // Otherwise, analyze if we have a callback
      if (onAnalyzeJob && !builder.state.jobBlueprint) {
        setIsAnalyzing(true);
        setAnalysisError(null);
        try {
          const result = await onAnalyzeJob(jobDescription);
          builder.setJobBlueprint(result.blueprint);
          builder.setGaps(result.gaps);
          builder.setRoles(result.roles);
          builder.setScores({ 
            initialScore: result.score, 
            currentScore: result.score,
            projectedScore: result.score + 20 
          });
          builder.initializeBullets('highlights', result.highlightSuggestions);
          result.roles.forEach(role => {
            if (role.suggestions) {
              builder.initializeBullets(`role_${role.id}`, role.suggestions);
            }
          });
        } catch (error) {
          setAnalysisError("Failed to analyze job description. Please try again.");
        } finally {
          setIsAnalyzing(false);
        }
      }
    };

    initializeData();
  }, [jobDescription]); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed values for steps
  const highlightsSuggestions = useMemo(() => {
    return builder.getBulletsForSection('highlights').map(entry => ({
      id: entry.bulletId,
      originalText: entry.originalText || '',
      suggestedText: entry.aiSuggestedText,
      editedText: entry.status === 'edited' ? entry.finalText : undefined,
      status: entry.status,
      confidence: 'high' as const,
      whyThisHelps: '',
      supports: [],
      sourceBasis: '',
      interviewQuestions: [],
      order: 0,
    }));
  }, [builder.state.bulletStore]);

  const highlightsSection = useMemo(() => ({
    bullets: highlightsSuggestions,
  }), [highlightsSuggestions]);

  const rolesSuggestions = useMemo(() => {
    return builder.state.roleOrder.map(roleId => {
      const role = builder.state.roleData.get(roleId);
      if (!role) return null;
      
      const bullets = builder.getBulletsForSection(`role_${roleId}`);
      const acceptedCount = bullets.filter(b => 
        b.status === 'accepted' || b.status === 'edited'
      ).length;
      
      return {
        role,
        suggestions: bullets.map(entry => ({
          id: entry.bulletId,
          originalText: entry.originalText || '',
          suggestedText: entry.aiSuggestedText,
          editedText: entry.status === 'edited' ? entry.finalText : undefined,
          status: entry.status,
          confidence: 'high' as const,
          whyThisHelps: '',
          supports: [],
          sourceBasis: '',
          interviewQuestions: [],
          order: 0,
        })),
        acceptedCount,
        hasOriginalBullets: bullets.some(b => !!b.originalText),
        relevantCompetencies: role.relevantCompetencies || [],
      };
    }).filter(Boolean) as any[];
  }, [builder.state.roleOrder, builder.state.roleData, builder.state.bulletStore]);

  const totalExperienceBullets = useMemo(() => {
    return rolesSuggestions.reduce((sum, r) => sum + r.acceptedCount, 0);
  }, [rolesSuggestions]);

  // Handle bullet actions
  const handleHighlightBulletAction = useCallback((
    bulletId: string,
    action: 'accept' | 'reject' | 'edit',
    editedText?: string
  ) => {
    if (action === 'accept') builder.acceptBullet(bulletId);
    else if (action === 'reject') builder.rejectBullet(bulletId);
    else if (action === 'edit' && editedText) builder.editBullet(bulletId, editedText);
  }, [builder]);

  const handleExperienceBulletAction = useCallback((
    _roleId: string,
    bulletId: string,
    action: 'accept' | 'reject' | 'edit' | 'useOriginal',
    editedText?: string
  ) => {
    if (action === 'accept') builder.acceptBullet(bulletId);
    else if (action === 'reject') builder.rejectBullet(bulletId);
    else if (action === 'edit' && editedText) builder.editBullet(bulletId, editedText);
    else if (action === 'useOriginal') builder.useOriginal(bulletId);
  }, [builder]);

  // Export handlers
  const handleRescore = useCallback(async () => {
    if (!onRescore) return builder.state.currentScore;
    const resume = builder.reconstructFinalResume();
    const newScore = await onRescore(JSON.stringify(resume));
    builder.setScores({ currentScore: newScore });
    return newScore;
  }, [builder, onRescore]);

  const handleExportDOCX = useCallback(async () => {
    if (!onExportDOCX) {
      // Fallback: copy to clipboard
      const resume = builder.reconstructFinalResume();
      await navigator.clipboard.writeText(JSON.stringify(resume, null, 2));
      return;
    }
    const resume = builder.reconstructFinalResume();
    await onExportDOCX(JSON.stringify(resume));
  }, [builder, onExportDOCX]);

  const handleExportPDF = useCallback(async () => {
    if (!onExportPDF) return;
    const resume = builder.reconstructFinalResume();
    await onExportPDF(JSON.stringify(resume));
  }, [builder, onExportPDF]);

  // Edit section handler
  const handleEditSection = useCallback((section: 'highlights' | 'experience' | 'skills') => {
    const stepMap = { highlights: 2, experience: 3, skills: 4 };
    builder.goToStep(stepMap[section] as BuilderStep);
  }, [builder]);

  // Loading state
  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card>
          <CardContent className="pt-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analyzing Job Description</h2>
            <p className="text-muted-foreground">
              Finding gaps, generating suggestions, and creating your attack plan...
            </p>
            <Progress value={33} className="mt-6 max-w-md mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (analysisError) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription>{analysisError}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Job change warning dialog
  if (builder.showJobChangeWarning) {
    return (
      <Dialog open={true}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Different Job Detected
            </DialogTitle>
            <DialogDescription>
              You're starting a new résumé build for a different job. 
              Your previous progress will be cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={builder.cancelJobChange}>
              Keep Previous Work
            </Button>
            <Button onClick={builder.confirmJobChange}>
              Start Fresh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Get progress percentage
  const progressPercent = ((builder.state.currentStep - 1) / 4) * 100;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header with stepper */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold">{jobTitle}</h1>
              {companyName && (
                <p className="text-sm text-muted-foreground">{companyName}</p>
              )}
            </div>
            <Badge variant="outline" className="gap-1">
              Score: {builder.state.currentScore}
            </Badge>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between">
            {([1, 2, 3, 4, 5] as BuilderStep[]).map((step) => {
              const Icon = stepIcons[step];
              const config = STEP_CONFIG[step];
              const isActive = step === builder.state.currentStep;
              const isComplete = step < builder.state.currentStep;
              const isClickable = step <= builder.state.currentStep;

              return (
                <div key={step} className="flex items-center flex-1">
                  <button
                    onClick={() => isClickable && builder.goToStep(step)}
                    disabled={!isClickable}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                      isActive && "bg-primary/10",
                      isClickable && !isActive && "hover:bg-muted cursor-pointer",
                      !isClickable && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full",
                      isActive && "bg-primary text-white",
                      isComplete && "bg-green-500 text-white",
                      !isActive && !isComplete && "bg-muted"
                    )}>
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium hidden sm:block",
                      isActive && "text-primary",
                      !isActive && "text-muted-foreground"
                    )}>
                      {config.name}
                    </span>
                  </button>
                  
                  {step < 5 && (
                    <div className="flex-1 mx-2">
                      <div className={cn(
                        "h-0.5 rounded",
                        step < builder.state.currentStep ? "bg-green-500" : "bg-muted"
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <Progress value={progressPercent} className="h-1 mt-3" />
        </div>
      </div>

      {/* Main content */}
      <div className="py-6 px-4">
        {/* Step 1: Overview */}
        {builder.state.currentStep === 1 && builder.state.jobBlueprint && (
          <ResumeOverviewStep
            currentScore={builder.state.currentScore}
            projectedScore={builder.state.projectedScore}
            scoreBreakdown={builder.state.scoreBreakdown}
            gaps={builder.state.gaps}
            jobBlueprint={builder.state.jobBlueprint}
            estimatedTime="15-20 min"
            onStartBuilding={builder.nextStep}
          />
        )}

        {/* Step 2: Highlights */}
        {builder.state.currentStep === 2 && builder.state.jobBlueprint && (
          <HighlightsStep
            highlights={highlightsSection}
            jobBlueprint={builder.state.jobBlueprint}
            scores={{
              current: builder.state.currentScore,
              projected: builder.state.projectedScore,
            }}
            onBulletAction={handleHighlightBulletAction}
            onApproveAllHighConfidence={() => 
              builder.approveAllHighConfidence('highlights', highlightsSuggestions)
            }
            onNext={builder.nextStep}
            onBack={builder.prevStep}
          />
        )}

        {/* Step 3: Experience */}
        {builder.state.currentStep === 3 && builder.state.jobBlueprint && (
          <ExperienceStep
            roles={rolesSuggestions}
            jobBlueprint={builder.state.jobBlueprint}
            gaps={builder.state.gaps}
            gapStatus={builder.gapStatus}
            totalAcceptedBullets={totalExperienceBullets}
            onBulletAction={handleExperienceBulletAction}
            onApproveAllHighConfidence={(roleId) => {
              const role = rolesSuggestions.find(r => r.role.id === roleId);
              if (role) {
                builder.approveAllHighConfidence(`role_${roleId}`, role.suggestions);
              }
            }}
            onNext={builder.nextStep}
            onBack={builder.prevStep}
          />
        )}

        {/* Step 4: Skills */}
        {builder.state.currentStep === 4 && (
          <SkillsStep
            existingSkills={builder.state.existingSkills}
            suggestedSkills={builder.state.suggestedSkills}
            onAcceptSkill={builder.acceptSkill}
            onRejectSkill={builder.rejectSkill}
            onAddCustomSkill={builder.addCustomSkill}
            onRemoveExistingSkill={(_skill) => {
              // For now, just filter out - would need to add to hook
            }}
            onNext={builder.nextStep}
            onBack={builder.prevStep}
          />
        )}

        {/* Step 5: Review */}
        {builder.state.currentStep === 5 && (
          <ReviewStep
            finalResume={builder.reconstructFinalResume()}
            initialScore={builder.state.initialScore}
            currentScore={builder.state.currentScore}
            gapStatus={builder.gapStatus}
            onRescore={handleRescore}
            onExportDOCX={handleExportDOCX}
            onExportPDF={handleExportPDF}
            onBack={builder.prevStep}
            onEditSection={handleEditSection}
          />
        )}
      </div>
    </div>
  );
};

export default MustInterviewBuilderV2;

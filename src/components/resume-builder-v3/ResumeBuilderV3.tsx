// =====================================================
// RESUME BUILDER V3 - MAIN CONTAINER
// =====================================================
// Consolidated 3-step flow:
// 1. Upload & Analyze (Fit Analysis)
// 2. Candidate Interview (Fill Gaps)
// 3. Edit & Optimize (Side-by-side editing + analysis)
// =====================================================

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useResumeBuilderV3Store, Step } from "@/stores/resumeBuilderV3Store";

// Hook to wait for store hydration before checking session
const useStoreHydration = () => {
  return useSyncExternalStore(
    (callback) => useResumeBuilderV3Store.persist.onFinishHydration(callback),
    () => useResumeBuilderV3Store.persist.hasHydrated(),
    () => false // SSR fallback
  );
};
import { UploadStep } from "./UploadStep";
import { FitAnalysisStep } from "./FitAnalysisStep";
import { InterviewStep } from "./InterviewStep";
import { EditAndOptimizeStep } from "./EditAndOptimizeStep";
import { SessionRecoveryDialogV3 } from "./SessionRecoveryDialogV3";
import { StepTransition } from "./StepTransition";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, RotateCcw, CheckCircle2 } from "lucide-react";
import { ResumeBuilderErrorBoundary } from "./components/ErrorBoundary";
import { StepErrorBoundary } from "./components/StepErrorBoundary";
import { SESSION_RECOVERY_MIN_CHARS, SESSION_RECOVERY_MIN_JOB_CHARS, STEP_LABELS, TOTAL_STEPS } from "./constants";

// Navigation state types from other pages
interface NavigationState {
  fromQuickScore?: boolean;
  resumeText?: string;
  jobDescription?: string;
  savedResumeId?: string;
  savedContent?: unknown;
}

// Map step numbers to display labels
const STEP_DISPLAY_LABELS = Object.values(STEP_LABELS).map(label => 
  label.split(' ')[0] // Just use first word for brevity in progress bar
);

export function ResumeBuilderV3() {
  const location = useLocation();
  const isHydrated = useStoreHydration();
  const { 
    step, 
    fitAnalysis,
    questions,
    finalResume,
    reset, 
    setStep, 
    setResumeText, 
    setJobDescription, 
    lastUpdated 
  } = useResumeBuilderV3Store();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasHandledNavState, setHasHandledNavState] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  const previousStepRef = useRef<Step>(step);

  // Handle navigation state from other pages (QuickScore, MyResumes)
  useEffect(() => {
    if (hasHandledNavState) return;
    
    const state = location.state as NavigationState | null;
    
    if (state?.fromQuickScore && state.resumeText) {
      reset();
      setResumeText(state.resumeText);
      if (state.jobDescription) {
        setJobDescription(state.jobDescription);
      }
      window.history.replaceState({}, document.title);
      setHasHandledNavState(true);
      setHasCheckedSession(true);
      return;
    }
    
    if (state?.savedResumeId && state?.savedContent) {
      window.history.replaceState({}, document.title);
      setHasHandledNavState(true);
    }
  }, [location.state, hasHandledNavState, reset, setResumeText, setJobDescription]);

  const resumeText = useResumeBuilderV3Store((state) => state.resumeText);
  const jobDescription = useResumeBuilderV3Store((state) => state.jobDescription);

  // Check for existing session on mount
  useEffect(() => {
    if (!isHydrated || hasCheckedSession || hasHandledNavState) return;
    
    const hasRealProgress = 
      fitAnalysis !== null || 
      step > 1 ||
      (resumeText.length > SESSION_RECOVERY_MIN_CHARS && jobDescription.length > SESSION_RECOVERY_MIN_JOB_CHARS);
      
    if (hasRealProgress) {
      setShowRecoveryDialog(true);
    }
    setHasCheckedSession(true);
  }, [isHydrated, hasCheckedSession, hasHandledNavState, fitAnalysis, step, resumeText.length, jobDescription.length]);

  // Step prerequisite validation for 3-step flow
  useEffect(() => {
    if (!isHydrated) return;
    
    // Step 2 requires questions
    if (step === 2 && (!questions || !questions.questions || questions.questions.length === 0)) {
      console.warn('[Resume Builder] Step 2 without questions, redirecting');
      if (fitAnalysis) {
        setStep(1);
      } else {
        reset();
      }
      return;
    }
    
    // Step 3 requires final resume
    if (step === 3 && !finalResume) {
      console.warn('[Resume Builder] Step 3 without resume, redirecting');
      if (questions?.questions?.length) {
        setStep(2);
      } else {
        reset();
      }
    }
  }, [isHydrated, step, questions, finalResume, fitAnalysis, setStep, reset]);

  const progressValue = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  useEffect(() => {
    if (step !== previousStepRef.current) {
      setTransitionDirection(step > previousStepRef.current ? "forward" : "backward");
      previousStepRef.current = step;
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setTransitionDirection("backward");
      setStep((step - 1) as Step);
    }
  }, [step, setStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && step > 1 && !showRecoveryDialog && !showResetDialog) {
        handleBack();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, showRecoveryDialog, showResetDialog, handleBack]);

  const handleResetClick = () => {
    setShowResetDialog(true);
  };

  const handleResetConfirm = () => {
    reset();
    setShowResetDialog(false);
  };

  const handleContinueSession = () => {
    setShowRecoveryDialog(false);
  };

  const handleStartFresh = () => {
    reset();
    setShowRecoveryDialog(false);
  };

  return (
    <ResumeBuilderErrorBoundary onReset={reset}>
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        <SessionRecoveryDialogV3
          open={showRecoveryDialog}
          onContinue={handleContinueSession}
          onStartFresh={handleStartFresh}
        />

        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Over?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your progress. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleResetConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Start Over
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 sm:gap-4">
              {step > 1 && (
                <Button variant="ghost" size="sm" onClick={handleBack} className="px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Resume Builder</h1>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {lastUpdated && (
                <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span className="hidden xs:inline">Saved</span>
                </Badge>
              )}
              {fitAnalysis && (
                <Button variant="outline" size="sm" onClick={handleResetClick} className="px-2 sm:px-3">
                  <RotateCcw className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Start Over</span>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2" role="navigation" aria-label="Resume builder progress">
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              {STEP_DISPLAY_LABELS.map((label, index) => (
                <span
                  key={label}
                  className={`text-center flex-1 ${
                    index + 1 === step
                      ? "text-primary font-medium"
                      : index + 1 < step
                      ? "text-primary/70"
                      : ""
                  }`}
                  aria-current={index + 1 === step ? "step" : undefined}
                >
                  <span className="hidden xs:inline">{label}</span>
                  <span className="xs:hidden">{index + 1}</span>
                </span>
              ))}
            </div>
            <Progress 
              value={progressValue} 
              className="h-2" 
              aria-label={`Step ${step} of ${TOTAL_STEPS}: ${STEP_LABELS[step]}`}
            />
          </div>
        </div>

        <main 
          className="bg-card rounded-lg border p-4 sm:p-6"
          role="main"
          aria-label={`Step ${step}: ${STEP_LABELS[step]}`}
          aria-busy={!isHydrated}
        >
          <StepTransition step={step} direction={transitionDirection}>
            {step === 1 && !fitAnalysis && (
              <StepErrorBoundary key="upload" stepName="Upload"><UploadStep /></StepErrorBoundary>
            )}
            {step === 1 && fitAnalysis && (
              <StepErrorBoundary key="fit" stepName="Fit Analysis"><FitAnalysisStep /></StepErrorBoundary>
            )}
            {step === 2 && (
              <StepErrorBoundary key="interview" stepName="Interview"><InterviewStep /></StepErrorBoundary>
            )}
            {step === 3 && (
              <StepErrorBoundary key="edit" stepName="Edit & Optimize"><EditAndOptimizeStep /></StepErrorBoundary>
            )}
          </StepTransition>
        </main>

        {step > 1 && (
          <p className="text-xs text-muted-foreground text-center mt-4" aria-hidden="true">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> to go back
          </p>
        )}
      </div>
    </ResumeBuilderErrorBoundary>
  );
}

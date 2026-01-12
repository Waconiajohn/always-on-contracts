// =====================================================
// RESUME BUILDER V3 - MAIN CONTAINER
// =====================================================
// Simple 4-step flow:
// 1. Upload & Analyze (Fit Analysis)
// 2. Industry Standards Review
// 3. Candidate Interview (Fill Gaps)
// 4. Generate & Review Resume
// =====================================================

import { useState, useEffect, useCallback, useRef } from "react";
import { useResumeBuilderV3Store, Step } from "@/stores/resumeBuilderV3Store";
import { UploadStep } from "./UploadStep";
import { FitAnalysisStep } from "./FitAnalysisStep";
import { StandardsStep } from "./StandardsStep";
import { InterviewStep } from "./InterviewStep";
import { GenerateStep } from "./GenerateStep";
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

const STEP_LABELS = ["Analyze", "Standards", "Interview", "Generate"];

export function ResumeBuilderV3() {
  const { step, fitAnalysis, reset, setStep, lastUpdated } = useResumeBuilderV3Store();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"forward" | "backward">("forward");
  const previousStepRef = useRef<Step>(step);

  // Check for existing session on mount
  // Only show recovery if they have actual analysis results (not just typed text)
  useEffect(() => {
    if (!hasCheckedSession) {
      const hasRealProgress = fitAnalysis !== null || step > 1;
      if (hasRealProgress) {
        setShowRecoveryDialog(true);
      }
      setHasCheckedSession(true);
    }
  }, [hasCheckedSession, fitAnalysis, step]);

  const progressValue = ((step - 1) / 3) * 100;

  // Track step changes for animation direction
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

  // Keyboard navigation - Escape to go back
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
      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        {/* Session Recovery Dialog */}
        <SessionRecoveryDialogV3
          open={showRecoveryDialog}
          onContinue={handleContinueSession}
          onStartFresh={handleStartFresh}
        />

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start Over?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all your progress including your resume text, job description, and any answers you've provided. This action cannot be undone.
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

        {/* Header with progress */}
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
              {/* Auto-save indicator */}
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

          {/* Step indicator */}
          <div className="space-y-2" role="navigation" aria-label="Resume builder progress">
            <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
              {STEP_LABELS.map((label, index) => (
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
              aria-label={`Step ${step} of 4: ${STEP_LABELS[step - 1]}`}
            />
          </div>
        </div>

        {/* Step content */}
        <main 
          className="bg-card rounded-lg border p-4 sm:p-6"
          role="main"
          aria-label={`Step ${step}: ${STEP_LABELS[step - 1]}`}
        >
          <StepTransition step={step} direction={transitionDirection}>
            {step === 1 && !fitAnalysis && <UploadStep />}
            {step === 1 && fitAnalysis && <FitAnalysisStep />}
            {step === 2 && <StandardsStep />}
            {step === 3 && <InterviewStep />}
            {step === 4 && <GenerateStep />}
          </StepTransition>
        </main>

        {/* Keyboard shortcuts hint */}
        {step > 1 && (
          <p className="text-xs text-muted-foreground text-center mt-4" aria-hidden="true">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> to go back
          </p>
        )}
      </div>
    </ResumeBuilderErrorBoundary>
  );
}

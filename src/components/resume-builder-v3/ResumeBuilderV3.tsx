// =====================================================
// RESUME BUILDER V3 - MAIN CONTAINER
// =====================================================
// Simple 4-step flow:
// 1. Upload & Analyze (Fit Analysis)
// 2. Industry Standards Review
// 3. Candidate Interview (Fill Gaps)
// 4. Generate & Review Resume
// =====================================================

import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { UploadStep } from "./UploadStep";
import { FitAnalysisStep } from "./FitAnalysisStep";
import { StandardsStep } from "./StandardsStep";
import { InterviewStep } from "./InterviewStep";
import { GenerateStep } from "./GenerateStep";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw } from "lucide-react";

const STEP_LABELS = ["Analyze", "Standards", "Interview", "Generate"];

export function ResumeBuilderV3() {
  const { step, fitAnalysis, reset, setStep } = useResumeBuilderV3Store();

  const progressValue = ((step - 1) / 3) * 100;

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleReset = () => {
    if (confirm("Start over? This will clear all your progress.")) {
      reset();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <h1 className="text-2xl font-bold text-foreground">Resume Builder</h1>
          </div>
          {fitAnalysis && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Start Over
            </Button>
          )}
        </div>

        {/* Step indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            {STEP_LABELS.map((label, index) => (
              <span
                key={label}
                className={
                  index + 1 === step
                    ? "text-primary font-medium"
                    : index + 1 < step
                    ? "text-primary/70"
                    : ""
                }
              >
                {label}
              </span>
            ))}
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>
      </div>

      {/* Step content */}
      <div className="bg-card rounded-lg border p-6">
        {step === 1 && !fitAnalysis && <UploadStep />}
        {step === 1 && fitAnalysis && <FitAnalysisStep />}
        {step === 2 && <StandardsStep />}
        {step === 3 && <InterviewStep />}
        {step === 4 && <GenerateStep />}
      </div>
    </div>
  );
}

// =====================================================
// STEP 1B: Display Fit Analysis Results
// =====================================================

import { useResumeBuilderV3Store, StandardsResult, QuestionsResult } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  XCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<string, string> = {
  excellent: "Excellent Match",
  good: "Good Match",
  partial: "Partial Match",
  needs_work: "Needs Work"
};

const getTier = (score: number): string => {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "partial";
  return "needs_work";
};

export function FitAnalysisStep() {
  const {
    fitAnalysis,
    resumeText,
    jobDescription,
    setStandards,
    setQuestions,
    setStep,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  const { callApi, isRetrying, currentAttempt, cancel, maxAttempts } = useResumeBuilderApi();
  const [showAllStrengths, setShowAllStrengths] = useState(false);
  const [showAllGaps, setShowAllGaps] = useState(false);

  if (!fitAnalysis) return null;

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading industry standards">
        <LoadingSkeletonV3 
          type="standards" 
          message={isRetrying ? `Retrying... (Attempt ${currentAttempt}/${maxAttempts})` : "Researching industry standards and preparing interview questions..."} 
          onCancel={() => {
            cancel();
            setLoading(false);
          }}
        />
      </div>
    );
  }

  const handleContinue = async () => {
    setLoading(true);

    const standardsResult = await callApi<StandardsResult>({
      step: "standards",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
      },
      successMessage: "Standards analysis complete!",
    });

    if (!standardsResult) {
      setLoading(false);
      return;
    }
    
    setStandards(standardsResult);

    const questionsResult = await callApi<QuestionsResult>({
      step: "questions",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
        standards: standardsResult,
      },
      successMessage: "Interview questions ready!",
    });

    if (questionsResult) {
      setQuestions(questionsResult);
      setStep(2);
    }
    
    setLoading(false);
  };

  const score = fitAnalysis.fit_score;
  const tier = getTier(score);

  return (
    <div className="space-y-8">
      {/* Score Display - Minimalist */}
      <div className="text-center py-6" aria-live="polite" aria-atomic="true">
        <div className="inline-flex flex-col items-center">
          <div className="text-6xl font-light tracking-tight text-foreground">
            {score}
            <span className="text-3xl text-muted-foreground">%</span>
          </div>
          <div className="text-lg font-medium text-foreground mt-1">
            {TIER_LABELS[tier]}
          </div>
        </div>
        
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
          {fitAnalysis.executive_summary}
        </p>

        {/* Quick stats row */}
        <div className="flex items-center justify-center gap-8 text-sm pt-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span><strong>{fitAnalysis.strengths.length}</strong> strengths</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span><strong>{fitAnalysis.gaps.length}</strong> gaps</span>
          </div>
        </div>
      </div>

      {/* Strengths Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAllStrengths(!showAllStrengths)}
          className="w-full flex items-center justify-between group"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            What's Working ({fitAnalysis.strengths.length})
          </h3>
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            showAllStrengths && "rotate-90"
          )} />
        </button>

        {fitAnalysis.strengths.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No strong matches identified yet. The interview step will help us find your strengths.
          </p>
        ) : (
          <div className="space-y-0">
            {(showAllStrengths ? fitAnalysis.strengths : fitAnalysis.strengths.slice(0, 3)).map((strength, index) => (
              <div
                key={index}
                className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
              >
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{strength.requirement}</p>
                    {strength.strength_level === "strong" && (
                      <span className="text-xs text-muted-foreground">(Strong)</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{strength.evidence}</p>
                </div>
              </div>
            ))}
            {!showAllStrengths && fitAnalysis.strengths.length > 3 && (
              <button
                onClick={() => setShowAllStrengths(true)}
                className="text-sm text-primary hover:underline pt-2"
              >
                Show {fitAnalysis.strengths.length - 3} more...
              </button>
            )}
          </div>
        )}
      </div>

      {/* Gaps Section */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAllGaps(!showAllGaps)}
          className="w-full flex items-center justify-between group"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Gaps to Address ({fitAnalysis.gaps.length})
          </h3>
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            showAllGaps && "rotate-90"
          )} />
        </button>

        {fitAnalysis.gaps.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-primary py-2">
            <CheckCircle2 className="h-4 w-4" />
            Great news! No significant gaps identified.
          </div>
        ) : (
          <div className="space-y-0">
            {(showAllGaps ? fitAnalysis.gaps : fitAnalysis.gaps.slice(0, 3)).map((gap, index) => (
              <div
                key={index}
                className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
              >
                <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{gap.requirement}</p>
                    <span className="text-xs text-muted-foreground capitalize">({gap.severity})</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{gap.suggestion}</p>
                </div>
              </div>
            ))}
            {!showAllGaps && fitAnalysis.gaps.length > 3 && (
              <button
                onClick={() => setShowAllGaps(true)}
                className="text-sm text-primary hover:underline pt-2"
              >
                Show {fitAnalysis.gaps.length - 3} more...
              </button>
            )}
          </div>
        )}
      </div>

      {/* ATS Keywords Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          ATS Keywords
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="font-medium">Found ({fitAnalysis.keywords_found.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fitAnalysis.keywords_found.map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-xs font-normal">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Missing ({fitAnalysis.keywords_missing.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {fitAnalysis.keywords_missing.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs font-normal">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={handleContinue} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Comparing to Standards...
            </>
          ) : (
            <>
              Compare to Industry Standards
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// STEP 2: Industry Standards Comparison
// =====================================================

import { useResumeBuilderV3Store, QuestionsResult } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Lightbulb,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function StandardsStep() {
  const {
    standards,
    fitAnalysis,
    resumeText,
    jobDescription,
    setQuestions,
    setStep,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  const { callApi, isRetrying, currentAttempt, cancel, maxAttempts } = useResumeBuilderApi();
  const [showAllBenchmarks, setShowAllBenchmarks] = useState(true);
  const [showMetrics, setShowMetrics] = useState(false);

  if (!standards) return null;

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Generating interview questions">
        <LoadingSkeletonV3 
          type="questions" 
          message={isRetrying ? `Retrying... (Attempt ${currentAttempt}/${maxAttempts})` : "Generating personalized interview questions..."} 
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

    const result = await callApi<QuestionsResult>({
      step: "questions",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
        standards,
      },
      successMessage: "Interview questions ready!",
    });

    if (result) {
      setQuestions(result);
      setStep(3);
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "exceeds":
        return <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />;
      case "meets":
        return <MinusCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
      case "below":
        return <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "exceeds":
        return "Exceeds";
      case "meets":
        return "Meets";
      case "below":
        return "Below";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Industry Standards</h2>
        <p className="text-muted-foreground">
          {standards.industry} • {standards.profession} • {standards.seniority_level.charAt(0).toUpperCase() + standards.seniority_level.slice(1)} Level
        </p>
      </div>

      {/* Benchmarks */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAllBenchmarks(!showAllBenchmarks)}
          className="w-full flex items-center justify-between group"
        >
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            How You Compare ({standards.benchmarks.length})
          </h3>
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            showAllBenchmarks && "rotate-90"
          )} />
        </button>

        {standards.benchmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No benchmarks available for this role. We'll use general best practices.
          </p>
        ) : showAllBenchmarks && (
          <div className="space-y-0">
            {standards.benchmarks.map((benchmark, index) => (
              <div
                key={index}
                className="flex items-start gap-3 py-4 border-b border-border/50 last:border-0"
              >
                {getStatusIcon(benchmark.candidate_status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{benchmark.benchmark}</p>
                    <span className="text-xs text-muted-foreground">({getStatusLabel(benchmark.candidate_status)})</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{benchmark.evidence}</p>
                  {benchmark.recommendation && (
                    <p className="text-sm text-primary mt-2 flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {benchmark.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keywords and Phrases - Side by side */}
      {(standards.industry_keywords.length > 0 || standards.power_phrases.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {standards.industry_keywords.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Industry Keywords
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {standards.industry_keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs font-normal">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {standards.power_phrases.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Power Phrases
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {standards.power_phrases.map((phrase, index) => (
                  <Badge key={index} variant="outline" className="text-xs font-normal">
                    {phrase}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Suggestions */}
      {standards.metrics_suggestions.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="w-full flex items-center justify-between group"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggested Metrics ({standards.metrics_suggestions.length})
            </h3>
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showMetrics && "rotate-90"
            )} />
          </button>

          {showMetrics && (
            <ul className="space-y-2 pt-2">
              {standards.metrics_suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-muted-foreground">{suggestion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Continue button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={handleContinue} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Preparing Questions...
            </>
          ) : (
            <>
              Fill Gaps with Interview
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

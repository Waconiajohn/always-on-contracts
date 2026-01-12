// =====================================================
// STEP 1B: Display Fit Analysis Results
// =====================================================

import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  TrendingUp,
  Tag,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";

export function FitAnalysisStep() {
  const {
    fitAnalysis,
    resumeText,
    jobDescription,
    setStandards,
    setStep,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  if (!fitAnalysis) return null;

  // Show loading skeleton when fetching standards
  if (isLoading) {
    return <LoadingSkeletonV3 type="standards" message="Researching industry standards and benchmarks..." />;
  }

  const handleContinue = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("resume-builder-v3", {
        body: {
          step: "standards",
          resumeText,
          jobDescription,
          fitAnalysis,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Standards comparison failed");

      setStandards(data.data);
      setStep(2);
      toast.success("Standards analysis complete!");
    } catch (error) {
      console.error("Standards error:", error);
      toast.error(error instanceof Error ? error.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent match";
    if (score >= 60) return "Good match";
    if (score >= 40) return "Partial match";
    return "Needs improvement";
  };

  return (
    <div className="space-y-6">
      {/* Fit Score */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Fit Score</span>
        </div>
        <div className={`text-5xl font-bold ${getScoreColor(fitAnalysis.fit_score)}`}>
          {fitAnalysis.fit_score}%
        </div>
        <p className="text-sm font-medium mt-1">
          <span className={getScoreColor(fitAnalysis.fit_score)}>
            {getScoreLabel(fitAnalysis.fit_score)}
          </span>
        </p>
        <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
          {fitAnalysis.executive_summary}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Strengths ({fitAnalysis.strengths.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fitAnalysis.strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No strong matches identified yet. The interview step will help us find your strengths.
              </p>
            ) : (
              fitAnalysis.strengths.map((strength, index) => (
                <div key={index} className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{strength.requirement}</p>
                    <Badge variant={strength.strength_level === "strong" ? "default" : "secondary"}>
                      {strength.strength_level}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{strength.evidence}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Gaps */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Gaps to Address ({fitAnalysis.gaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fitAnalysis.gaps.length === 0 ? (
              <p className="text-sm text-green-600 italic flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Great news! No significant gaps identified.
              </p>
            ) : (
              fitAnalysis.gaps.map((gap, index) => (
                <div key={index} className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{gap.requirement}</p>
                    <Badge
                      variant={
                        gap.severity === "critical"
                          ? "destructive"
                          : gap.severity === "moderate"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {gap.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{gap.suggestion}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Keywords */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-primary" />
            ATS Keywords
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-green-600 mb-2">
                ✓ Found ({fitAnalysis.keywords_found.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {fitAnalysis.keywords_found.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-amber-600 mb-2">
                ✗ Missing ({fitAnalysis.keywords_missing.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {fitAnalysis.keywords_missing.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

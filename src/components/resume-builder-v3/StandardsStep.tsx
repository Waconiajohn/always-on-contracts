// =====================================================
// STEP 2: Industry Standards Comparison
// =====================================================

import { useResumeBuilderV3Store } from "@/stores/resumeBuilderV3Store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Building2,
  Briefcase,
  TrendingUp,
  Lightbulb,
  Loader2,
  CheckCircle,
  AlertCircle,
  MinusCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  if (!standards) return null;

  const handleContinue = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("resume-builder-v3", {
        body: {
          step: "questions",
          resumeText,
          jobDescription,
          fitAnalysis,
          standards,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Failed to generate questions");

      setQuestions(data.data);
      setStep(3);
      toast.success("Interview questions ready!");
    } catch (error) {
      console.error("Questions error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "exceeds":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "meets":
        return <MinusCircle className="h-4 w-4 text-blue-600" />;
      case "below":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "exceeds":
        return <Badge className="bg-green-100 text-green-800">Exceeds</Badge>;
      case "meets":
        return <Badge className="bg-blue-100 text-blue-800">Meets</Badge>;
      case "below":
        return <Badge className="bg-amber-100 text-amber-800">Below</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with industry info */}
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Industry Standards Comparison</h2>
        <div className="inline-flex gap-4 flex-wrap justify-center">
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Building2 className="h-4 w-4 mr-1" />
            {standards.industry}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <Briefcase className="h-4 w-4 mr-1" />
            {standards.profession}
          </Badge>
          <Badge variant="outline" className="text-sm px-3 py-1">
            <TrendingUp className="h-4 w-4 mr-1" />
            {standards.seniority_level.charAt(0).toUpperCase() + standards.seniority_level.slice(1)} Level
          </Badge>
        </div>
      </div>

      {/* Benchmarks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">How You Compare</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {standards.benchmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              No benchmarks available for this role. We'll use general best practices.
            </p>
          ) : (
            standards.benchmarks.map((benchmark, index) => (
              <div
                key={index}
                className="p-4 bg-muted/50 rounded-lg flex items-start gap-3"
              >
                {getStatusIcon(benchmark.candidate_status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-medium">{benchmark.benchmark}</p>
                    {getStatusBadge(benchmark.candidate_status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{benchmark.evidence}</p>
                  {benchmark.recommendation && (
                    <p className="text-sm text-primary mt-2 flex items-start gap-1">
                      <Lightbulb className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      {benchmark.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Keywords and Phrases */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Industry Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {standards.industry_keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Power Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {standards.power_phrases.map((phrase, index) => (
                <Badge key={index} variant="outline">
                  {phrase}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics suggestions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Add These Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {standards.metrics_suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {suggestion}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

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

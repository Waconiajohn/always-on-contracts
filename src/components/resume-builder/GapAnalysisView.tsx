import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { GapSolutionsCard } from "./GapSolutionsCard";

interface GapAnalysisViewProps {
  unmatchedRequirements: string[];
  coverageScore: number;
  totalRequirements: number;
  onContinue: () => void;
  vaultMatches?: any[];
  jobAnalysis?: any;
}

export const GapAnalysisView = ({
  unmatchedRequirements,
  coverageScore,
  totalRequirements,
  onContinue,
  vaultMatches = [],
  jobAnalysis
}: GapAnalysisViewProps) => {
  // Calculate matched count directly from unmatched requirements
  const matchedCount = totalRequirements - unmatchedRequirements.length;
  const gapCount = unmatchedRequirements.length;

  const getCoverageColor = () => {
    if (coverageScore >= 80) return "text-success";
    if (coverageScore >= 60) return "text-warning";
    return "text-destructive";
  };

  const getCoverageIcon = () => {
    if (coverageScore >= 80) return <CheckCircle2 className="h-6 w-6 text-success" />;
    return <AlertTriangle className="h-6 w-6 text-warning" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Gap Analysis Complete</h1>
          <p className="text-lg text-muted-foreground">
            Review how your Career Vault matches this job's requirements
          </p>
        </div>

        {/* Coverage Summary */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            {getCoverageIcon()}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold">Coverage Score</h3>
                <div className={`text-3xl font-bold ${getCoverageColor()}`}>
                  {coverageScore}%
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your Career Vault addresses {matchedCount} of {totalRequirements} requirements
              </p>

              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    coverageScore >= 80 ? 'bg-success' :
                    coverageScore >= 60 ? 'bg-warning' :
                    'bg-destructive'
                  }`}
                  style={{ width: `${coverageScore}%` }}
                />
              </div>

              {coverageScore >= 80 && (
                <div className="mt-4 flex items-start gap-2 text-success">
                  <TrendingUp className="h-4 w-4 mt-0.5" />
                  <p className="text-sm">
                    Excellent match! Your vault strongly supports this application.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Gaps Section */}
        {gapCount > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Requirements Not Fully Matched ({gapCount})
              </h2>
              <Badge variant="outline" className="bg-warning/10">
                Needs Attention
              </Badge>
            </div>

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>AI Gap Solutions Available</AlertTitle>
              <AlertDescription>
                After extensive analysis of your Career Vault against this job's requirements, 
                we've identified {gapCount} {gapCount === 1 ? 'area' : 'areas'} where you may not have 
                direct experience documented—but that doesn't mean you can't address {gapCount === 1 ? 'it' : 'them'}. 
                For each gap, we've generated three strategic approaches: an industry-standard response, 
                a reframing based on your existing experience, and an alternative positioning using transferable skills. 
                Choose the best solution for each requirement, and it will be saved to your Career Vault 
                for use on future applications as well.
              </AlertDescription>
            </Alert>

            {unmatchedRequirements.map((requirement, index) => (
              <GapSolutionsCard
                key={index}
                requirement={requirement}
                vaultMatches={vaultMatches}
                jobContext={{
                  title: jobAnalysis?.roleProfile?.title || 'this role',
                  industry: jobAnalysis?.roleProfile?.industry || 'your industry',
                  seniority: jobAnalysis?.roleProfile?.seniority || 'mid-level'
                }}
                onAddToVault={(solution) => {
                  console.log('Added solution to vault:', solution);
                }}
              />
            ))}
          </div>
        )}

        {/* No Gaps - Celebration */}
        {gapCount === 0 && (
          <Card className="p-6 bg-success/5 border-success/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <h3 className="font-semibold text-success">Perfect Match!</h3>
                <p className="text-sm text-muted-foreground">
                  Your Career Vault addresses all job requirements. Ready to generate an exceptional resume.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end pt-6">
          <Button
            onClick={onContinue}
            size="lg"
            className="gap-2"
          >
            Continue to Resume Generation
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* What Happens Next */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-2">What happens next</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">1.</span>
                  <span>AI will generate your resume using <strong>all {matchedCount} matched vault items</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">2.</span>
                  <span>Each section shows which vault items were used and why</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">3.</span>
                  <span>You can review, edit, and approve each section</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">4.</span>
                  <span>Gaps will be addressed with transferable skills and workarounds</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

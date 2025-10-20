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
import { useState } from "react";

interface GapAnalysisViewProps {
  unmatchedRequirements: string[];
  coverageScore: number;
  totalRequirements: number;
  onContinue: () => void;
}

export const GapAnalysisView = ({
  unmatchedRequirements,
  coverageScore,
  totalRequirements,
  onContinue
}: GapAnalysisViewProps) => {
  const [gapActions, setGapActions] = useState<Record<string, string>>({});

  // Calculate matched count directly from unmatched requirements
  const matchedCount = totalRequirements - unmatchedRequirements.length;
  const gapCount = unmatchedRequirements.length;

  const handleGapAction = (requirement: string, action: string) => {
    setGapActions(prev => ({ ...prev, [requirement]: action }));
  };

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
              <AlertTitle>How to handle gaps</AlertTitle>
              <AlertDescription>
                The AI will work around these gaps by emphasizing transferable skills and relevant experience.
                You can also add missing items to your Career Vault now, or continue and address them during editing.
              </AlertDescription>
            </Alert>

            {unmatchedRequirements.map((requirement, index) => (
              <Card key={index} className="p-4 border-warning/30">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{requirement}</p>
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  <div className="ml-8 space-y-2">
                    <p className="text-xs text-muted-foreground">AI will handle this by:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Emphasizing transferable skills that partially match</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Highlighting relevant experience from your vault</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <span>Positioning you as a quick learner in this area</span>
                      </li>
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-8 flex gap-2">
                    <Button
                      variant={gapActions[requirement] === 'continue' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleGapAction(requirement, 'continue')}
                      className="text-xs"
                    >
                      Let AI handle it
                    </Button>
                    <Button
                      variant={gapActions[requirement] === 'add' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleGapAction(requirement, 'add')}
                      className="text-xs"
                    >
                      I have this (add to vault)
                    </Button>
                  </div>
                </div>
              </Card>
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

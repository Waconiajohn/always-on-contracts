/**
 * ResumeOverviewStep - Step 1
 * 
 * In 30 seconds, the user knows:
 * - Their current alignment score for this job
 * - Their top strengths
 * - Their top gaps (prioritized with severity)
 * - Which sections we'll work through
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import type { GapAnalysis, JobBlueprint } from "../types/builderV2Types";
import { GAP_TYPE_INFO, SEVERITY_COLORS } from "../types/builderV2Types";
import { 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight
} from "lucide-react";

interface ResumeOverviewStepProps {
  currentScore: number;
  projectedScore: number;
  scoreBreakdown: {
    atsMatch: number;
    requirementsCoverage: number;
    competitiveStrength: number;
  };
  gaps: GapAnalysis[];
  jobBlueprint: JobBlueprint;
  estimatedTime: string;
  onStartBuilding: () => void;
}

export const ResumeOverviewStep = ({
  currentScore,
  projectedScore,
  scoreBreakdown,
  gaps,
  jobBlueprint,
  estimatedTime,
  onStartBuilding
}: ResumeOverviewStepProps) => {
  const criticalGaps = gaps.filter(g => g.severity === 'critical');
  const importantGaps = gaps.filter(g => g.severity === 'important');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Must-Interview';
    if (score >= 60) return 'Qualified';
    if (score >= 40) return 'Needs Work';
    return 'Significant Gaps';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-sm mb-4">
          <Clock className="h-4 w-4 text-primary" />
          <span>~{estimatedTime} to must-interview résumé</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">
          Your Résumé Assessment
        </h1>
      </div>

      {/* Score Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              {/* Score Circle */}
              <div className="relative">
                <div className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center border-4",
                  currentScore >= 80 ? "border-green-500 bg-green-50" :
                  currentScore >= 60 ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
                )}>
                  <span className={cn("text-3xl font-bold", getScoreColor(currentScore))}>
                    {currentScore}
                  </span>
                </div>
              </div>
              
              {/* Score Details */}
              <div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "mb-2",
                    currentScore >= 80 ? "bg-green-100 text-green-700 border-green-200" :
                    currentScore >= 60 ? "bg-amber-100 text-amber-700 border-amber-200" : 
                    "bg-red-100 text-red-700 border-red-200"
                  )}
                >
                  {getScoreLabel(currentScore)}
                </Badge>
                <h3 className="text-lg font-semibold">Current Alignment Score</h3>
                <p className="text-sm text-muted-foreground">
                  {currentScore >= 80 
                    ? "You're already in must-interview territory! Let's make it even stronger."
                    : `${80 - currentScore} points needed to reach must-interview status`
                  }
                </p>
              </div>
            </div>

            {/* Projected Score */}
            {projectedScore > currentScore && (
              <div className="text-right">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">{projectedScore}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Projected after fixes
                </p>
              </div>
            )}
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-semibold">{scoreBreakdown.atsMatch}%</p>
              <p className="text-xs text-muted-foreground">ATS Keywords</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-semibold">{scoreBreakdown.requirementsCoverage}%</p>
              <p className="text-xs text-muted-foreground">Requirements</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-2xl font-semibold">{scoreBreakdown.competitiveStrength}/5</p>
              <p className="text-xs text-muted-foreground">Competitive</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gaps Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Critical Gaps */}
        <Card className={cn(
          "border-2",
          criticalGaps.length > 0 ? "border-red-200" : "border-green-200"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  criticalGaps.length > 0 ? "text-red-500" : "text-green-500"
                )} />
                <CardTitle className="text-base">Critical Gaps</CardTitle>
              </div>
              <Badge variant="outline" className={SEVERITY_COLORS['critical']}>
                {criticalGaps.length}
              </Badge>
            </div>
            <CardDescription>
              These will likely cause rejection if not addressed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {criticalGaps.length > 0 ? (
              <ul className="space-y-2">
                {criticalGaps.slice(0, 4).map((gap) => {
                  const typeInfo = GAP_TYPE_INFO[gap.gapType];
                  return (
                    <li key={gap.id} className="flex items-start gap-2 text-sm">
                      <span>{typeInfo.icon}</span>
                      <span className="text-red-700">{gap.title}</span>
                    </li>
                  );
                })}
                {criticalGaps.length > 4 && (
                  <li className="text-sm text-muted-foreground">
                    +{criticalGaps.length - 4} more
                  </li>
                )}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">No critical gaps!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Gaps */}
        <Card className={cn(
          "border-2",
          importantGaps.length > 0 ? "border-amber-200" : "border-green-200"
        )}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className={cn(
                  "h-5 w-5",
                  importantGaps.length > 0 ? "text-amber-500" : "text-green-500"
                )} />
                <CardTitle className="text-base">Important Gaps</CardTitle>
              </div>
              <Badge variant="outline" className={SEVERITY_COLORS['important']}>
                {importantGaps.length}
              </Badge>
            </div>
            <CardDescription>
              Fixing these will significantly improve your chances
            </CardDescription>
          </CardHeader>
          <CardContent>
            {importantGaps.length > 0 ? (
              <ul className="space-y-2">
                {importantGaps.slice(0, 4).map((gap) => {
                  const typeInfo = GAP_TYPE_INFO[gap.gapType];
                  return (
                    <li key={gap.id} className="flex items-start gap-2 text-sm">
                      <span>{typeInfo.icon}</span>
                      <span className="text-amber-700">{gap.title}</span>
                    </li>
                  );
                })}
                {importantGaps.length > 4 && (
                  <li className="text-sm text-muted-foreground">
                    +{importantGaps.length - 4} more
                  </li>
                )}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">No important gaps!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hiring Manager Priorities */}
      {jobBlueprint.hiringManagerPriorities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">What the Hiring Manager Really Wants</CardTitle>
            </div>
            <CardDescription>
              Address these to stand out from other candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {jobBlueprint.hiringManagerPriorities.slice(0, 6).map((priority, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-1.5 px-3">
                  {priority.priority}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attack Plan */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Your Attack Plan
          </CardTitle>
          <CardDescription>
            We'll work through these sections, one at a time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Highlights */}
            <button
              onClick={onStartBuilding}
              className="w-full flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Key Highlights</p>
                  <p className="text-sm text-muted-foreground">
                    Create 4-6 impact statements for the top of your résumé
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Experience */}
            <button
              onClick={onStartBuilding}
              className="w-full flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Professional Experience</p>
                  <p className="text-sm text-muted-foreground">
                    Review and enhance bullets for each role
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Skills */}
            <button
              onClick={onStartBuilding}
              className="w-full flex items-center justify-between p-3 bg-background rounded-lg border hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Skills & Keywords</p>
                  <p className="text-sm text-muted-foreground">
                    Ensure ATS keywords are covered
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onStartBuilding} className="gap-2 px-8">
          <Sparkles className="h-5 w-5" />
          Start Fixing My Résumé
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-xs text-muted-foreground max-w-lg mx-auto">
        AI will generate draft suggestions based on your actual career data. 
        You'll review, edit, and approve each bullet before it's added to your résumé.
      </p>
    </div>
  );
};

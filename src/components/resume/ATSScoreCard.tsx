import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, AlertTriangle } from "lucide-react";

interface ATSScoreData {
  overallScore: number;
  keywordMatch: number;
  formatScore: number;
  experienceMatch: number;
  skillsMatch: number;
  recommendations: string[];
  strengths: string[];
  warnings: string[];
}

interface ATSScoreCardProps {
  scoreData: ATSScoreData;
  isLoading?: boolean;
}

export function ATSScoreCard({ scoreData, isLoading }: ATSScoreCardProps) {
  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ATS Compatibility Analysis
          </CardTitle>
          <CardDescription>Analyzing resume against job requirements...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Excellent", variant: "default" as const };
    if (score >= 60) return { label: "Good", variant: "secondary" as const };
    return { label: "Needs Work", variant: "destructive" as const };
  };

  const badge = getScoreBadge(scoreData.overallScore);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ATS Compatibility Score
          </CardTitle>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <CardDescription>How well your resume matches the job posting</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Match</span>
            <span className={`text-2xl font-bold ${getScoreColor(scoreData.overallScore)}`}>
              {scoreData.overallScore}%
            </span>
          </div>
          <Progress value={scoreData.overallScore} className="h-3" />
        </div>

        {/* Individual Scores */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Keyword Match</span>
              <span className={`font-semibold ${getScoreColor(scoreData.keywordMatch)}`}>
                {scoreData.keywordMatch}%
              </span>
            </div>
            <Progress value={scoreData.keywordMatch} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Format Quality</span>
              <span className={`font-semibold ${getScoreColor(scoreData.formatScore)}`}>
                {scoreData.formatScore}%
              </span>
            </div>
            <Progress value={scoreData.formatScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Experience Match</span>
              <span className={`font-semibold ${getScoreColor(scoreData.experienceMatch)}`}>
                {scoreData.experienceMatch}%
              </span>
            </div>
            <Progress value={scoreData.experienceMatch} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Skills Match</span>
              <span className={`font-semibold ${getScoreColor(scoreData.skillsMatch)}`}>
                {scoreData.skillsMatch}%
              </span>
            </div>
            <Progress value={scoreData.skillsMatch} className="h-2" />
          </div>
        </div>

        {/* Strengths */}
        {scoreData.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              Strengths
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {scoreData.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {scoreData.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              Warnings
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {scoreData.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {scoreData.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Recommendations
            </h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {scoreData.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

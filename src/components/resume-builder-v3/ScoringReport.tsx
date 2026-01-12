// =====================================================
// SCORING REPORT - Static end-of-process quality metrics
// =====================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  FileSearch, 
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { FitAnalysisResult, StandardsResult, OptimizedResume } from "@/stores/resumeBuilderV3Store";

interface ScoringReportProps {
  fitAnalysis: FitAnalysisResult | null;
  standards: StandardsResult | null;
  finalResume: OptimizedResume | null;
}

export function ScoringReport({ fitAnalysis, standards, finalResume }: ScoringReportProps) {
  if (!finalResume) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-amber-100 dark:bg-amber-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Work";
  };

  // Calculate benchmark score from standards
  const benchmarkStats = standards?.benchmarks?.reduce(
    (acc, b) => {
      if (b.candidate_status === "exceeds") acc.exceeds++;
      else if (b.candidate_status === "meets") acc.meets++;
      else acc.below++;
      return acc;
    },
    { exceeds: 0, meets: 0, below: 0 }
  ) || { exceeds: 0, meets: 0, below: 0 };

  const totalBenchmarks = benchmarkStats.exceeds + benchmarkStats.meets + benchmarkStats.below;
  const benchmarkScore = totalBenchmarks > 0 
    ? Math.round(((benchmarkStats.exceeds * 100) + (benchmarkStats.meets * 70) + (benchmarkStats.below * 30)) / totalBenchmarks)
    : 0;

  const originalFitScore = fitAnalysis?.fit_score || 0;
  const atsScore = finalResume.ats_score;
  const improvement = atsScore - originalFitScore;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Quality Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4" role="list" aria-label="Quality scores">
          {/* Original Fit Score */}
          <div 
            className={`rounded-lg p-4 ${getScoreBg(originalFitScore)} text-center`}
            role="listitem"
            aria-label={`Original fit score: ${originalFitScore}%, rated ${getScoreLabel(originalFitScore)}`}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">Original Fit</span>
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(originalFitScore)}`}>
              {originalFitScore}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(originalFitScore)}</p>
          </div>

          {/* ATS Score (After) */}
          <div 
            className={`rounded-lg p-4 ${getScoreBg(atsScore)} text-center relative`}
            role="listitem"
            aria-label={`ATS score: ${atsScore}%, rated ${getScoreLabel(atsScore)}${improvement > 0 ? `, improved by ${improvement}%` : ''}`}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <FileSearch className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">ATS Score</span>
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(atsScore)}`}>
              {atsScore}%
            </p>
            {improvement > 0 ? (
              <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                +{improvement}%
              </Badge>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(atsScore)}</p>
            )}
          </div>

          {/* Benchmark Score */}
          <div 
            className={`rounded-lg p-4 ${getScoreBg(benchmarkScore)} text-center`}
            role="listitem"
            aria-label={`Benchmark score: ${benchmarkScore}%, rated ${getScoreLabel(benchmarkScore)} for ${standards?.seniority_level || 'industry'} level`}
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="text-xs font-medium text-muted-foreground">Benchmark</span>
            </div>
            <p className={`text-3xl font-bold ${getScoreColor(benchmarkScore)}`}>
              {benchmarkScore}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {standards?.seniority_level || 'Industry'} standard
            </p>
          </div>
        </div>

        {/* Benchmark Details */}
        {totalBenchmarks > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Industry Benchmarks</p>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{benchmarkStats.exceeds} Exceeds</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-amber-600" />
                <span>{benchmarkStats.meets} Meets</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{benchmarkStats.below} Below</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

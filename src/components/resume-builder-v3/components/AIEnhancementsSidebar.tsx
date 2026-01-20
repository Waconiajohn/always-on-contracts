/**
 * AIEnhancementsSidebar - Always-visible sidebar showing AI enhancement opportunities
 * Displays match score, priority fixes, keyword status, and section health
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useResumeGapAnalysis } from "@/hooks/useResumeGapAnalysis";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";
import { ScoreCategoryBreakdown } from "./ScoreCategoryBreakdown";
import { GapActionCards } from "./GapActionCards";

interface AIEnhancementsSidebarProps {
  fitAnalysis: FitAnalysisResult | null;
  finalResume: OptimizedResume | null;
  resumeText: string;
  jobDescription: string;
  onSkillAdd?: (skill: string) => void;
}

export function AIEnhancementsSidebar({
  fitAnalysis,
  finalResume,
  resumeText,
  jobDescription,
  onSkillAdd,
}: AIEnhancementsSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  
  const {
    analysis: gapAnalysis,
    isLoading: isAnalyzing,
    analyzeGaps,
    getCriticalGaps,
  } = useResumeGapAnalysis();

  // Auto-analyze on mount if we have the data
  useEffect(() => {
    if (resumeText && jobDescription && !gapAnalysis && !isAnalyzing) {
      analyzeGaps({
        resumeText,
        jobDescription,
        currentSkills: finalResume?.skills,
        currentBullets: finalResume?.experience.flatMap(e => e.bullets),
      });
    }
  }, [resumeText, jobDescription, finalResume]);

  const handleRefreshAnalysis = () => {
    analyzeGaps({
      resumeText,
      jobDescription,
      currentSkills: finalResume?.skills,
      currentBullets: finalResume?.experience.flatMap(e => e.bullets),
    });
  };

  // Calculate score tier
  const score = fitAnalysis?.fit_score || gapAnalysis?.overallFitScore || 0;
  const scoreTier = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'needs-work';
  const tierColors = {
    'excellent': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    'good': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    'fair': 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30',
    'needs-work': 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  };
  const tierLabels = {
    'excellent': '🔥 Excellent Match',
    'good': '✨ Good Match',
    'fair': '⚡ Fair Match',
    'needs-work': '🎯 Needs Work',
  };

  const criticalGaps = getCriticalGaps();
  const matchedKeywords = fitAnalysis?.keywords_found || [];
  const missingKeywords = fitAnalysis?.keywords_missing || [];

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Enhancement Center
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Match Score Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Match Score</span>
              <Badge className={cn("text-xs", tierColors[scoreTier])}>
                {tierLabels[scoreTier]}
              </Badge>
            </div>
            <div className="space-y-1">
              <Progress value={score} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="font-bold text-foreground">{score}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Category Score Breakdown (V2 pattern) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <BarChart3 className="h-3.5 w-3.5 text-primary" />
              Score Breakdown
            </div>
            <ScoreCategoryBreakdown
              categories={[
                { 
                  label: "Keywords", 
                  score: matchedKeywords.length > 0 
                    ? Math.round((matchedKeywords.length / (matchedKeywords.length + missingKeywords.length)) * 100)
                    : 0
                },
                { 
                  label: "Experience", 
                  score: fitAnalysis?.fit_score ? Math.min(100, fitAnalysis.fit_score + 10) : 50
                },
                { 
                  label: "Accomplishments", 
                  score: fitAnalysis?.strengths?.length ? Math.min(100, fitAnalysis.strengths.length * 20) : 40
                },
                { 
                  label: "ATS Compliance", 
                  score: finalResume?.ats_score || 70
                },
              ]}
            />
          </div>

          {/* Gap Action Cards (V2 pattern) */}
          {fitAnalysis?.gaps && fitAnalysis.gaps.length > 0 && (
            <GapActionCards
              fitAnalysis={fitAnalysis}
              onSkillAdd={onSkillAdd}
            />
          )}

          {/* Critical Gaps Alert - only show if no gap cards but have critical gaps from analysis */}
          {(!fitAnalysis?.gaps || fitAnalysis.gaps.length === 0) && criticalGaps.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-destructive">
                    {criticalGaps.length} Critical Gap{criticalGaps.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-destructive/80 mt-0.5">
                    Address these for better alignment
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Priority Fixes */}
          {gapAnalysis?.prioritizedActions && gapAnalysis.prioritizedActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Top Priority Actions
              </div>
              <div className="space-y-1.5">
                {gapAnalysis.prioritizedActions.slice(0, 3).map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/50 text-xs"
                  >
                    <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0">
                      {action.priority}
                    </span>
                    <span className="text-muted-foreground leading-relaxed">{action.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keyword Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                Keywords
              </span>
              <span className="text-[10px] text-muted-foreground">
                {matchedKeywords.length} matched / {missingKeywords.length} missing
              </span>
            </div>

            {/* Matched Keywords */}
            {matchedKeywords.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Matched ({matchedKeywords.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {(showAllKeywords ? matchedKeywords : matchedKeywords.slice(0, 5)).map((kw, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                    >
                      {kw}
                    </Badge>
                  ))}
                  {!showAllKeywords && matchedKeywords.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllKeywords(true)}
                      className="text-[10px] h-5 px-1.5"
                    >
                      +{matchedKeywords.length - 5} more
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {missingKeywords.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Missing ({missingKeywords.length})
                </span>
                <div className="flex flex-wrap gap-1">
                  {missingKeywords.slice(0, 6).map((kw, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSkillAdd?.(kw)}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 h-5 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                      title={`Add "${kw}" to skills`}
                    >
                      + {kw}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Health Quick View */}
          <div className="space-y-2">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
              Section Health
            </span>
            <div className="grid grid-cols-3 gap-2">
              <SectionHealthIndicator
                label="Summary"
                status={fitAnalysis?.strengths?.some(s => s.requirement.toLowerCase().includes('summary')) ? 'good' : 'fair'}
              />
              <SectionHealthIndicator
                label="Experience"
                status={fitAnalysis && fitAnalysis.fit_score >= 70 ? 'good' : 'fair'}
              />
              <SectionHealthIndicator
                label="Skills"
                status={missingKeywords.length === 0 ? 'excellent' : missingKeywords.length <= 3 ? 'good' : 'needs-work'}
              />
            </div>
          </div>

          {/* Refresh Analysis Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAnalysis}
            disabled={isAnalyzing}
            className="w-full text-xs h-8 gap-1.5"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {isAnalyzing ? "Analyzing..." : "Refresh Analysis"}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// Helper component for section health indicators
function SectionHealthIndicator({ 
  label, 
  status 
}: { 
  label: string; 
  status: 'excellent' | 'good' | 'fair' | 'needs-work';
}) {
  const statusConfig = {
    'excellent': { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
    'good': { icon: CheckCircle2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    'fair': { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    'needs-work': { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center gap-1 p-2 rounded-md", config.bg)}>
      <Icon className={cn("h-4 w-4", config.color)} />
      <span className="text-[10px] font-medium">{label}</span>
    </div>
  );
}

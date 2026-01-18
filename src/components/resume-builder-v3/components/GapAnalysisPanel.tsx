/**
 * GapAnalysisPanel - Displays comprehensive gap analysis results
 * Shows prioritized gaps with actionable suggestions
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Target,
  Sparkles,
  Clock,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { GapAnalysisResult } from "@/hooks/useResumeGapAnalysis";

interface GapAnalysisPanelProps {
  analysis: GapAnalysisResult | null;
  isLoading: boolean;
  onAddBullet?: (bullet: string) => void;
  onAddSkill?: (skill: string) => void;
}

const severityColors = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
};

const severityBadgeColors = {
  critical: "destructive" as const,
  high: "default" as const,
  medium: "secondary" as const,
};

export function GapAnalysisPanel({
  analysis,
  isLoading,
  onAddBullet: _onAddBullet, // Reserved for future use
  onAddSkill,
}: GapAnalysisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['prioritizedActions']));

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const criticalGaps = [
    ...analysis.hardSkillGaps.filter(g => g.severity === 'critical'),
    ...analysis.softSkillGaps.filter(g => g.severity === 'critical'),
    ...analysis.experienceGaps.filter(g => g.severity === 'critical'),
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Gap Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={analysis.overallFitScore >= 80 ? "default" : "secondary"}>
              {analysis.overallFitScore}% Fit
            </Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{analysis.gapSummary}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fit Score Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Overall Fit</span>
            <span className="font-medium">{analysis.overallFitScore}%</span>
          </div>
          <Progress value={analysis.overallFitScore} className="h-2" />
        </div>

        {/* Critical Gaps Alert */}
        {criticalGaps.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-red-700 dark:text-red-400">
                {criticalGaps.length} Critical Gap{criticalGaps.length !== 1 ? 's' : ''} Found
              </p>
              <p className="text-red-600/80 dark:text-red-400/80 text-xs mt-0.5">
                Address these first for the best chance of success
              </p>
            </div>
          </div>
        )}

        {/* Prioritized Actions */}
        {analysis.prioritizedActions.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('prioritizedActions')}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Priority Actions ({analysis.prioritizedActions.length})
              </span>
              {expandedSections.has('prioritizedActions') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {expandedSections.has('prioritizedActions') && (
              <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                {analysis.prioritizedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-2 rounded-lg bg-muted/50 border border-border"
                  >
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex-shrink-0">
                      {action.priority}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{action.action}</p>
                      <p className="text-xs text-muted-foreground">{action.impact}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {action.timeEstimate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Skill Gaps */}
        {(analysis.hardSkillGaps.length > 0 || analysis.softSkillGaps.length > 0) && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('skillGaps')}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Skill Gaps ({analysis.hardSkillGaps.length + analysis.softSkillGaps.length})
              </span>
              {expandedSections.has('skillGaps') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.has('skillGaps') && (
              <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                {[...analysis.hardSkillGaps, ...analysis.softSkillGaps].map((gap, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-2 rounded-lg border text-sm",
                      severityColors[gap.severity]
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium">{gap.skill}</span>
                      <Badge variant={severityBadgeColors[gap.severity]} className="text-[10px]">
                        {gap.severity}
                      </Badge>
                    </div>
                    <p className="text-xs opacity-80 mb-2">{gap.bridgingStrategy}</p>
                    {onAddSkill && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddSkill(gap.skill)}
                        className="h-6 px-2 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add to Skills
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Strengths to Leverage */}
        {analysis.strengthsToLeverage.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => toggleSection('strengths')}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-500" />
                Strengths to Leverage ({analysis.strengthsToLeverage.length})
              </span>
              {expandedSections.has('strengths') ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {expandedSections.has('strengths') && (
              <div className="space-y-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                {analysis.strengthsToLeverage.map((strength, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  >
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      {strength.strength}
                    </p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80">
                      {strength.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

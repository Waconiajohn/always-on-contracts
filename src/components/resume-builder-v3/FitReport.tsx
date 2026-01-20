/**
 * FitReport - Unified Analysis + Action Interface
 * 
 * Single scrollable report where:
 * - Perfect matches are celebrated (collapsed by default)
 * - Partial matches show what's weak + suggested improvement + accept/edit inline
 * - Gaps show what's missing + suggested bullet + add/skip inline
 * 
 * No navigation. No cognitive overhead. See problem → fix problem → move on.
 */

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MatchCard } from "./components/MatchCard";
import { GapCard } from "./components/GapCard";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";

interface FitReportProps {
  fitAnalysis: FitAnalysisResult;
  finalResume: OptimizedResume;
  jobDescription: string;
  onBulletUpdate: (experienceIndex: number, bulletIndex: number, newBullet: string) => void;
  onBulletAdd: (experienceIndex: number, newBullet: string) => void;
  onSkillAdd: (skill: string) => void;
  onSummaryUpdate: (newSummary: string) => void;
}

type FitTier = "perfect" | "strong" | "partial" | "weak";

function getFitTier(score: number): FitTier {
  if (score >= 90) return "perfect";
  if (score >= 75) return "strong";
  if (score >= 55) return "partial";
  return "weak";
}

const TIER_CONFIG: Record<FitTier, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
  perfect: {
    label: "Perfect Match",
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900",
    icon: CheckCircle2,
  },
  strong: {
    label: "Strong Match",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900",
    icon: CheckCircle2,
  },
  partial: {
    label: "Partial Match",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900",
    icon: AlertTriangle,
  },
  weak: {
    label: "Needs Work",
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900",
    icon: XCircle,
  },
};

export function FitReport({
  fitAnalysis,
  finalResume,
  jobDescription,
  onBulletUpdate,
  onBulletAdd,
  onSkillAdd,
  onSummaryUpdate,
}: FitReportProps) {
  const [showPerfectMatches, setShowPerfectMatches] = useState(false);
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
  const [skippedActions, setSkippedActions] = useState<Set<string>>(new Set());

  const score = fitAnalysis.fit_score;
  const tier = getFitTier(score);
  const tierConfig = TIER_CONFIG[tier];
  const TierIcon = tierConfig.icon;

  // Separate strengths and gaps
  const perfectMatches = fitAnalysis.strengths.filter(s => s.strength_level === "strong");
  const partialMatches = fitAnalysis.strengths.filter(s => s.strength_level === "moderate");
  const criticalGaps = fitAnalysis.gaps.filter(g => g.severity === "critical");
  const moderateGaps = fitAnalysis.gaps.filter(g => g.severity === "moderate");
  const minorGaps = fitAnalysis.gaps.filter(g => g.severity === "minor");

  // Calculate improvement potential
  const activeGaps = fitAnalysis.gaps.filter(g => !skippedActions.has(`gap-${g.requirement}`));
  const potentialBoost = activeGaps.length * 3; // ~3% per addressed gap

  const handleActionApplied = useCallback((actionId: string) => {
    setAppliedActions(prev => new Set([...prev, actionId]));
  }, []);

  const handleActionSkipped = useCallback((actionId: string) => {
    setSkippedActions(prev => new Set([...prev, actionId]));
  }, []);

  // Count pending actions
  const pendingPartialMatches = partialMatches.filter(m => !appliedActions.has(`partial-${m.requirement}`) && !skippedActions.has(`partial-${m.requirement}`)).length;
  const pendingGaps = activeGaps.filter(g => !appliedActions.has(`gap-${g.requirement}`)).length;

  return (
    <div className="space-y-6">
      {/* Header: Score + Narrative */}
      <div className={cn("rounded-xl border p-6", tierConfig.bgColor)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center justify-center h-14 w-14 rounded-full bg-white dark:bg-gray-900 shadow-sm")}>
              <span className={cn("text-2xl font-bold", tierConfig.color)}>{score}%</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TierIcon className={cn("h-5 w-5", tierConfig.color)} />
                <span className={cn("font-semibold text-lg", tierConfig.color)}>
                  {tierConfig.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
                {fitAnalysis.executive_summary}
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">{perfectMatches.length}</div>
              <div className="text-xs text-muted-foreground">Strong</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600">{partialMatches.length}</div>
              <div className="text-xs text-muted-foreground">Partial</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{fitAnalysis.gaps.length}</div>
              <div className="text-xs text-muted-foreground">Gaps</div>
            </div>
          </div>
        </div>

        {/* Improvement Progress */}
        {(pendingPartialMatches > 0 || pendingGaps > 0) && (
          <div className="mt-4 pt-4 border-t border-current/10">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {pendingPartialMatches + pendingGaps} actions remaining
              </span>
              <span className={cn("font-medium", tierConfig.color)}>
                Potential: {Math.min(100, score + potentialBoost)}%
              </span>
            </div>
            <Progress value={score} className="h-2" />
          </div>
        )}
      </div>

      {/* Perfect Matches (Collapsible - celebrate but don't clutter) */}
      {perfectMatches.length > 0 && (
        <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
          <button
            onClick={() => setShowPerfectMatches(!showPerfectMatches)}
            className="w-full flex items-center justify-between p-4 hover:bg-green-100/50 dark:hover:bg-green-900/20 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-300">
                {perfectMatches.length} Strong Match{perfectMatches.length !== 1 ? "es" : ""} — You nail these!
              </span>
            </div>
            {showPerfectMatches ? (
              <ChevronUp className="h-4 w-4 text-green-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-green-600" />
            )}
          </button>
          
          {showPerfectMatches && (
            <div className="px-4 pb-4 space-y-2">
              {perfectMatches.map((match, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{match.requirement}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{match.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Partial Matches - Each with inline action */}
      {partialMatches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-amber-600" />
            <h3 className="font-medium text-amber-800 dark:text-amber-300">
              Close But Can Improve ({partialMatches.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {partialMatches.map((match, idx) => {
              const actionId = `partial-${match.requirement}`;
              const isApplied = appliedActions.has(actionId);
              const isSkipped = skippedActions.has(actionId);
              
              if (isApplied) {
                return (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Applied: {match.requirement}
                    </span>
                  </div>
                );
              }
              
              if (isSkipped) {
                return null; // Hide skipped
              }
              
              return (
                <MatchCard
                  key={idx}
                  match={match}
                  resume={finalResume}
                  jobDescription={jobDescription}
                  onBulletUpdate={onBulletUpdate}
                  onSummaryUpdate={onSummaryUpdate}
                  onActionApplied={() => handleActionApplied(actionId)}
                  onActionSkipped={() => handleActionSkipped(actionId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Critical Gaps - Highest priority */}
      {criticalGaps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <h3 className="font-medium text-red-800 dark:text-red-300">
              Critical Gaps ({criticalGaps.length})
            </h3>
            <Badge variant="destructive" className="text-xs">Must Address</Badge>
          </div>
          
          <div className="space-y-3">
            {criticalGaps.map((gap, idx) => {
              const actionId = `gap-${gap.requirement}`;
              const isApplied = appliedActions.has(actionId);
              const isSkipped = skippedActions.has(actionId);
              
              if (isApplied) {
                return (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Added: {gap.requirement}
                    </span>
                  </div>
                );
              }
              
              if (isSkipped) {
                return (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg opacity-50">
                    <span className="text-xs text-muted-foreground">Skipped: {gap.requirement}</span>
                  </div>
                );
              }
              
              return (
                <GapCard
                  key={idx}
                  gap={gap}
                  resume={finalResume}
                  jobDescription={jobDescription}
                  onBulletAdd={onBulletAdd}
                  onSkillAdd={onSkillAdd}
                  onActionApplied={() => handleActionApplied(actionId)}
                  onActionSkipped={() => handleActionSkipped(actionId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Moderate Gaps */}
      {moderateGaps.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="font-medium text-amber-800 dark:text-amber-300">
              Should Address ({moderateGaps.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {moderateGaps.map((gap, idx) => {
              const actionId = `gap-${gap.requirement}`;
              const isApplied = appliedActions.has(actionId);
              const isSkipped = skippedActions.has(actionId);
              
              if (isApplied || isSkipped) {
                return isApplied ? (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                      Added: {gap.requirement}
                    </span>
                  </div>
                ) : null;
              }
              
              return (
                <GapCard
                  key={idx}
                  gap={gap}
                  resume={finalResume}
                  jobDescription={jobDescription}
                  onBulletAdd={onBulletAdd}
                  onSkillAdd={onSkillAdd}
                  onActionApplied={() => handleActionApplied(actionId)}
                  onActionSkipped={() => handleActionSkipped(actionId)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Minor Gaps (Collapsed) */}
      {minorGaps.length > 0 && (
        <details className="rounded-lg border border-muted">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-muted-foreground">
                Nice to Have ({minorGaps.length})
              </span>
            </div>
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {minorGaps.map((gap, idx) => {
              const actionId = `gap-${gap.requirement}`;
              const isApplied = appliedActions.has(actionId);
              
              if (isApplied) {
                return (
                  <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-400">Added: {gap.requirement}</span>
                  </div>
                );
              }
              
              return (
                <GapCard
                  key={idx}
                  gap={gap}
                  resume={finalResume}
                  jobDescription={jobDescription}
                  onBulletAdd={onBulletAdd}
                  onSkillAdd={onSkillAdd}
                  onActionApplied={() => handleActionApplied(actionId)}
                  onActionSkipped={() => handleActionSkipped(actionId)}
                />
              );
            })}
          </div>
        </details>
      )}

      {/* Missing Keywords Quick Add */}
      {fitAnalysis.keywords_missing.length > 0 && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-medium">Missing Keywords</h3>
            <span className="text-xs text-muted-foreground">
              (Click to add to skills)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {fitAnalysis.keywords_missing.slice(0, 10).map((keyword, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => onSkillAdd(keyword)}
                className="h-7 text-xs border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                + {keyword}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* All Done State */}
      {pendingPartialMatches === 0 && pendingGaps === 0 && (
        <div className="text-center py-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
          <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="font-medium text-green-800 dark:text-green-300">
            All actions addressed!
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            Your resume is optimized for this role.
          </p>
        </div>
      )}
    </div>
  );
}

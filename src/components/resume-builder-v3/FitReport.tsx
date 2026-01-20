/**
 * FitReport - Clean, Modern Fit Analysis
 * 
 * Minimal design inspired by resume.io and teal.hq:
 * - No colored boxes
 * - Clean typography with generous spacing
 * - Subtle borders and hover states
 * - Actions inline with each finding
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Sparkles,
  Plus,
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

type FitTier = "excellent" | "good" | "fair" | "needs_work";

function getFitTier(score: number): FitTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "needs_work";
}

const TIER_LABELS: Record<FitTier, string> = {
  excellent: "Excellent Match",
  good: "Good Match", 
  fair: "Fair Match",
  needs_work: "Needs Improvement",
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
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
  const [skippedActions, setSkippedActions] = useState<Set<string>>(new Set());

  const score = fitAnalysis.fit_score;
  const tier = getFitTier(score);

  // Separate strengths and gaps
  const strongMatches = fitAnalysis.strengths.filter(s => s.strength_level === "strong");
  const partialMatches = fitAnalysis.strengths.filter(s => s.strength_level === "moderate");
  const allGaps = fitAnalysis.gaps.filter(g => !skippedActions.has(`gap-${g.requirement}`));

  const handleActionApplied = useCallback((actionId: string) => {
    setAppliedActions(prev => new Set([...prev, actionId]));
  }, []);

  const handleActionSkipped = useCallback((actionId: string) => {
    setSkippedActions(prev => new Set([...prev, actionId]));
  }, []);

  // Count pending
  const pendingItems = partialMatches.filter(m => 
    !appliedActions.has(`partial-${m.requirement}`) && 
    !skippedActions.has(`partial-${m.requirement}`)
  ).length + allGaps.filter(g => !appliedActions.has(`gap-${g.requirement}`)).length;

  return (
    <div className="space-y-8">
      {/* Score Header - Clean and Prominent */}
      <div className="text-center space-y-4">
        <div className="inline-flex flex-col items-center">
          <div className="text-6xl font-light tracking-tight text-foreground">
            {score}
            <span className="text-3xl text-muted-foreground">%</span>
          </div>
          <div className="text-lg font-medium text-foreground mt-1">
            {TIER_LABELS[tier]}
          </div>
        </div>
        
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {fitAnalysis.executive_summary}
        </p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto">
          <Progress value={score} className="h-2" />
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-center gap-8 text-sm pt-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span><strong>{strongMatches.length}</strong> strong</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span><strong>{partialMatches.length}</strong> partial</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <span><strong>{allGaps.length}</strong> gaps</span>
          </div>
        </div>
      </div>

      {/* Strong Matches - Collapsible list */}
      {strongMatches.length > 0 && (
        <section className="space-y-3">
          <button
            onClick={() => setShowAllMatches(!showAllMatches)}
            className="w-full flex items-center justify-between group"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              What's Working
            </h3>
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showAllMatches && "rotate-90"
            )} />
          </button>
          
          {showAllMatches ? (
            <div className="space-y-2">
              {strongMatches.map((match, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                >
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{match.requirement}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{match.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {strongMatches.length} requirements fully met. 
              <button 
                onClick={() => setShowAllMatches(true)}
                className="text-primary hover:underline ml-1"
              >
                View all →
              </button>
            </p>
          )}
        </section>
      )}

      {/* Partial Matches - Actionable */}
      {partialMatches.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Can Be Stronger
          </h3>
          
          <div className="space-y-3">
            {partialMatches.map((match, idx) => {
              const actionId = `partial-${match.requirement}`;
              const isApplied = appliedActions.has(actionId);
              const isSkipped = skippedActions.has(actionId);
              
              if (isApplied) {
                return (
                  <div key={idx} className="flex items-center gap-3 py-3 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Improved: {match.requirement}</span>
                  </div>
                );
              }
              
              if (isSkipped) return null;
              
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
        </section>
      )}

      {/* Gaps - Actionable */}
      {allGaps.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Missing Requirements
          </h3>
          
          <div className="space-y-3">
            {allGaps.map((gap, idx) => {
              const actionId = `gap-${gap.requirement}`;
              const isApplied = appliedActions.has(actionId);
              
              if (isApplied) {
                return (
                  <div key={idx} className="flex items-center gap-3 py-3 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Added: {gap.requirement}</span>
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
        </section>
      )}

      {/* Missing Keywords - Simple inline buttons */}
      {fitAnalysis.keywords_missing.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Add Missing Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {fitAnalysis.keywords_missing.slice(0, 12).map((keyword, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => onSkillAdd(keyword)}
                className="h-8 text-sm font-normal hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                {keyword}
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Completion state */}
      {pendingItems === 0 && (
        <div className="text-center py-8 space-y-2">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-lg font-medium">All set!</p>
          <p className="text-sm text-muted-foreground">
            Your resume is optimized for this role.
          </p>
        </div>
      )}
    </div>
  );
}

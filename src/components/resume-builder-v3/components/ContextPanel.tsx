/**
 * ContextPanel - Dynamic sidebar showing gaps relevant to focused section
 * Updates based on which resume section is being edited
 */

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";
import { GapCard } from "./GapCard";
import { MatchCard } from "./MatchCard";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";
import type { FocusedSectionType } from "@/lib/gapSectionMatcher";
import {
  getGapsForSection,
  getPartialMatchesForSection,
  getKeywordsForSection,
  getSectionDisplayName,
} from "@/lib/gapSectionMatcher";

interface ContextPanelProps {
  focusedSection: FocusedSectionType;
  fitAnalysis: FitAnalysisResult;
  finalResume: OptimizedResume;
  jobDescription: string;
  onBulletUpdate: (experienceIndex: number, bulletIndex: number, newBullet: string) => void;
  onBulletAdd: (experienceIndex: number, newBullet: string) => void;
  onSkillAdd: (skill: string) => void;
  onSummaryUpdate: (newSummary: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type FitTier = "excellent" | "good" | "fair" | "needs_work";

function getFitTier(score: number): FitTier {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "needs_work";
}

const TIER_LABELS: Record<FitTier, string> = {
  excellent: "Excellent",
  good: "Good", 
  fair: "Fair",
  needs_work: "Needs Work",
};

export function ContextPanel({
  focusedSection,
  fitAnalysis,
  finalResume,
  jobDescription,
  onBulletUpdate,
  onBulletAdd,
  onSkillAdd,
  onSummaryUpdate,
  collapsed = false,
  onToggleCollapse,
}: ContextPanelProps) {
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
  const [skippedActions, setSkippedActions] = useState<Set<string>>(new Set());

  const score = fitAnalysis.fit_score;
  const tier = getFitTier(score);

  // Get section-specific content
  const sectionGaps = useMemo(() => 
    getGapsForSection(focusedSection, fitAnalysis, finalResume)
      .filter(g => !skippedActions.has(`gap-${g.requirement}`)),
    [focusedSection, fitAnalysis, finalResume, skippedActions]
  );

  const sectionPartials = useMemo(() =>
    getPartialMatchesForSection(focusedSection, fitAnalysis, finalResume)
      .filter(m => 
        !appliedActions.has(`partial-${m.requirement}`) && 
        !skippedActions.has(`partial-${m.requirement}`)
      ),
    [focusedSection, fitAnalysis, finalResume, appliedActions, skippedActions]
  );

  const sectionKeywords = useMemo(() =>
    getKeywordsForSection(focusedSection, fitAnalysis, finalResume),
    [focusedSection, fitAnalysis, finalResume]
  );

  const sectionName = getSectionDisplayName(focusedSection, finalResume);

  const handleActionApplied = (actionId: string) => {
    setAppliedActions(prev => new Set([...prev, actionId]));
  };

  const handleActionSkipped = (actionId: string) => {
    setSkippedActions(prev => new Set([...prev, actionId]));
  };

  const totalIssues = sectionGaps.length + sectionPartials.length;

  if (collapsed) {
    return (
      <div className="w-12 border-l border-border bg-background flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
          aria-label="Expand panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Collapsed stats */}
        <div className="flex flex-col items-center gap-3 text-xs">
          <div className="flex flex-col items-center">
            <span className="text-xl font-semibold text-foreground">{score}</span>
            <span className="text-muted-foreground">%</span>
          </div>
          
          {totalIssues > 0 && (
            <div className="flex flex-col items-center text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>{totalIssues}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Fit Analysis</span>
          </div>
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-8 w-8"
              aria-label="Collapse panel"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-light text-foreground">{score}</span>
          <span className="text-lg text-muted-foreground">%</span>
          <span className="text-sm text-muted-foreground ml-auto">{TIER_LABELS[tier]}</span>
        </div>
        <Progress value={score} className="h-1.5 mt-2" />
      </div>

      {/* Section Context */}
      <div className="px-4 py-3 bg-muted/30 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Showing issues for:</span>
        </div>
        <p className="text-sm font-medium text-foreground mt-1 truncate">
          {sectionName}
        </p>
        {totalIssues > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {totalIssues} actionable {totalIssues === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {/* Partial Matches */}
          {sectionPartials.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5" />
                Strengthen ({sectionPartials.length})
              </h4>
              <div className="space-y-2">
                {sectionPartials.map((match, idx) => {
                  const actionId = `partial-${match.requirement}`;
                  const isApplied = appliedActions.has(actionId);
                  
                  if (isApplied) {
                    return (
                      <div key={idx} className="flex items-center gap-2 py-2 text-primary text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Improved</span>
                      </div>
                    );
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
            </section>
          )}

          {/* Gaps */}
          {sectionGaps.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                <XCircle className="h-3.5 w-3.5" />
                Missing ({sectionGaps.length})
              </h4>
              <div className="space-y-2">
                {sectionGaps.map((gap, idx) => {
                  const actionId = `gap-${gap.requirement}`;
                  const isApplied = appliedActions.has(actionId);
                  
                  if (isApplied) {
                    return (
                      <div key={idx} className="flex items-center gap-2 py-2 text-primary text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Added</span>
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

          {/* Keywords */}
          {sectionKeywords.missing.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Add Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sectionKeywords.missing.slice(0, 8).map((keyword, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => onSkillAdd(keyword)}
                    className="h-7 text-xs font-normal hover:bg-primary hover:text-primary-foreground"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {keyword}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* Matched keywords - subtle display */}
          {sectionKeywords.matched.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Matched Keywords
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sectionKeywords.matched.slice(0, 6).map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
                {sectionKeywords.matched.length > 6 && (
                  <span className="text-xs text-muted-foreground">
                    +{sectionKeywords.matched.length - 6} more
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Empty state */}
          {totalIssues === 0 && sectionKeywords.missing.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Looking good!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No issues for this section
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

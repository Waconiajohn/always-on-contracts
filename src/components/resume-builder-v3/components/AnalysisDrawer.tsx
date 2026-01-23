/**
 * AnalysisDrawer - Full-featured slide-out drawer for fit analysis
 * Shows gaps, keywords with context popovers, and quick-add actions
 */

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Check,
  X,
  XCircle,
  Plus,
  Target,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KeywordContextPopover, KeywordWithContext } from "@/components/quick-score/KeywordContextPopover";
import { GapCard } from "./GapCard";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";

interface AnalysisDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

const TIER_CONFIG: Record<FitTier, { label: string; color: string }> = {
  excellent: { label: "Excellent", color: "text-green-600 dark:text-green-400" },
  good: { label: "Good", color: "text-primary" },
  fair: { label: "Fair", color: "text-amber-600 dark:text-amber-400" },
  needs_work: { label: "Needs Work", color: "text-destructive" },
};

export function AnalysisDrawer({
  open,
  onOpenChange,
  fitAnalysis,
  finalResume,
  jobDescription,
  onBulletAdd,
  onSkillAdd,
}: AnalysisDrawerProps) {
  const score = fitAnalysis.fit_score;
  const tier = getFitTier(score);
  const tierConfig = TIER_CONFIG[tier];

  // Get gaps and strengths from FitAnalysisResult
  const gaps = fitAnalysis.gaps || [];
  const strengths = fitAnalysis.strengths || [];

  // Build keyword data with context for popovers
  const matchedKeywords: KeywordWithContext[] = useMemo(() => {
    const matched = fitAnalysis.keywords_found || [];
    return matched.map((kw: string) => ({
      keyword: kw,
      priority: 'high' as const,
      resumeContext: finalResume.skills.some(s => s.toLowerCase().includes(kw.toLowerCase()))
        ? `Found in skills section` 
        : `Found in resume content`,
    }));
  }, [fitAnalysis.keywords_found, finalResume.skills]);

  const missingKeywords: KeywordWithContext[] = useMemo(() => {
    const missing = fitAnalysis.keywords_missing || [];
    return missing.map((kw: string) => ({
      keyword: kw,
      priority: 'high' as const,
      suggestedPhrasing: `Add "${kw}" to demonstrate this competency`,
    }));
  }, [fitAnalysis.keywords_missing]);

  const handleAddKeywordToResume = (keyword: KeywordWithContext) => {
    onSkillAdd(keyword.keyword);
  };

  const totalIssues = gaps.length + missingKeywords.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-lg p-0 flex flex-col"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <SheetTitle>Fit Analysis</SheetTitle>
            </div>
            <Badge variant="secondary" className={cn("font-semibold", tierConfig.color)}>
              {tierConfig.label}
            </Badge>
          </div>
          <SheetDescription className="sr-only">
            Resume fit analysis and improvement suggestions
          </SheetDescription>
          
          {/* Score display */}
          <div className="mt-4">
            <div className="flex items-baseline gap-2 mb-2">
              <span className={cn("text-4xl font-light", tierConfig.color)}>{score}</span>
              <span className="text-lg text-muted-foreground">%</span>
              <span className="text-sm text-muted-foreground ml-auto">
                {totalIssues} items to address
              </span>
            </div>
            <Progress value={score} className="h-2" />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            
            {/* Missing Keywords - With Popovers + Quick Add */}
            {missingKeywords.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                    <X className="h-4 w-4 text-destructive" />
                    Missing Keywords ({missingKeywords.length})
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click for context • Click + to add to skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map((kw, idx) => (
                    <KeywordContextPopover
                      key={idx}
                      keyword={kw}
                      isMatched={false}
                      onAddToResume={handleAddKeywordToResume}
                    >
                      <div className="flex items-center group cursor-pointer">
                        <Badge
                          variant="outline"
                          className="pr-1 rounded-r-none border-r-0 transition-colors hover:bg-accent"
                        >
                          <X className="h-3 w-3 mr-1.5 opacity-60" />
                          {kw.keyword}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-[22px] w-6 rounded-l-none border-l-0 hover:bg-primary hover:text-primary-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSkillAdd(kw.keyword);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </KeywordContextPopover>
                  ))}
                </div>
              </section>
            )}

            {/* Matched Keywords */}
            {matchedKeywords.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Matched Keywords ({matchedKeywords.length})
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {matchedKeywords.map((kw, idx) => (
                    <KeywordContextPopover
                      key={idx}
                      keyword={kw}
                      isMatched={true}
                    >
                      <Badge
                        variant="outline"
                        className="bg-primary/5 border-primary/20 text-primary cursor-pointer hover:bg-primary/10"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {kw.keyword}
                      </Badge>
                    </KeywordContextPopover>
                  ))}
                </div>
              </section>
            )}

            {/* Gaps - Areas to Address */}
            {gaps.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  Gaps to Address ({gaps.length})
                </h3>
                <div className="space-y-3">
                  {gaps.map((gap, idx) => (
                    <GapCard
                      key={idx}
                      gap={gap}
                      resume={finalResume}
                      jobDescription={jobDescription}
                      onBulletAdd={onBulletAdd}
                      onSkillAdd={onSkillAdd}
                      onActionApplied={() => {}}
                      onActionSkipped={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  What's Working ({strengths.length})
                </h3>
                <ul className="space-y-2">
                  {strengths.slice(0, 5).map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-foreground font-medium">{strength.requirement}</span>
                        <p className="text-muted-foreground text-xs mt-0.5">{strength.evidence}</p>
                      </div>
                    </li>
                  ))}
                  {strengths.length > 5 && (
                    <li className="text-xs text-muted-foreground pl-6">
                      +{strengths.length - 5} more strengths
                    </li>
                  )}
                </ul>
              </section>
            )}

            {/* Empty state */}
            {totalIssues === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-foreground">Looking great!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your resume is well-aligned with this role
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

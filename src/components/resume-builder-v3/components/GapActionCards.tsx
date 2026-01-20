/**
 * GapActionCards - Actionable gap cards with severity indicators
 * Adapted from V2's GapChecklist with collapsible cards and one-click actions
 */

import { useState } from "react";
import { 
  AlertCircle, 
  Zap, 
  BookOpen, 
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Plus,
  Wand2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { FitAnalysisResult } from "@/types/resume-builder-v3";

interface GapActionCardsProps {
  fitAnalysis: FitAnalysisResult | null;
  onSkillAdd?: (skill: string) => void;
  onBulletStrengthen?: (requirement: string) => void;
  className?: string;
}

export function GapActionCards({ 
  fitAnalysis, 
  onSkillAdd,
  onBulletStrengthen,
  className 
}: GapActionCardsProps) {
  const [expandedGapId, setExpandedGapId] = useState<string | null>(null);
  const [completedGaps, setCompletedGaps] = useState<Set<string>>(new Set());

  if (!fitAnalysis?.gaps || fitAnalysis.gaps.length === 0) {
    return (
      <div className={cn("p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800", className)}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            No gaps identified — your resume is well-aligned!
          </p>
        </div>
      </div>
    );
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case "critical":
        return {
          icon: AlertCircle,
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-800",
          iconColor: "text-red-600 dark:text-red-400",
          badgeVariant: "destructive" as const,
        };
      case "moderate":
        return {
          icon: Zap,
          bg: "bg-amber-50 dark:bg-amber-900/20",
          border: "border-amber-200 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
          badgeVariant: "default" as const,
        };
      default:
        return {
          icon: BookOpen,
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-800",
          iconColor: "text-blue-600 dark:text-blue-400",
          badgeVariant: "secondary" as const,
        };
    }
  };

  const toggleCompleted = (gapId: string) => {
    const newSet = new Set(completedGaps);
    if (newSet.has(gapId)) {
      newSet.delete(gapId);
    } else {
      newSet.add(gapId);
    }
    setCompletedGaps(newSet);
  };

  const handleAction = (gap: FitAnalysisResult['gaps'][0]) => {
    // Determine action based on gap type
    if (gap.requirement.toLowerCase().includes('skill') || gap.requirement.toLowerCase().includes('keyword')) {
      // Extract skill name from suggestion and add it
      const skillMatch = gap.suggestion.match(/add\s+["']?([^"']+)["']?/i);
      if (skillMatch && onSkillAdd) {
        onSkillAdd(skillMatch[1]);
      }
    } else if (onBulletStrengthen) {
      onBulletStrengthen(gap.requirement);
    }
    toggleCompleted(`gap-${gap.requirement}`);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Areas to Improve ({fitAnalysis.gaps.length})
        </h4>
      </div>
      
      {fitAnalysis.gaps.map((gap, index) => {
        const gapId = `gap-${index}-${gap.requirement}`;
        const config = getSeverityConfig(gap.severity);
        const Icon = config.icon;
        const isExpanded = expandedGapId === gapId;
        const isCompleted = completedGaps.has(gapId);

        return (
          <div
            key={gapId}
            className={cn(
              "rounded-lg border p-3 transition-all cursor-pointer",
              config.bg,
              config.border,
              isCompleted && "opacity-50"
            )}
            onClick={() => setExpandedGapId(isExpanded ? null : gapId)}
          >
            <div className="flex items-start gap-2">
              <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", config.iconColor)} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium text-foreground line-clamp-1">
                    {gap.requirement}
                  </p>
                  <Badge variant={config.badgeVariant} className="text-[10px] px-1.5 py-0 h-4">
                    {gap.severity}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompleted(gapId);
                    }}
                    className="ml-auto"
                  >
                    <CheckCircle2
                      className={cn(
                        "h-4 w-4",
                        isCompleted ? "text-green-600" : "text-muted-foreground/40"
                      )}
                    />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                {isExpanded && (
                  <div className="mt-3 space-y-3">
                    <div className="p-2 rounded bg-background/50 border">
                      <p className="text-[10px] font-medium text-muted-foreground mb-1">
                        Suggested Fix:
                      </p>
                      <p className="text-xs text-foreground">{gap.suggestion}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(gap);
                        }}
                      >
                        {gap.severity === 'minor' ? (
                          <>
                            <Plus className="h-3 w-3" />
                            Add
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3" />
                            Fix with AI
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCompleted(gapId);
                        }}
                      >
                        {isCompleted ? (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            Undo
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Mark Done
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

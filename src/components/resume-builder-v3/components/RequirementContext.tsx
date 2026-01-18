/**
 * RequirementContext - Shows which job requirement a bullet is addressing
 * Displayed above AI action buttons in BulletEditor
 */

import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  CheckCircle2, 
  AlertTriangle, 
  Lightbulb,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequirementMatch } from "../utils/requirementMatcher";

interface RequirementContextProps {
  matchedRequirement: RequirementMatch | null;
  relevantKeywords: {
    matched: string[];
    missing: string[];
  };
  alignmentScore: number;
  onAddKeyword?: (keyword: string) => void;
}

export function RequirementContext({
  matchedRequirement,
  relevantKeywords,
  alignmentScore,
  onAddKeyword,
}: RequirementContextProps) {
  // Determine status
  const getStatusConfig = () => {
    if (!matchedRequirement) {
      return {
        icon: Target,
        color: "text-muted-foreground",
        bg: "bg-muted/50",
        border: "border-muted",
        label: "General bullet",
        description: "No specific requirement matched",
      };
    }

    if (matchedRequirement.type === "strength") {
      return {
        icon: CheckCircle2,
        color: "text-green-600 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        label: matchedRequirement.strengthLevel === "strong" ? "Strong match" : "Good match",
        description: "This bullet addresses a key requirement",
      };
    }

    // It's a gap
    const severityConfig = {
      critical: {
        icon: AlertTriangle,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        label: "Needs improvement",
      },
      moderate: {
        icon: AlertTriangle,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        border: "border-amber-200 dark:border-amber-800",
        label: "Could be stronger",
      },
      minor: {
        icon: Lightbulb,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        label: "Minor opportunity",
      },
    };

    return {
      ...severityConfig[matchedRequirement.severity || "minor"],
      description: "This bullet could better address this requirement",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn("rounded-lg p-2.5 border text-xs space-y-2", config.bg, config.border)}>
      {/* Header with requirement */}
      <div className="flex items-start gap-2">
        <Icon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("font-medium", config.color)}>{config.label}</span>
            {matchedRequirement && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0 h-4 font-normal"
              >
                {alignmentScore}% aligned
              </Badge>
            )}
          </div>
          {matchedRequirement && (
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              <span className="font-medium">Addressing: </span>
              {matchedRequirement.requirement}
            </p>
          )}
        </div>
      </div>

      {/* Suggestion for gaps */}
      {matchedRequirement?.type === "gap" && matchedRequirement.suggestion && (
        <div className="flex items-start gap-1.5 pl-5">
          <Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
          <span className="text-muted-foreground italic">
            {matchedRequirement.suggestion}
          </span>
        </div>
      )}

      {/* Keywords section */}
      {(relevantKeywords.matched.length > 0 || relevantKeywords.missing.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5 pl-5">
          {relevantKeywords.matched.map((kw) => (
            <Badge
              key={kw}
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              ✓ {kw}
            </Badge>
          ))}
          {relevantKeywords.missing.slice(0, 3).map((kw) => (
            <button
              key={kw}
              onClick={() => onAddKeyword?.(kw)}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 h-4 rounded border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              title={`Consider adding "${kw}" to this bullet`}
            >
              <Plus className="h-2.5 w-2.5" />
              {kw}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

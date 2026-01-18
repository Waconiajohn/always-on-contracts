/**
 * PriorityFixesPanel - Display actionable gap fixes with one-click actions
 * Shows prioritized issues with suggestions and "Fix This" buttons
 */

import { useState } from "react";
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  Wand2,
  Loader2,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export interface PriorityFix {
  issue: string;
  recommendation: string;
  severity: "critical" | "high" | "medium" | "low";
  category?: string;
  fixType?: "add_skill" | "add_bullet" | "improve_section" | "other";
  targetSection?: string;
}

interface PriorityFixesPanelProps {
  fixes: PriorityFix[];
  onFixClick?: (fix: PriorityFix) => void;
  isApplyingFix?: boolean;
}

const SEVERITY_CONFIG = {
  critical: {
    label: "Critical",
    bgClass: "bg-red-100 dark:bg-red-950/50",
    borderClass: "border-red-300 dark:border-red-800",
    textClass: "text-red-700 dark:text-red-300",
    badgeClass: "bg-red-500",
  },
  high: {
    label: "High",
    bgClass: "bg-orange-100 dark:bg-orange-950/50",
    borderClass: "border-orange-300 dark:border-orange-800",
    textClass: "text-orange-700 dark:text-orange-300",
    badgeClass: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    bgClass: "bg-amber-100 dark:bg-amber-950/50",
    borderClass: "border-amber-300 dark:border-amber-800",
    textClass: "text-amber-700 dark:text-amber-300",
    badgeClass: "bg-amber-500",
  },
  low: {
    label: "Low",
    bgClass: "bg-blue-100 dark:bg-blue-950/50",
    borderClass: "border-blue-300 dark:border-blue-800",
    textClass: "text-blue-700 dark:text-blue-300",
    badgeClass: "bg-blue-500",
  },
};

export function PriorityFixesPanel({
  fixes,
  onFixClick,
  isApplyingFix = false,
}: PriorityFixesPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [addressedFixes, setAddressedFixes] = useState<Set<number>>(new Set());
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  if (!fixes || fixes.length === 0) {
    return null;
  }

  // Sort by severity
  const sortedFixes = [...fixes].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  const unaddressedCount = fixes.length - addressedFixes.size;

  const handleFixClick = async (fix: PriorityFix, index: number) => {
    if (onFixClick) {
      setApplyingIndex(index);
      try {
        await onFixClick(fix);
        setAddressedFixes(prev => new Set([...prev, index]));
      } finally {
        setApplyingIndex(null);
      }
    }
  };

  const handleMarkAddressed = (index: number) => {
    setAddressedFixes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Priority Fixes
          </span>
          {unaddressedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unaddressedCount} remaining
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sortedFixes.map((fix, index) => {
          const config = SEVERITY_CONFIG[fix.severity];
          const isExpanded = expandedIndex === index;
          const isAddressed = addressedFixes.has(index);
          const isApplying = applyingIndex === index;

          return (
            <Collapsible
              key={index}
              open={isExpanded}
              onOpenChange={() => setExpandedIndex(isExpanded ? null : index)}
            >
              <div
                className={cn(
                  "rounded-lg border transition-all",
                  isAddressed
                    ? "bg-muted/30 border-muted opacity-60"
                    : cn(config.bgClass, config.borderClass)
                )}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-2.5 px-3 hover:bg-transparent"
                  >
                    <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                      {isAddressed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className={cn("h-4 w-4 shrink-0", config.textClass)} />
                      )}
                      <span
                        className={cn(
                          "text-xs font-medium truncate",
                          isAddressed ? "line-through text-muted-foreground" : ""
                        )}
                      >
                        {fix.issue}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4",
                          !isAddressed && config.badgeClass,
                          !isAddressed && "text-white"
                        )}
                      >
                        {config.label}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">Recommendation: </span>
                      {fix.recommendation}
                    </p>
                    
                    {fix.category && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Section:</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {fix.category}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 pt-1">
                      {onFixClick && fix.fixType && fix.fixType !== "other" && !isAddressed && (
                        <Button
                          size="sm"
                          onClick={() => handleFixClick(fix, index)}
                          disabled={isApplyingFix || isApplying}
                          className="h-7 text-xs gap-1.5"
                        >
                          {isApplying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          Fix This
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAddressed(index)}
                        className="h-7 text-xs gap-1.5"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {isAddressed ? "Mark Pending" : "Mark Done"}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
        
        {addressedFixes.size > 0 && addressedFixes.size === fixes.length && (
          <div className="text-center py-2">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ All priority fixes addressed!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

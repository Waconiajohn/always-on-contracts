/**
 * PriorityFixesPanel - Clean actionable gap fixes
 * Simple list with collapsible details
 */

import { useState } from "react";
import { 
  AlertCircle, 
  ChevronRight, 
  CheckCircle2,
  Wand2,
  Loader2,
  Sparkles
} from "lucide-react";
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

const SEVERITY_LABELS = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Priority Fixes
        </div>
        {unaddressedCount > 0 && (
          <Badge variant="secondary" className="text-xs font-normal">
            {unaddressedCount} remaining
          </Badge>
        )}
      </div>
      
      <div className="space-y-1.5">
        {sortedFixes.map((fix, index) => {
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
                  "rounded-lg border border-border transition-all",
                  isAddressed && "opacity-50"
                )}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-auto py-2 px-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-left flex-1 min-w-0">
                      {isAddressed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={cn(
                          "text-xs truncate",
                          isAddressed && "line-through text-muted-foreground"
                        )}
                      >
                        {fix.issue}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant={fix.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-[10px] px-1.5 py-0 h-4 font-normal"
                      >
                        {SEVERITY_LABELS[fix.severity]}
                      </Badge>
                      <ChevronRight className={cn(
                        "h-3.5 w-3.5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90"
                      )} />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      {fix.recommendation}
                    </p>
                    
                    {fix.category && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Section:</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
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
                          className="h-6 text-xs gap-1 px-2"
                        >
                          {isApplying ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                          Fix
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAddressed(index)}
                        className="h-6 text-xs gap-1 px-2"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {isAddressed ? "Undo" : "Done"}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
        
        {addressedFixes.size > 0 && addressedFixes.size === fixes.length && (
          <p className="text-xs text-center text-primary font-medium py-2">
            ✓ All fixes addressed
          </p>
        )}
      </div>
    </div>
  );
}

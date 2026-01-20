/**
 * ScoreCategoryBreakdown - Displays categorical score breakdown with progress bars
 * Adapted from V2's MatchScoreDisplay pattern
 */

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScoreCategory {
  label: string;
  score: number;
  description?: string;
}

interface ScoreCategoryBreakdownProps {
  categories: ScoreCategory[];
  className?: string;
}

export function ScoreCategoryBreakdown({ categories, className }: ScoreCategoryBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {categories.map((category) => (
        <div key={category.label} className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground">
              {category.label}
            </span>
            <span className={cn("text-xs font-semibold", getScoreTextColor(category.score))}>
              {category.score}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={category.score} 
              className="h-2"
            />
            <div 
              className={cn(
                "absolute top-0 left-0 h-2 rounded-full transition-all",
                getScoreColor(category.score)
              )}
              style={{ width: `${category.score}%` }}
            />
          </div>
          {category.description && (
            <p className="text-[10px] text-muted-foreground">{category.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

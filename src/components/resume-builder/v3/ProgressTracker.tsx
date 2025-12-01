import { cn } from "@/lib/utils";
import { TrendingUp, Target, Flame } from "lucide-react";

interface ProgressTrackerProps {
  initialScore: number;
  currentScore: number;
  targetScore: number;
}

export const ProgressTracker = ({
  initialScore,
  currentScore,
  targetScore
}: ProgressTrackerProps) => {
  const improvement = currentScore - initialScore;
  const isMustInterview = currentScore >= targetScore;
  const percentToTarget = Math.min(100, Math.round((currentScore / targetScore) * 100));

  // Determine temperature label
  const getTemperature = (score: number) => {
    if (score >= 80) return { label: 'HOT', color: 'text-red-500', bg: 'bg-red-500' };
    if (score >= 70) return { label: 'WARM', color: 'text-orange-500', bg: 'bg-orange-500' };
    if (score >= 60) return { label: 'LUKEWARM', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    return { label: 'COLD', color: 'text-blue-500', bg: 'bg-blue-500' };
  };

  const temp = getTemperature(currentScore);

  return (
    <div className="flex items-center gap-4 bg-muted/50 rounded-lg px-4 py-2">
      {/* Score Display */}
      <div className="flex items-center gap-2">
        {isMustInterview ? (
          <Flame className="h-5 w-5 text-red-500 animate-pulse" />
        ) : (
          <Target className="h-5 w-5 text-primary" />
        )}
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className={cn("text-2xl font-bold", temp.color)}>
              {currentScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <span className={cn("text-xs font-medium", temp.color)}>
            {temp.label}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-border" />

      {/* Progress Bar */}
      <div className="flex-1 min-w-[120px]">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress to Must-Interview</span>
          <span>{percentToTarget}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isMustInterview ? "bg-gradient-to-r from-orange-500 to-red-500" : temp.bg
            )}
            style={{ width: `${percentToTarget}%` }}
          />
        </div>
      </div>

      {/* Improvement Badge */}
      {improvement > 0 && (
        <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-md">
          <TrendingUp className="h-3 w-3" />
          <span className="text-xs font-medium">+{improvement}</span>
        </div>
      )}
    </div>
  );
};

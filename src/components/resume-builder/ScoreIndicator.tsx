import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScoreIndicatorProps {
  currentScore: number | null;
  previousScore?: number | null;
  isUpdating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
}

export function ScoreIndicator({
  currentScore,
  previousScore,
  isUpdating = false,
  size = 'md',
  showTrend = true,
}: ScoreIndicatorProps) {
  const [displayScore, setDisplayScore] = useState(currentScore);
  const [isAnimating, setIsAnimating] = useState(false);

  // Animate score changes
  useEffect(() => {
    if (currentScore !== displayScore && currentScore !== null) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayScore(currentScore);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [currentScore, displayScore]);

  const score = displayScore ?? 0;
  const prevScore = previousScore ?? score;
  const trend = score - prevScore;

  const getScoreColor = () => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-amber-500';
    return 'text-destructive';
  };

  const getBadgeVariant = () => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-primary" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getTrendText = () => {
    if (trend > 0) return `+${trend}`;
    if (trend < 0) return `${trend}`;
    return '±0';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'font-semibold tabular-nums transition-all duration-200',
                sizeClasses[size],
                getScoreColor(),
                isAnimating && 'scale-110',
                isUpdating && 'opacity-50'
              )}
            >
              {score}
            </div>
            <Badge variant={getBadgeVariant()} className="text-xs">
              Match
            </Badge>
            {showTrend && previousScore !== undefined && previousScore !== currentScore && (
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon()}
                <span className={cn(
                  trend > 0 && 'text-primary',
                  trend < 0 && 'text-destructive',
                  trend === 0 && 'text-muted-foreground'
                )}>
                  {getTrendText()}
                </span>
              </div>
            )}
            {isUpdating && (
              <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <div className="space-y-1">
            <p className="font-medium">Match Score: {score}%</p>
            {previousScore !== undefined && previousScore !== currentScore && (
              <p className="text-muted-foreground">
                Changed from {prevScore}% ({trend > 0 ? '+' : ''}{trend} points)
              </p>
            )}
            <p className="text-muted-foreground">
              Based on keyword coverage, requirements, and formatting
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

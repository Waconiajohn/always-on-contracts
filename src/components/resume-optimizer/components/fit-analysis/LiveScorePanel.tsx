import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target, 
  Award, 
  Shield, 
  FileSearch,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ScoreTrend {
  fitTrend: 'up' | 'down' | 'stable';
  benchmarkTrend: 'up' | 'down' | 'stable';
  credibilityTrend: 'up' | 'down' | 'stable';
  atsTrend: 'up' | 'down' | 'stable';
}

interface ScoreDetails {
  requirementsCovered: number;
  totalRequirements: number;
  gapsAddressed: number;
  totalGaps: number;
  keywordsCovered: number;
  totalKeywords: number;
  factsConfirmed: number;
  factsNeeded: number;
}

interface LiveScorePanelProps {
  fitScore: number;
  benchmarkScore: number;
  credibilityScore: number;
  atsScore: number;
  overallHireability: number;
  trends: ScoreTrend;
  details: ScoreDetails;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up') {
    return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  }
  if (trend === 'down') {
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  }
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const ScoreRing = ({ 
  score, 
  label, 
  icon: Icon, 
  trend, 
  color,
  detail 
}: { 
  score: number; 
  label: string; 
  icon: React.ElementType;
  trend: 'up' | 'down' | 'stable';
  color: string;
  detail: string;
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-emerald-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1 cursor-help">
            <div className={cn(
              "relative w-14 h-14 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-background to-muted border-2",
              color
            )}>
              <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center">
                <span className={cn("text-lg font-bold", getScoreColor(score))}>
                  {score}
                </span>
              </div>
              <div className="absolute -top-1 -right-1">
                <TrendIcon trend={trend} />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="font-medium">{label} Score: {score}/100</p>
          <p className="text-xs text-muted-foreground mt-1">{detail}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const LiveScorePanel: React.FC<LiveScorePanelProps> = ({
  fitScore,
  benchmarkScore,
  credibilityScore,
  atsScore,
  overallHireability,
  trends,
  details,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const getHireabilityLabel = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'bg-emerald-500' };
    if (score >= 70) return { label: 'Strong', color: 'bg-blue-500' };
    if (score >= 55) return { label: 'Moderate', color: 'bg-amber-500' };
    return { label: 'Needs Work', color: 'bg-red-500' };
  };

  const hireability = getHireabilityLabel(overallHireability);

  return (
    <Card className="border-2 border-primary/20 shadow-lg bg-gradient-to-br from-background via-background to-primary/5">
      <CardContent className="p-4">
        {/* Header with overall score */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <motion.div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-primary/30"
                )}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-2xl font-bold text-primary">
                  {overallHireability}
                </span>
              </motion.div>
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Hireability Score</h3>
              <Badge className={cn("mt-1", hireability.color)}>
                {hireability.label}
              </Badge>
            </div>
          </div>
          
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Score breakdown */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <ScoreRing
                  score={fitScore}
                  label="Fit"
                  icon={Target}
                  trend={trends.fitTrend}
                  color="border-blue-300"
                  detail={`${details.requirementsCovered}/${details.totalRequirements} requirements covered`}
                />
                <ScoreRing
                  score={benchmarkScore}
                  label="Benchmark"
                  icon={Award}
                  trend={trends.benchmarkTrend}
                  color="border-purple-300"
                  detail="Alignment with ideal candidate profile"
                />
                <ScoreRing
                  score={credibilityScore}
                  label="Credibility"
                  icon={Shield}
                  trend={trends.credibilityTrend}
                  color="border-emerald-300"
                  detail={`${details.factsConfirmed}/${details.factsNeeded} facts confirmed`}
                />
                <ScoreRing
                  score={atsScore}
                  label="ATS"
                  icon={FileSearch}
                  trend={trends.atsTrend}
                  color="border-amber-300"
                  detail={`${details.keywordsCovered}/${details.totalKeywords} keywords matched`}
                />
              </div>

              {/* Progress indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Gaps Addressed</span>
                  <span className="font-medium">
                    {details.gapsAddressed}/{details.totalGaps}
                  </span>
                </div>
                <Progress 
                  value={details.totalGaps > 0 
                    ? (details.gapsAddressed / details.totalGaps) * 100 
                    : 100
                  } 
                  className="h-2"
                />
              </div>

              {/* Quick tips */}
              {(fitScore < 70 || credibilityScore < 60) && (
                <div className="mt-3 p-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {fitScore < 70 
                      ? "💡 Add more bullets from gap strategies to boost fit score"
                      : "💡 Confirm facts to strengthen credibility"
                    }
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

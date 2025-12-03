/**
 * LiveScoreHeader - Always-visible header with live score and breakdown
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThermometerScore } from '@/components/quick-score/ThermometerScore';
import { 
  TrendingUp, 
  Target, 
  Cpu, 
  Users,
  Briefcase,
  Building2
} from 'lucide-react';
import type { ScoreBreakdown, DetectedInfo } from '../types';

interface LiveScoreHeaderProps {
  currentScore: number;
  previousScore?: number;
  scores: ScoreBreakdown;
  detected: DetectedInfo;
  step: string;
  stepLabel: string;
}

// Calculate tier from score
function calculateTier(score: number) {
  if (score >= 90) return { tier: 'ON_FIRE' as const, emoji: '🚀', color: 'red', message: 'Benchmark Achieved!' };
  if (score >= 75) return { tier: 'HOT' as const, emoji: '🔥', color: 'orange', message: 'Almost there!' };
  if (score >= 60) return { tier: 'WARM' as const, emoji: '🌡️', color: 'amber', message: 'Good progress' };
  if (score >= 40) return { tier: 'LUKEWARM' as const, emoji: '😐', color: 'yellow', message: 'Needs work' };
  if (score >= 20) return { tier: 'COLD' as const, emoji: '❄️', color: 'blue', message: 'Major changes needed' };
  return { tier: 'FREEZING' as const, emoji: '🥶', color: 'blue', message: 'Critical gaps' };
}

function getNextTierThreshold(score: number): number {
  if (score >= 90) return 100;
  if (score >= 75) return 90;
  if (score >= 60) return 75;
  if (score >= 40) return 60;
  if (score >= 20) return 40;
  return 20;
}

export function LiveScoreHeader({
  currentScore,
  previousScore,
  scores,
  detected,
  step,
  stepLabel
}: LiveScoreHeaderProps) {
  const tier = calculateTier(currentScore);
  const nextTierThreshold = getNextTierThreshold(currentScore);
  const pointsToNextTier = nextTierThreshold - currentScore;
  
  const scoreImprovement = previousScore !== undefined ? currentScore - previousScore : 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Role & Industry */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-sm">{detected.role}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{detected.industry}</span>
                  <span>•</span>
                  <span>{detected.level}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live Score */}
          <div className="flex items-center gap-6">
            <ThermometerScore
              score={currentScore}
              previousScore={previousScore}
              tier={tier}
              pointsToNextTier={pointsToNextTier}
              nextTierThreshold={nextTierThreshold}
              animate={true}
              size="sm"
              showImprovement={scoreImprovement !== 0}
            />

            {/* Score Change Indicator */}
            <AnimatePresence>
              {scoreImprovement !== 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`flex items-center gap-1 text-sm font-medium ${
                    scoreImprovement > 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  <TrendingUp className={`h-4 w-4 ${scoreImprovement < 0 ? 'rotate-180' : ''}`} />
                  <span>{scoreImprovement > 0 ? '+' : ''}{scoreImprovement}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Score Breakdown */}
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">ATS</p>
                    <p className="text-sm font-semibold">{scores.ats}%</p>
                  </div>
                  <Progress value={scores.ats} className="w-12 h-1.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">ATS Compatibility Score</p>
                <p className="text-xs text-muted-foreground">How well your resume parses through ATS systems</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Target className="h-4 w-4 text-amber-500" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Match</p>
                    <p className="text-sm font-semibold">{scores.requirements}%</p>
                  </div>
                  <Progress value={scores.requirements} className="w-12 h-1.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Requirements Match</p>
                <p className="text-xs text-muted-foreground">How well you match the job requirements</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Users className="h-4 w-4 text-green-500" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Compete</p>
                    <p className="text-sm font-semibold">{scores.competitive}%</p>
                  </div>
                  <Progress value={scores.competitive} className="w-12 h-1.5" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">Competitive Score</p>
                <p className="text-xs text-muted-foreground">How you stack up against other candidates</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Current Step Indicator */}
        <div className="flex justify-center mt-2">
          <Badge variant="outline" className="text-xs">
            {stepLabel}
          </Badge>
        </div>
      </div>
    </header>
  );
}

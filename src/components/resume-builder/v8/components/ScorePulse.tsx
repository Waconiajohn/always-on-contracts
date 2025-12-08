/**
 * ScorePulse - Animated real-time score indicator
 */

import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoreBreakdown } from '../types';

interface ScorePulseProps {
  score: number;
  previousScore?: number;
  breakdown?: ScoreBreakdown;
}

export function ScorePulse({ score, previousScore, breakdown }: ScorePulseProps) {
  const delta = previousScore !== undefined ? score - previousScore : 0;
  const isImproving = delta > 0;
  const isDecreasing = delta < 0;

  // Color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center gap-4">
      {/* Main Score */}
      <div className="flex items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.span
            key={score}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={cn("text-3xl font-bold", getScoreColor(score))}
          >
            {score}
          </motion.span>
        </AnimatePresence>
        <span className="text-muted-foreground text-sm">/100</span>
      </div>

      {/* Delta Indicator */}
      {delta !== 0 && (
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            isImproving && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            isDecreasing && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {isImproving ? (
            <>
              <TrendingUp className="h-3 w-3" />
              <span>+{delta}</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-3 w-3" />
              <span>{delta}</span>
            </>
          )}
        </motion.div>
      )}

      {/* Mini Breakdown */}
      {breakdown && (
        <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>JD: {breakdown.jdMatch.score}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>ATS: {breakdown.atsCompliance.score}</span>
          </div>
        </div>
      )}
    </div>
  );
}

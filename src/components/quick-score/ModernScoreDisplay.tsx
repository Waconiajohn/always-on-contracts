/**
 * ModernScoreDisplay - Clean, typography-focused score display
 * Inspired by resume.io and teal.hq design patterns
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

interface ModernScoreDisplayProps {
  score: number;
  previousScore?: number;
  tier: ScoreTier;
  pointsToNextTier: number;
  animate?: boolean;
}

const TIER_LABELS: Record<string, string> = {
  FREEZING: 'Needs Work',
  COLD: 'Getting Started',
  LUKEWARM: 'Competitive',
  WARM: 'Strong Candidate',
  HOT: 'Highly Qualified',
  ON_FIRE: 'Must-Interview'
};

export function ModernScoreDisplay({
  score,
  previousScore,
  tier,
  pointsToNextTier,
  animate = true,
}: ModernScoreDisplayProps) {
  const [displayedScore, setDisplayedScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayedScore(score);
      return;
    }

    const duration = 1200;
    const startTime = Date.now();
    const startValue = previousScore ?? 0;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startValue + (score - startValue) * eased);
      setDisplayedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, previousScore, animate]);

  const improvement = previousScore !== undefined ? score - previousScore : 0;

  return (
    <div className="text-center space-y-4 max-w-md mx-auto">
      {/* Main Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex flex-col items-center"
      >
        <div className="text-7xl font-light tracking-tight text-foreground tabular-nums">
          {displayedScore}
          <span className="text-3xl text-muted-foreground font-normal">/100</span>
        </div>
        <div className="text-lg font-medium text-foreground mt-2">
          {TIER_LABELS[tier.tier] || tier.tier.replace('_', ' ')}
        </div>
      </motion.div>

      {/* Tier Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-muted-foreground leading-relaxed"
      >
        {tier.message}
      </motion.p>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <Progress value={displayedScore} className="h-2" />
      </motion.div>

      {/* Points to next tier */}
      {pointsToNextTier > 0 && score < 100 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground">+{pointsToNextTier} points</span>
          {' '}to reach the next tier
        </motion.p>
      )}

      {/* Improvement indicator */}
      {improvement !== 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, delay: 0.6 }}
          className={cn(
            'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
            improvement > 0 
              ? 'bg-primary/10 text-primary' 
              : 'bg-destructive/10 text-destructive'
          )}
        >
          {improvement > 0 ? '+' : ''}{improvement} points
        </motion.div>
      )}
    </div>
  );
}

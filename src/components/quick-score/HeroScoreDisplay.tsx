/**
 * HeroScoreDisplay - Large, visually stunning score display
 * Typography-first design with horizontal tier position bar
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TierInfo {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

interface HeroScoreDisplayProps {
  score: number;
  tier: TierInfo;
  pointsToNextTier: number;
  animate?: boolean;
}

const TIER_LABELS: Record<string, string> = {
  FREEZING: 'Needs Work',
  COLD: 'Getting Started',
  LUKEWARM: 'Competitive',
  WARM: 'Strong Candidate',
  HOT: 'Excellent Match',
  ON_FIRE: 'Must-Interview'
};

const TIER_POSITIONS: Record<string, number> = {
  FREEZING: 10,
  COLD: 25,
  LUKEWARM: 45,
  WARM: 65,
  HOT: 82,
  ON_FIRE: 95
};

export function HeroScoreDisplay({
  score,
  tier,
  pointsToNextTier,
  animate = true,
}: HeroScoreDisplayProps) {
  const [displayedScore, setDisplayedScore] = useState(animate ? 0 : score);

  useEffect(() => {
    if (!animate) {
      setDisplayedScore(score);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentScore = Math.round(score * eased);
      setDisplayedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, animate]);

  const tierPosition = TIER_POSITIONS[tier.tier] || 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-8"
    >
      {/* Main Score */}
      <div className="space-y-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative inline-block"
        >
          <span className="text-8xl md:text-9xl font-extralight tracking-tighter text-foreground tabular-nums">
            {displayedScore}
          </span>
          <span className="text-3xl md:text-4xl font-light text-muted-foreground ml-1">/100</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl md:text-2xl font-medium text-foreground"
        >
          {TIER_LABELS[tier.tier]}
        </motion.div>
      </div>

      {/* Horizontal Tier Bar */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative max-w-lg mx-auto px-4"
      >
        {/* Background gradient bar */}
        <div className="h-2 rounded-full bg-gradient-to-r from-muted via-muted-foreground/30 to-primary relative overflow-hidden">
          {/* Animated shimmer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ delay: 1.2, duration: 1.5, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
        </div>
        
        {/* Position marker */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute top-1/2 -translate-y-1/2"
          style={{ left: `${tierPosition}%` }}
        >
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-xs font-medium text-primary">You</span>
            </div>
          </div>
        </motion.div>

        {/* Tier labels */}
        <div className="flex justify-between mt-4 text-xs text-muted-foreground">
          <span>Needs Work</span>
          <span className="hidden sm:inline">Competitive</span>
          <span>Must-Interview</span>
        </div>
      </motion.div>

      {/* Points to next tier */}
      {pointsToNextTier > 0 && score < 90 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10"
        >
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-primary">+{pointsToNextTier}</span> points to reach the next tier
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

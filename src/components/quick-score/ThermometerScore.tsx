import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScoreTier {
  tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
  emoji: string;
  color: string;
  message: string;
}

interface ThermometerScoreProps {
  score: number;
  previousScore?: number;
  tier: ScoreTier;
  pointsToNextTier: number;
  nextTierThreshold: number;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showImprovement?: boolean;
}

const TIER_LABELS: Record<string, string> = {
  FREEZING: 'FREEZING',
  COLD: 'COLD',
  LUKEWARM: 'LUKEWARM',
  WARM: 'WARM',
  HOT: 'HOT',
  ON_FIRE: 'ON FIRE'
};

const TIER_COLORS: Record<string, { gradient: string; glow: string; text: string }> = {
  FREEZING: {
    gradient: 'from-blue-900 via-blue-800 to-blue-700',
    glow: 'shadow-blue-500/50',
    text: 'text-blue-400'
  },
  COLD: {
    gradient: 'from-blue-700 via-blue-600 to-blue-500',
    glow: 'shadow-blue-400/50',
    text: 'text-blue-300'
  },
  LUKEWARM: {
    gradient: 'from-amber-600 via-amber-500 to-amber-400',
    glow: 'shadow-amber-400/50',
    text: 'text-amber-400'
  },
  WARM: {
    gradient: 'from-orange-600 via-orange-500 to-orange-400',
    glow: 'shadow-orange-400/50',
    text: 'text-orange-400'
  },
  HOT: {
    gradient: 'from-red-600 via-red-500 to-red-400',
    glow: 'shadow-red-400/50',
    text: 'text-red-400'
  },
  ON_FIRE: {
    gradient: 'from-red-700 via-red-600 to-orange-500',
    glow: 'shadow-red-500/70',
    text: 'text-red-300'
  }
};

export function ThermometerScore({
  score,
  previousScore,
  tier,
  pointsToNextTier,
  nextTierThreshold,
  animate = true,
  size = 'lg',
  showImprovement = false
}: ThermometerScoreProps) {
  const [displayedScore, setDisplayedScore] = useState(animate ? 0 : score);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animate score counting up
  useEffect(() => {
    if (!animate) {
      setDisplayedScore(score);
      return;
    }

    const duration = 1500;
    const startTime = Date.now();
    const startValue = previousScore ?? 0;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startValue + (score - startValue) * eased);
      
      setDisplayedScore(currentScore);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      } else {
        // Check for milestone celebration
        if (score >= 75 && (previousScore ?? 0) < 75) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2000);
        }
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, previousScore, animate]);

  const tierColors = TIER_COLORS[tier.tier] || TIER_COLORS.LUKEWARM;
  
  const sizeClasses = {
    sm: { container: 'w-48', score: 'text-4xl', label: 'text-sm' },
    md: { container: 'w-64', score: 'text-5xl', label: 'text-base' },
    lg: { container: 'w-80', score: 'text-6xl', label: 'text-lg' }
  };

  const improvement = previousScore !== undefined ? score - previousScore : 0;

  return (
    <div className={cn('flex flex-col items-center gap-4', sizeClasses[size].container)}>
      {/* Score Circle */}
      <motion.div
        className={cn(
          'relative rounded-full p-1',
          'bg-gradient-to-br',
          tierColors.gradient,
          showCelebration && 'animate-pulse'
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className={cn(
          'rounded-full bg-background p-8 flex flex-col items-center justify-center',
          'shadow-lg',
          tierColors.glow
        )}>
          <motion.span
            className={cn(
              sizeClasses[size].score,
              'font-bold tabular-nums',
              tierColors.text
            )}
            key={displayedScore}
          >
            {displayedScore}
          </motion.span>
          <span className="text-muted-foreground text-sm">/100</span>
        </div>

        {/* Celebration particles */}
        <AnimatePresence>
          {showCelebration && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400"
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 1,
                    opacity: 1 
                  }}
                  animate={{ 
                    x: Math.cos(i * Math.PI / 4) * 80,
                    y: Math.sin(i * Math.PI / 4) * 80,
                    scale: 0,
                    opacity: 0
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tier Label */}
      <motion.div
        className="flex flex-col items-center gap-1"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{tier.emoji}</span>
          <span className={cn(
            sizeClasses[size].label,
            'font-bold tracking-wider',
            tierColors.text
          )}>
            {TIER_LABELS[tier.tier]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          {tier.message}
        </p>
      </motion.div>

      {/* Improvement indicator */}
      {showImprovement && improvement !== 0 && (
        <motion.div
          className={cn(
            'px-3 py-1 rounded-full text-sm font-medium',
            improvement > 0 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {improvement > 0 ? '+' : ''}{improvement} points
        </motion.div>
      )}

      {/* Thermometer Bar */}
      <div className="w-full mt-4">
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          {/* Gradient background showing full range */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-amber-500 to-red-500 opacity-20" />
          
          {/* Filled portion */}
          <motion.div
            className={cn(
              'absolute left-0 top-0 bottom-0 rounded-full',
              'bg-gradient-to-r',
              tierColors.gradient
            )}
            initial={{ width: 0 }}
            animate={{ width: `${displayedScore}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Tier markers */}
          <div className="absolute inset-0 flex">
            {[20, 40, 60, 75, 90].map((threshold) => (
              <div
                key={threshold}
                className="absolute h-full w-px bg-muted-foreground/30"
                style={{ left: `${threshold}%` }}
              />
            ))}
          </div>
        </div>

        {/* Tier labels under bar */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground px-1">
          <span>🥶</span>
          <span>❄️</span>
          <span>😐</span>
          <span>🔥</span>
          <span>🌟</span>
          <span>🚀</span>
        </div>
      </div>

      {/* Points to next tier */}
      {pointsToNextTier > 0 && score < 100 && (
        <motion.p
          className="text-sm text-muted-foreground text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="font-medium text-foreground">+{pointsToNextTier} points</span>
          {' '}to reach next tier
        </motion.p>
      )}
    </div>
  );
}

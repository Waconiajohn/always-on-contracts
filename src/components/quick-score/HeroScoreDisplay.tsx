/**
 * HeroScoreDisplay - Large, visually stunning score display
 * Typography-first design with horizontal tier position bar
 * Animated score counting with spring physics
 */

import { useState, useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Tier configuration with positions and colors
const TIER_CONFIG = {
  FREEZING: { label: 'Needs Work', position: 8, threshold: 30 },
  COLD: { label: 'Getting Started', position: 22, threshold: 45 },
  LUKEWARM: { label: 'Competitive', position: 38, threshold: 60 },
  WARM: { label: 'Strong', position: 55, threshold: 75 },
  HOT: { label: 'Excellent', position: 72, threshold: 90 },
  ON_FIRE: { label: 'Must-Interview', position: 90, threshold: 100 }
};

// Calculate exact position based on score (0-100 mapped to bar width)
function getScorePosition(score: number): number {
  // Map score directly to percentage position
  return Math.min(Math.max(score, 2), 98);
}

// Animated number component using spring physics
function AnimatedScore({ value, animate }: { value: number; animate: boolean }) {
  const spring = useSpring(animate ? 0 : value, {
    stiffness: 50,
    damping: 20,
    duration: 2000
  });
  
  const display = useTransform(spring, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  
  useEffect(() => {
    if (animate) {
      spring.set(value);
    }
    
    const unsubscribe = display.on('change', (latest) => {
      setDisplayValue(latest);
    });
    
    return () => unsubscribe();
  }, [value, animate, spring, display]);
  
  return <>{displayValue}</>;
}

export function HeroScoreDisplay({
  score,
  tier,
  pointsToNextTier,
  animate = true,
}: HeroScoreDisplayProps) {
  const [showMarker, setShowMarker] = useState(!animate);
  const scorePosition = getScorePosition(score);
  const tierLabel = TIER_CONFIG[tier.tier]?.label || 'Competitive';
  
  // Delay marker animation
  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setShowMarker(true), 800);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center space-y-10"
    >
      {/* Main Score Display */}
      <div className="space-y-3">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
          className="relative inline-flex items-baseline justify-center gap-1"
        >
          {/* Large Score Number */}
          <span className="text-[7rem] sm:text-[9rem] md:text-[11rem] font-extralight tracking-tighter text-foreground tabular-nums leading-none">
            <AnimatedScore value={score} animate={animate} />
          </span>
          <span className="text-3xl sm:text-4xl md:text-5xl font-light text-muted-foreground/60 self-end mb-4">
            /100
          </span>
        </motion.div>
        
        {/* Tier Label */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="flex items-center justify-center gap-2"
        >
          {tier.tier === 'ON_FIRE' && (
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          )}
          <span className="text-xl sm:text-2xl font-medium text-foreground">
            {tierLabel}
          </span>
          {tier.tier === 'ON_FIRE' && (
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          )}
        </motion.div>
      </div>

      {/* Horizontal Tier Position Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="relative max-w-xl mx-auto px-6"
      >
        {/* Tier Segments Background */}
        <div className="relative h-3 rounded-full overflow-hidden bg-muted">
          {/* Gradient fill based on score */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${scorePosition}%` }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute inset-y-0 left-0 rounded-full",
              "bg-gradient-to-r from-muted-foreground/40 via-primary/70 to-primary"
            )}
          />
          
          {/* Subtle segment dividers */}
          <div className="absolute inset-0 flex">
            {[30, 45, 60, 75, 90].map((threshold) => (
              <div
                key={threshold}
                className="absolute top-0 bottom-0 w-px bg-background/30"
                style={{ left: `${threshold}%` }}
              />
            ))}
          </div>
          
          {/* Shimmer effect */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ delay: 1.5, duration: 1.8, ease: 'easeInOut' }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent w-1/3"
          />
        </div>
        
        {/* Position Marker */}
        {showMarker && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute top-1/2"
            style={{ left: `${scorePosition}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="relative flex flex-col items-center">
              {/* Marker dot with ring */}
              <div className="relative">
                <div className="absolute inset-0 w-6 h-6 rounded-full bg-primary/20 animate-ping" 
                     style={{ animationDuration: '2s', animationIterationCount: 3 }} />
                <div className="w-6 h-6 rounded-full bg-primary border-[3px] border-background shadow-lg shadow-primary/25" />
              </div>
              
              {/* "You" label */}
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute -bottom-7"
              >
                <span className="text-xs font-semibold text-primary bg-background px-2 py-0.5 rounded-full border border-primary/20">
                  You
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Tier Labels Below Bar */}
        <div className="flex justify-between mt-8 text-xs text-muted-foreground">
          <span className="text-left">Needs Work</span>
          <span className="hidden sm:block">Competitive</span>
          <span className="hidden md:block">Strong</span>
          <span className="text-right">Must-Interview</span>
        </div>
      </motion.div>

      {/* Points to Next Tier CTA */}
      {pointsToNextTier > 0 && score < 90 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors"
        >
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            <span className="font-bold text-primary">+{pointsToNextTier}</span>
            <span className="mx-1">points to reach</span>
            <span className="font-medium text-foreground">{getNextTierLabel(tier.tier)}</span>
          </span>
        </motion.div>
      )}
      
      {/* Perfect Score State */}
      {score >= 90 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Excellent match! You're in the top tier.
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Helper to get next tier label
function getNextTierLabel(currentTier: string): string {
  const tiers = ['FREEZING', 'COLD', 'LUKEWARM', 'WARM', 'HOT', 'ON_FIRE'];
  const currentIndex = tiers.indexOf(currentTier);
  const nextTier = tiers[Math.min(currentIndex + 1, tiers.length - 1)];
  return TIER_CONFIG[nextTier as keyof typeof TIER_CONFIG]?.label || 'next tier';
}

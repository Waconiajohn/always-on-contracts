import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function AnimatedScoreRing({ 
  score, 
  size = 160, 
  strokeWidth = 12,
  className 
}: AnimatedScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // Animate the number counting up
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = score / steps;
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, stepDuration);
    
    return () => clearInterval(timer);
  }, [score]);
  
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'hsl(142 76% 36%)'; // emerald
    if (score >= 60) return 'hsl(45 93% 47%)'; // amber
    return 'hsl(0 84% 60%)'; // red
  };
  
  const getScoreGradient = () => {
    if (score >= 80) return ['hsl(142 76% 36%)', 'hsl(160 84% 39%)'];
    if (score >= 60) return ['hsl(45 93% 47%)', 'hsl(38 92% 50%)'];
    return ['hsl(0 84% 60%)', 'hsl(15 75% 55%)'];
  };
  
  const gradientColors = getScoreGradient();
  const gradientId = `score-gradient-${score}`;
  
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={gradientColors[0]} />
            <stop offset="100%" stopColor={gradientColors[1]} />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        
        {/* Animated progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Score number in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className="text-4xl font-bold"
          style={{ color: getScoreColor() }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {displayScore}%
        </motion.span>
        <motion.span 
          className="text-sm text-muted-foreground font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          Fit Score
        </motion.span>
      </div>
    </div>
  );
}

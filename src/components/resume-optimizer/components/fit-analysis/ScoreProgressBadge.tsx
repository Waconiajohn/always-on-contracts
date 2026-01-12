import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScoreProgressBadgeProps {
  label: string;
  current: number;
  max: number;
  trend?: 'up' | 'down' | 'stable';
  showPercentage?: boolean;
  size?: 'sm' | 'md';
}

export const ScoreProgressBadge: React.FC<ScoreProgressBadgeProps> = ({
  label,
  current,
  max,
  trend = 'stable',
  showPercentage = true,
  size = 'sm'
}) => {
  const percentage = max > 0 ? Math.round((current / max) * 100) : 0;
  
  const getColor = () => {
    if (percentage >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const TrendIcon = trend === 'up' 
    ? TrendingUp 
    : trend === 'down' 
      ? TrendingDown 
      : Minus;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border",
        getColor(),
        size === 'sm' ? 'text-xs' : 'text-sm'
      )}
    >
      <span className="font-medium">{label}:</span>
      <span className="font-bold">
        {showPercentage ? `${percentage}%` : `${current}/${max}`}
      </span>
      <TrendIcon className={cn(
        "opacity-70",
        size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
        trend === 'up' && 'text-emerald-500',
        trend === 'down' && 'text-red-500'
      )} />
    </motion.div>
  );
};

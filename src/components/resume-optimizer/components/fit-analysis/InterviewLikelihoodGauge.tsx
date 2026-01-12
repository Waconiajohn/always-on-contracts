import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, HelpCircle, ThumbsUp } from 'lucide-react';

interface InterviewLikelihoodGaugeProps {
  percentage: number;
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
  compact?: boolean;
}

const RECOMMENDATION_CONFIG = {
  'strong-yes': {
    label: 'Strong Yes',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500',
    ringColor: 'ring-emerald-200',
    icon: ThumbsUp,
  },
  yes: {
    label: 'Yes',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    ringColor: 'ring-green-200',
    icon: CheckCircle2,
  },
  maybe: {
    label: 'Maybe',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    ringColor: 'ring-amber-200',
    icon: HelpCircle,
  },
  no: {
    label: 'No',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    ringColor: 'ring-red-200',
    icon: XCircle,
  },
};

export function InterviewLikelihoodGauge({
  percentage,
  recommendation,
  compact = false,
}: InterviewLikelihoodGaugeProps) {
  const config = RECOMMENDATION_CONFIG[recommendation] || RECOMMENDATION_CONFIG.maybe;
  const Icon = config.icon;
  
  // Calculate the stroke dashoffset for the circular progress
  const radius = compact ? 40 : 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const size = compact ? 100 : 140;
  const strokeWidth = compact ? 8 : 10;
  const center = size / 2;

  return (
    <div className={cn('flex flex-col items-center gap-2', compact ? 'scale-90' : '')}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
        </svg>

        {/* Progress circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={config.color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={cn('font-bold', config.color, compact ? 'text-2xl' : 'text-3xl')}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {percentage}%
          </motion.span>
          <span className={cn('text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}>
            Interview
          </span>
        </div>
      </div>

      {/* Recommendation badge */}
      <motion.div
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full ring-2',
          config.bgColor,
          config.ringColor,
          'text-white shadow-sm'
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.3 }}
      >
        <Icon className={cn('fill-white/30', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
        <span className={cn('font-medium', compact ? 'text-xs' : 'text-sm')}>
          {config.label}
        </span>
      </motion.div>
    </div>
  );
}

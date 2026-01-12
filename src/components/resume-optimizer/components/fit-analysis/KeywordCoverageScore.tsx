import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';

interface KeywordCoverageScoreProps {
  covered: number;
  addable: number;
  missing: number;
  className?: string;
}

export function KeywordCoverageScore({ 
  covered, 
  addable, 
  missing,
  className 
}: KeywordCoverageScoreProps) {
  const total = covered + addable + missing;
  const coveragePercent = total > 0 ? Math.round((covered / total) * 100) : 0;
  const potentialPercent = total > 0 ? Math.round(((covered + addable) / total) * 100) : 0;
  
  // Determine status
  const getStatus = () => {
    if (coveragePercent >= 80) return { label: 'Excellent', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
    if (coveragePercent >= 60) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    if (coveragePercent >= 40) return { label: 'Moderate', color: 'text-amber-600', bgColor: 'bg-amber-500' };
    return { label: 'Needs Work', color: 'text-red-600', bgColor: 'bg-red-500' };
  };
  
  const status = getStatus();
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Score Circle */}
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 flex-shrink-0">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-muted/20"
              strokeWidth="12"
            />
            {/* Covered (solid) */}
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-emerald-500"
              strokeWidth="12"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${2 * Math.PI * 42}` }}
              animate={{ strokeDasharray: `${(coveragePercent / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            {/* Potential (dashed) */}
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-amber-400"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="4 4"
              initial={{ 
                strokeDashoffset: -((coveragePercent / 100) * 2 * Math.PI * 42),
                pathLength: 0 
              }}
              animate={{ 
                strokeDashoffset: -((coveragePercent / 100) * 2 * Math.PI * 42),
                pathLength: ((potentialPercent - coveragePercent) / 100)
              }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className={cn("text-2xl font-bold", status.color)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {coveragePercent}%
            </motion.span>
            <span className="text-xs text-muted-foreground">covered</span>
          </div>
        </div>
        
        {/* Stats breakdown */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">{covered} keywords matched</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span className="text-sm text-muted-foreground">{addable} can be added</span>
          </div>
          {missing > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">{missing} experience gaps</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Potential message */}
      {addable > 0 && (
        <motion.div 
          className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-sm text-amber-800">
            <strong>💡 Optimization potential:</strong> Adding {addable} keywords could boost your ATS score to {potentialPercent}%
          </p>
        </motion.div>
      )}
    </div>
  );
}

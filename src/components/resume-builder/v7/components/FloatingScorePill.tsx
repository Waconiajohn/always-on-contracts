/**
 * FloatingScorePill - Compact collapsible score indicator
 * Always visible, expands on hover to show breakdown
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Target, Cpu, Users, ChevronDown } from 'lucide-react';
import { calculateTier, type ScoreBreakdown } from '../types';

interface FloatingScorePillProps {
  score: number;
  previousScore?: number;
  breakdown: ScoreBreakdown;
  className?: string;
}

export function FloatingScorePill({ 
  score, 
  previousScore, 
  breakdown,
  className 
}: FloatingScorePillProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tier = calculateTier(score);
  const change = previousScore !== undefined ? score - previousScore : 0;

  const getTierColor = () => {
    switch (tier.tier) {
      case 'ON_FIRE': return 'bg-gradient-to-r from-red-500 to-orange-500 text-white';
      case 'HOT': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white';
      case 'WARM': return 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black';
      case 'LUKEWARM': return 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black';
      case 'COLD': return 'bg-gradient-to-r from-blue-400 to-blue-500 text-white';
      case 'FREEZING': return 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <div 
      className={cn("fixed top-4 right-4 z-50", className)}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <motion.div
        layout
        className={cn(
          "rounded-xl shadow-lg cursor-pointer overflow-hidden",
          getTierColor()
        )}
      >
        {/* Collapsed State - Just Score */}
        <motion.div 
          className="px-4 py-2 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-2xl font-bold">{Math.round(score)}</span>
          <span className="text-lg">{tier.emoji}</span>
          
          {/* Score Change */}
          <AnimatePresence>
            {change !== 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className={cn(
                  "flex items-center text-sm font-medium",
                  change > 0 ? "text-green-200" : "text-red-200"
                )}
              >
                {change > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {change > 0 ? '+' : ''}{change}
              </motion.div>
            )}
          </AnimatePresence>

          <ChevronDown 
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )} 
          />
        </motion.div>

        {/* Expanded State - Breakdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 pt-1 border-t border-white/20 space-y-2">
                <p className="text-xs font-medium opacity-80">{tier.message}</p>
                
                {/* Score Breakdown */}
                <div className="space-y-1.5">
                  <ScoreRow 
                    icon={<Cpu className="h-3 w-3" />}
                    label="ATS"
                    value={breakdown.ats}
                  />
                  <ScoreRow 
                    icon={<Target className="h-3 w-3" />}
                    label="Match"
                    value={breakdown.requirements}
                  />
                  <ScoreRow 
                    icon={<Users className="h-3 w-3" />}
                    label="Compete"
                    value={breakdown.competitive}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function ScoreRow({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5 opacity-80">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-12 h-1.5 rounded-full bg-white/30">
          <motion.div 
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </div>
        <span className="font-medium w-7 text-right">{value}%</span>
      </div>
    </div>
  );
}

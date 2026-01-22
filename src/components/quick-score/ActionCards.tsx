/**
 * ActionCards - Numbered improvement cards with point impact
 * Actionable recommendations that lead to Resume Builder
 */

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityFix {
  priority: number;
  category: string;
  issue: string;
  fix: string;
  impact: string;
  gapType?: string;
}

interface ActionCardsProps {
  priorityFixes: PriorityFix[];
}

const categoryColors: Record<string, string> = {
  jdMatch: 'border-l-primary',
  industryBenchmark: 'border-l-chart-2',
  atsCompliance: 'border-l-chart-4',
  humanVoice: 'border-l-chart-5'
};

const categoryLabels: Record<string, string> = {
  jdMatch: 'Job Match',
  industryBenchmark: 'Industry',
  atsCompliance: 'ATS',
  humanVoice: 'Voice'
};

export function ActionCards({ priorityFixes }: ActionCardsProps) {
  // Show top 3 priority fixes
  const topFixes = priorityFixes.slice(0, 3);
  
  // Calculate total potential points
  const totalPotential = topFixes.reduce((sum, fix) => {
    const points = parseInt(fix.impact.replace(/[^\d]/g, '')) || 0;
    return sum + points;
  }, 0);

  if (topFixes.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Top Improvements
          </h3>
        </div>
        {totalPotential > 0 && (
          <span className="text-sm font-medium text-primary">
            +{totalPotential} pts potential
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {topFixes.map((fix, index) => (
          <motion.div
            key={fix.priority}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            className={cn(
              "relative rounded-lg border border-border bg-card p-4 border-l-4",
              categoryColors[fix.category] || 'border-l-primary'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Number */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground text-sm leading-tight">
                      {fix.issue}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {fix.fix}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-primary whitespace-nowrap">
                    {fix.impact}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {categoryLabels[fix.category] || fix.category}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA if more fixes exist */}
      {priorityFixes.length > 3 && (
        <p className="text-xs text-center text-muted-foreground">
          +{priorityFixes.length - 3} more improvements identified
        </p>
      )}
    </motion.div>
  );
}

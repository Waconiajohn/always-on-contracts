/**
 * ActionCards - Complete list of improvement areas with point impact
 * Shows ALL identified improvements grouped by category
 */

import { motion } from 'framer-motion';
import { Zap, ArrowRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export interface PriorityFix {
  priority: number;
  category: string;
  issue: string;
  fix: string;
  impact: string;
  gapType?: string;
}

interface ActionCardsProps {
  priorityFixes: PriorityFix[];
  onFixIssue?: (fix: PriorityFix) => void;
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

export function ActionCards({ priorityFixes, onFixIssue }: ActionCardsProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Calculate total potential points from ALL fixes
  const totalPotential = priorityFixes.reduce((sum, fix) => {
    const points = parseInt(fix.impact.replace(/[^\d]/g, '')) || 0;
    return sum + points;
  }, 0);

  if (priorityFixes.length === 0) return null;

  // Group fixes by category
  const groupedFixes = priorityFixes.reduce((acc, fix) => {
    const category = fix.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(fix);
    return acc;
  }, {} as Record<string, PriorityFix[]>);

  // Show first 5 by default, all when expanded
  const displayFixes = showAll ? priorityFixes : priorityFixes.slice(0, 5);
  const hasMore = priorityFixes.length > 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            High-Impact Changes to Improve Your Score
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {priorityFixes.length} improvements found
          </span>
          {totalPotential > 0 && (
            <span className="text-sm font-medium text-primary">
              +{totalPotential} pts potential
            </span>
          )}
        </div>
      </div>

      {/* Category Summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(groupedFixes).map(([category, fixes]) => (
          <span
            key={category}
            className={cn(
              "text-xs px-2 py-1 rounded-full border",
              category === 'jdMatch' && "bg-primary/10 border-primary/20 text-primary",
              category === 'industryBenchmark' && "bg-chart-2/10 border-chart-2/20 text-chart-2",
              category === 'atsCompliance' && "bg-chart-4/10 border-chart-4/20 text-chart-4",
              category === 'humanVoice' && "bg-chart-5/10 border-chart-5/20 text-chart-5",
              !categoryColors[category] && "bg-muted border-border text-muted-foreground"
            )}
          >
            {categoryLabels[category] || category}: {fixes.length}
          </span>
        ))}
      </div>

      {/* Cards - Scrollable container */}
      <div className={cn(
        "space-y-3",
        showAll && priorityFixes.length > 6 && "max-h-[600px] overflow-y-auto pr-2"
      )}>
        {displayFixes.map((fix, index) => (
          <motion.div
            key={`${fix.priority}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {fix.fix}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm font-semibold text-primary whitespace-nowrap">
                    {fix.impact}
                  </span>
                </div>
                
                {/* Category label and Fix button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {categoryLabels[fix.category] || fix.category}
                  </span>
                  {onFixIssue && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-primary hover:text-primary"
                      onClick={() => onFixIssue(fix)}
                    >
                      Fix This
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show More/Less Toggle */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          {showAll ? 'Show Less' : `Show All ${priorityFixes.length} Improvements`}
          <ChevronDown className={cn(
            "h-3.5 w-3.5 transition-transform",
            showAll && "rotate-180"
          )} />
        </Button>
      )}
    </motion.div>
  );
}

/**
 * ScoreBreakdownGrid - Clean 2x2 grid of score categories
 * Scannable, no collapsible content - just the essentials
 */

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Target, Building, FileCheck, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreBreakdownGridProps {
  scores: {
    jdMatch: { score: number; weight: number };
    industryBenchmark: { score: number; weight: number };
    atsCompliance: { score: number; weight: number };
    humanVoice: { score: number; weight: number };
  };
}

interface ScoreCardProps {
  title: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  delay: number;
}

function ScoreCard({ title, score, weight, icon, delay }: ScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-primary';
    if (s >= 60) return 'text-foreground';
    return 'text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="p-5 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <span className="text-xs text-muted-foreground">{weight}%</span>
      </div>
      
      <div className="space-y-3">
        <div className={cn('text-4xl font-light tabular-nums', getScoreColor(score))}>
          {score}%
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    </motion.div>
  );
}

export function ScoreBreakdownGrid({ scores }: ScoreBreakdownGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Score Breakdown
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard
          title="JD Match"
          score={scores.jdMatch.score}
          weight={scores.jdMatch.weight}
          icon={<Target className="h-4 w-4" />}
          delay={0.4}
        />
        <ScoreCard
          title="Industry"
          score={scores.industryBenchmark.score}
          weight={scores.industryBenchmark.weight}
          icon={<Building className="h-4 w-4" />}
          delay={0.5}
        />
        <ScoreCard
          title="ATS Ready"
          score={scores.atsCompliance.score}
          weight={scores.atsCompliance.weight}
          icon={<FileCheck className="h-4 w-4" />}
          delay={0.6}
        />
        <ScoreCard
          title="Human Voice"
          score={scores.humanVoice.score}
          weight={scores.humanVoice.weight}
          icon={<User className="h-4 w-4" />}
          delay={0.7}
        />
      </div>
    </motion.div>
  );
}

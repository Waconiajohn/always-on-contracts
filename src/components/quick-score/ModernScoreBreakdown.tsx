/**
 * ModernScoreBreakdown - Simplified score categories
 * Just scores and progress bars - no collapsible text walls
 */

import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Building, 
  FileCheck, 
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernScoreBreakdownProps {
  scores: {
    jdMatch: { score: number; weight: number };
    industryBenchmark: { score: number; weight: number };
    atsCompliance: { score: number; weight: number };
    humanVoice: { score: number; weight: number };
  };
  breakdown?: any; // Keep for compatibility but don't use
}

interface CategoryRowProps {
  title: string;
  score: number;
  weight: number;
  icon: React.ReactNode;
  index: number;
}

function CategoryRow({ title, score, weight, icon, index }: CategoryRowProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <span className="font-medium text-sm">{title}</span>
          <span className="text-xs text-muted-foreground ml-2">({weight}%)</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={score} className="w-24 h-2" />
        <span className={cn(
          "text-lg font-semibold tabular-nums min-w-[3rem] text-right",
          score >= 80 ? "text-primary" : score >= 60 ? "text-foreground" : "text-muted-foreground"
        )}>
          {score}%
        </span>
      </div>
    </motion.div>
  );
}

export function ModernScoreBreakdown({ scores }: ModernScoreBreakdownProps) {
  const categories = [
    { 
      title: "Job Description Match", 
      score: scores.jdMatch.score, 
      weight: scores.jdMatch.weight,
      icon: <Target className="h-4 w-4" />
    },
    { 
      title: "Industry Benchmark", 
      score: scores.industryBenchmark.score, 
      weight: scores.industryBenchmark.weight,
      icon: <Building className="h-4 w-4" />
    },
    { 
      title: "ATS Compliance", 
      score: scores.atsCompliance.score, 
      weight: scores.atsCompliance.weight,
      icon: <FileCheck className="h-4 w-4" />
    },
    { 
      title: "Human Voice", 
      score: scores.humanVoice.score, 
      weight: scores.humanVoice.weight,
      icon: <User className="h-4 w-4" />
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="border border-border rounded-lg bg-background"
    >
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Score Breakdown
        </h3>
      </div>
      
      <div className="px-4">
        {categories.map((cat, index) => (
          <CategoryRow 
            key={cat.title}
            title={cat.title}
            score={cat.score}
            weight={cat.weight}
            icon={cat.icon}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}

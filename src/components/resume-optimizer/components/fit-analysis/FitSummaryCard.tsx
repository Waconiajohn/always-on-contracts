import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle, Target } from 'lucide-react';
import { FitSummaryCardProps } from './types';
import { cn } from '@/lib/utils';

// Inline animated score ring (replaces AnimatedScoreRing import)
function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const scoreColor = score >= 80 
    ? 'hsl(var(--primary))' 
    : score >= 60 
      ? 'hsl(45 93% 47%)' 
      : 'hsl(0 84% 60%)';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          className="opacity-30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: scoreColor }}>{score}%</span>
        <span className="text-xs text-muted-foreground">Fit Score</span>
      </div>
    </div>
  );
}

export function FitSummaryCard({
  overallFitScore,
  requirementsCount,
  evidenceCount,
  highlyQualifiedCount,
  partiallyQualifiedCount,
  experienceGapsCount
}: FitSummaryCardProps) {
  const getScoreMessage = () => {
    if (overallFitScore >= 85) return { text: "Excellent Match!", subtext: "You're a top candidate for this role" };
    if (overallFitScore >= 70) return { text: "Strong Candidate!", subtext: "A few strategic improvements will make you unstoppable" };
    if (overallFitScore >= 50) return { text: "Solid Potential", subtext: "Let's bridge the gaps with smart positioning" };
    return { text: "Room to Grow", subtext: "Focus on transferable skills and bridging strategies" };
  };
  
  const message = getScoreMessage();
  
  const statItems = [
    { count: highlyQualifiedCount, label: "Strong", Icon: CheckCircle2, iconClass: "text-primary" },
    { count: partiallyQualifiedCount, label: "Partial", Icon: AlertCircle, iconClass: "text-muted-foreground" },
    { count: experienceGapsCount, label: "Gaps", Icon: XCircle, iconClass: "text-muted-foreground/70" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border shadow-sm bg-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <ScoreRing score={overallFitScore} size={120} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Fit Analysis</span>
              </div>
              
              <h2 className="text-xl font-bold text-foreground mb-1">{message.text}</h2>
              <p className="text-sm text-muted-foreground mb-4">{message.subtext}</p>
              
              <div className="flex items-center gap-4">
                {statItems.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-2">
                    <stat.Icon className={cn("h-4 w-4", stat.iconClass)} />
                    <span className="text-lg font-bold text-foreground">{stat.count}</span>
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mt-3">
                Analyzed {requirementsCount} requirements • {evidenceCount} evidence points
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

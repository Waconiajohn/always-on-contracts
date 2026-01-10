import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle, Target } from 'lucide-react';
import { AnimatedScoreRing } from './AnimatedScoreRing';
import { FitSummaryCardProps } from './types';
import { cn } from '@/lib/utils';

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
  
  // Compact stat items - no colored backgrounds
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
          {/* Compact Hero Section */}
          <div className="flex items-center gap-6">
            {/* Score Ring - Smaller */}
            <div className="flex-shrink-0">
              <AnimatedScoreRing score={overallFitScore} size={120} strokeWidth={10} />
            </div>
            
            {/* Message + Stats Combined */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Fit Analysis</span>
              </div>
              
              <h2 className="text-xl font-bold text-foreground mb-1">{message.text}</h2>
              <p className="text-sm text-muted-foreground mb-4">{message.subtext}</p>
              
              {/* Inline Stats */}
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

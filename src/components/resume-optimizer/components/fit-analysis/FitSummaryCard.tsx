import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle, Target, Sparkles } from 'lucide-react';
import { AnimatedScoreRing } from './AnimatedScoreRing';
import { FitSummaryCardProps } from './types';

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
  
  const statCards = [
    {
      count: highlyQualifiedCount,
      label: "Strong Matches",
      Icon: CheckCircle2,
      bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30",
      borderClass: "border-emerald-200 dark:border-emerald-800",
      iconClass: "text-emerald-600 dark:text-emerald-400",
      textClass: "text-emerald-700 dark:text-emerald-300"
    },
    {
      count: partiallyQualifiedCount,
      label: "Partial Matches",
      Icon: AlertCircle,
      bgClass: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30",
      borderClass: "border-amber-200 dark:border-amber-800",
      iconClass: "text-amber-600 dark:text-amber-400",
      textClass: "text-amber-700 dark:text-amber-300"
    },
    {
      count: experienceGapsCount,
      label: "Gaps to Address",
      Icon: XCircle,
      bgClass: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30",
      borderClass: "border-red-200 dark:border-red-800",
      iconClass: "text-red-600 dark:text-red-400",
      textClass: "text-red-700 dark:text-red-300"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/30">
        <CardContent className="p-8">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
            {/* Score Ring */}
            <div className="flex-shrink-0">
              <AnimatedScoreRing score={overallFitScore} size={180} strokeWidth={14} />
            </div>
            
            {/* Message */}
            <div className="text-center lg:text-left flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex items-center gap-2 justify-center lg:justify-start mb-2"
              >
                <Target className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium text-primary uppercase tracking-wider">Fit Analysis Complete</span>
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-3xl lg:text-4xl font-bold mb-2"
              >
                {message.text}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-lg text-muted-foreground"
              >
                {message.subtext}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="flex items-center gap-2 mt-4 justify-center lg:justify-start text-sm text-muted-foreground"
              >
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Analyzed <strong>{requirementsCount}</strong> requirements against <strong>{evidenceCount}</strong> evidence points</span>
              </motion.div>
            </div>
          </div>
          
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                className={`relative p-5 rounded-xl border-2 transition-all hover:scale-[1.02] ${stat.bgClass} ${stat.borderClass}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg bg-background/80 shadow-sm ${stat.borderClass}`}>
                    <stat.Icon className={`h-6 w-6 ${stat.iconClass}`} />
                  </div>
                  <div>
                    <div className={`text-3xl font-bold ${stat.textClass}`}>
                      {stat.count}
                    </div>
                    <div className={`text-sm font-medium ${stat.textClass}`}>
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

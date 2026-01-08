import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, TrendingUp, Lightbulb, Shield, CheckCircle2 } from 'lucide-react';
import { ExecutiveSummaryCardProps } from './types';
import { cn } from '@/lib/utils';

export function ExecutiveSummaryCard({ executiveSummary }: ExecutiveSummaryCardProps) {
  const { hireSignal, likelyObjections, mitigationStrategy, bestPositioningAngle } = executiveSummary;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 px-8 py-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Why You'll Get This Job</h3>
              <p className="text-muted-foreground">Your strategic advantages and how to leverage them</p>
            </div>
          </div>
        </div>
        
        <CardContent className="p-8 space-y-8">
          {/* Hire Signal - Big Quote */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="absolute -left-2 -top-2 text-6xl text-primary/20 font-serif">"</div>
            <div className="pl-8 pr-4">
              <div className="flex items-start gap-3 mb-3">
                <TrendingUp className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-1" />
                <span className="text-sm font-semibold uppercase tracking-wider text-emerald-600">Hire Signal</span>
              </div>
              <p className="text-xl lg:text-2xl font-medium leading-relaxed text-foreground/90">
                {hireSignal}
              </p>
            </div>
          </motion.div>
          
          {/* Best Positioning Angle */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2 text-primary">Best Positioning Angle</h4>
                <p className="text-base text-foreground/80 leading-relaxed">{bestPositioningAngle}</p>
              </div>
            </div>
          </motion.div>
          
          {/* Objections & Mitigations */}
          {likelyObjections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-amber-600" />
                <h4 className="text-lg font-semibold">Objection Handling</h4>
              </div>
              
              <div className="space-y-4">
                {likelyObjections.map((objection, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.1 }}
                    className="rounded-xl overflow-hidden border"
                  >
                    {/* Objection */}
                    <div className={cn(
                      "px-5 py-4 border-l-4 border-l-amber-500",
                      "bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10"
                    )}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">They might worry about:</p>
                          <p className="text-base text-amber-900 dark:text-amber-100">{objection}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mitigation */}
                    {mitigationStrategy[idx] && (
                      <div className={cn(
                        "px-5 py-4 border-l-4 border-l-emerald-500",
                        "bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10"
                      )}>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-1">Counter with:</p>
                            <p className="text-base text-emerald-900 dark:text-emerald-100">{mitigationStrategy[idx]}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

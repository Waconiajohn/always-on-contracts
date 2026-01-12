import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gavel, ThumbsUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { InterviewLikelihoodGauge } from './InterviewLikelihoodGauge';

interface FinalVerdictCardProps {
  summary: string;
  topStrength: string;
  biggestConcern: string;
  interviewLikelihood: number;
  recommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
}

export function FinalVerdictCard({
  summary,
  topStrength,
  biggestConcern,
  interviewLikelihood,
  recommendation,
}: FinalVerdictCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" />
          Final Verdict
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[1fr_auto] gap-6">
          {/* Summary & Details */}
          <div className="space-y-4">
            <motion.p
              className="text-sm leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {summary}
            </motion.p>

            <div className="grid gap-3">
              {/* Top Strength */}
              <motion.div
                className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <ThumbsUp className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-0.5">
                    Top Strength
                  </p>
                  <p className="text-sm text-emerald-900 dark:text-emerald-200">{topStrength}</p>
                </div>
              </motion.div>

              {/* Biggest Concern */}
              <motion.div
                className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">
                    Biggest Concern
                  </p>
                  <p className="text-sm text-amber-900 dark:text-amber-200">{biggestConcern}</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Interview Likelihood Gauge */}
          <div className="flex items-center justify-center">
            <InterviewLikelihoodGauge
              percentage={interviewLikelihood}
              recommendation={recommendation}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

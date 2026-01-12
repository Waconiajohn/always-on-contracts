import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, AlertCircle, XCircle, Target } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompetencyEvaluation {
  competency: string;
  evidence_level: 'strong' | 'moderate' | 'weak' | 'missing';
  notes: string;
}

interface OutcomeEvaluation {
  outcome: string;
  addressed: boolean;
  how: string;
}

interface RubricEvaluationCardProps {
  competencies: CompetencyEvaluation[];
  outcomes: OutcomeEvaluation[];
  benchmarkGaps: string[];
}

const EVIDENCE_CONFIG = {
  strong: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Strong',
  },
  moderate: {
    icon: Circle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Moderate',
  },
  weak: {
    icon: AlertCircle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Weak',
  },
  missing: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Missing',
  },
};

export function RubricEvaluationCard({
  competencies,
  outcomes,
  benchmarkGaps,
}: RubricEvaluationCardProps) {
  if (!competencies?.length && !outcomes?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Role Success Rubric Evaluation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Competencies Demonstrated */}
        {competencies?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Competencies Demonstrated
            </h4>
            <div className="grid gap-2">
              {competencies.map((comp, idx) => {
                const config = EVIDENCE_CONFIG[comp.evidence_level] || EVIDENCE_CONFIG.missing;
                const Icon = config.icon;
                return (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <div className={cn('p-1 rounded-full', config.bgColor)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{comp.competency}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'shrink-0 text-xs',
                            config.bgColor,
                            config.color,
                            'border-transparent'
                          )}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      {comp.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{comp.notes}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Outcomes Addressed */}
        {outcomes?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Core Outcomes Addressed
            </h4>
            <div className="grid gap-2">
              {outcomes.map((outcome, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card/50"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.2 }}
                >
                  <div
                    className={cn(
                      'p-1 rounded-full',
                      outcome.addressed ? 'bg-emerald-100' : 'bg-red-100'
                    )}
                  >
                    {outcome.addressed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{outcome.outcome}</span>
                    {outcome.how && (
                      <p className="text-xs text-muted-foreground mt-1">{outcome.how}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Benchmark Gaps */}
        {benchmarkGaps?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">
              Benchmark Gaps to Address
            </h4>
            <div className="flex flex-wrap gap-2">
              {benchmarkGaps.map((gap, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 + 0.4 }}
                >
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {gap}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

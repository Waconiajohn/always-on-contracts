/**
 * HiringPrioritiesPanel - Displays what hiring managers really care about
 * Shows priorities with candidate status and evidence
 */

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Target, CheckCircle2, AlertCircle, XCircle, 
  Lightbulb, Quote 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HiringPriority {
  priority: string;
  whyItMatters: string;
  evidenceNeeded: string;
  candidateStatus: 'strong' | 'partial' | 'missing';
  candidateEvidence?: string | null;
}

interface HiringPrioritiesPanelProps {
  priorities: HiringPriority[];
}

const statusConfig = {
  strong: {
    icon: CheckCircle2,
    label: 'Strong Match',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30'
  },
  partial: {
    icon: AlertCircle,
    label: 'Partial Match',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30'
  },
  missing: {
    icon: XCircle,
    label: 'Not Shown',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/30'
  }
};

function PriorityCard({ priority, index }: { priority: HiringPriority; index: number }) {
  const status = statusConfig[priority.candidateStatus] || statusConfig.missing;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "p-4 rounded-lg border",
        status.bgColor,
        status.borderColor
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Priority Title */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">
              {index + 1}
            </span>
            <h4 className="font-medium text-sm text-foreground">
              {priority.priority}
            </h4>
          </div>

          {/* Why It Matters */}
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">
              {priority.whyItMatters}
            </p>
          </div>

          {/* Evidence Needed */}
          <div className="flex items-start gap-2 mb-3 p-2 rounded bg-muted/50">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                What They Need to See:
              </span>
              <p className="text-xs text-foreground mt-0.5">
                {priority.evidenceNeeded}
              </p>
            </div>
          </div>

          {/* Candidate Evidence (if present) */}
          {priority.candidateEvidence && priority.candidateStatus !== 'missing' && (
            <div className="flex items-start gap-2 p-2 rounded bg-card border border-border">
              <Quote className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] uppercase tracking-wide text-primary font-medium">
                  Your Resume Shows:
                </span>
                <p className="text-xs text-foreground mt-0.5 italic">
                  "{priority.candidateEvidence}"
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <Badge 
          variant="outline" 
          className={cn(
            "flex items-center gap-1 flex-shrink-0",
            status.color
          )}
        >
          <StatusIcon className="h-3 w-3" />
          <span className="text-[10px]">{status.label}</span>
        </Badge>
      </div>
    </motion.div>
  );
}

export function HiringPrioritiesPanel({ priorities = [] }: HiringPrioritiesPanelProps) {
  if (priorities.length === 0) return null;

  const strongCount = priorities.filter(p => p.candidateStatus === 'strong').length;
  const partialCount = priorities.filter(p => p.candidateStatus === 'partial').length;
  const missingCount = priorities.filter(p => p.candidateStatus === 'missing').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="border border-border rounded-lg bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              What Hiring Managers Care About
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {strongCount > 0 && (
              <Badge variant="outline" className="text-primary border-primary/30 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" />
                {strongCount} strong
              </Badge>
            )}
            {partialCount > 0 && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
                <AlertCircle className="h-2.5 w-2.5" />
                {partialCount} partial
              </Badge>
            )}
            {missingCount > 0 && (
              <Badge variant="outline" className="text-destructive border-destructive/30 gap-1">
                <XCircle className="h-2.5 w-2.5" />
                {missingCount} missing
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          These are the top priorities that would make a hiring manager say "we MUST interview this person"
        </p>
      </div>

      {/* Priority Cards */}
      <div className="p-4 space-y-3">
        {priorities.map((priority, index) => (
          <PriorityCard key={index} priority={priority} index={index} />
        ))}
      </div>
    </motion.div>
  );
}

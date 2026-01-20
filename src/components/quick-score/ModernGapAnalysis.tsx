/**
 * ModernGapAnalysis - Clean gap analysis sections
 * Simple list-based display with subtle visual hierarchy
 */

import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Star, 
  Trash2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GapAnalysis {
  fullMatches: Array<{ requirement: string; evidence: string }>;
  partialMatches: Array<{ requirement: string; currentStatus: string; recommendation: string }>;
  missingRequirements: Array<{ requirement: string; workaround: string }>;
  overqualifications: Array<{ experience: string; recommendation: string }>;
  irrelevantContent: Array<{ content: string; recommendation: string }>;
  gapSummary: string[];
}

interface ModernGapAnalysisProps {
  gapAnalysis: GapAnalysis;
}

interface GapSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function GapSection({ title, count, icon, children, defaultOpen = false }: GapSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-lg bg-background overflow-hidden"
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{icon}</span>
              <span className="font-medium text-sm">{title}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {count}
              </span>
            </div>
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isOpen && "rotate-90"
            )} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function ModernGapAnalysis({ gapAnalysis }: ModernGapAnalysisProps) {
  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-8 py-4 text-sm"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span><strong>{gapAnalysis.fullMatches?.length || 0}</strong> matched</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <span><strong>{gapAnalysis.partialMatches?.length || 0}</strong> partial</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span><strong>{gapAnalysis.missingRequirements?.length || 0}</strong> gaps</span>
        </div>
      </motion.div>

      {/* Full Matches */}
      <GapSection
        title="What You Have That Matches"
        count={gapAnalysis.fullMatches?.length || 0}
        icon={<CheckCircle2 className="h-4 w-4" />}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {gapAnalysis.fullMatches?.map((match, i) => (
            <div key={i} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
              <p className="font-medium text-sm mb-1">{match.requirement}</p>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                {match.evidence}
              </p>
            </div>
          ))}
        </div>
      </GapSection>

      {/* Partial Matches */}
      <GapSection
        title="Partial Matches – Need Enhancement"
        count={gapAnalysis.partialMatches?.length || 0}
        icon={<AlertCircle className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {gapAnalysis.partialMatches?.map((match, i) => (
            <div key={i} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
              <p className="font-medium text-sm mb-1">{match.requirement}</p>
              <p className="text-xs text-muted-foreground mb-2">
                Current: {match.currentStatus}
              </p>
              <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                <span>{match.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </GapSection>

      {/* Missing Requirements */}
      <GapSection
        title="Missing or Underrepresented"
        count={gapAnalysis.missingRequirements?.length || 0}
        icon={<XCircle className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {gapAnalysis.missingRequirements?.map((item, i) => (
            <div key={i} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
              <p className="font-medium text-sm mb-2 flex items-start gap-2">
                <XCircle className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                {item.requirement}
              </p>
              <div className="flex items-start gap-2 text-sm bg-primary/5 p-2 rounded">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                <span>{item.workaround}</span>
              </div>
            </div>
          ))}
        </div>
      </GapSection>

      {/* Overqualifications */}
      <GapSection
        title="High-Value Experience to Emphasize"
        count={gapAnalysis.overqualifications?.length || 0}
        icon={<Star className="h-4 w-4" />}
      >
        <div className="space-y-3">
          {gapAnalysis.overqualifications?.map((item, i) => (
            <div key={i} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
              <p className="font-medium text-sm mb-1 flex items-start gap-2">
                <Star className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                {item.experience}
              </p>
              <p className="text-sm text-muted-foreground pl-5">
                {item.recommendation}
              </p>
            </div>
          ))}
        </div>
      </GapSection>

      {/* Irrelevant Content */}
      <GapSection
        title="Content to Remove or Compress"
        count={gapAnalysis.irrelevantContent?.length || 0}
        icon={<Trash2 className="h-4 w-4" />}
      >
        <div className="space-y-3">
          {gapAnalysis.irrelevantContent?.map((item, i) => (
            <div key={i} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
              <p className="text-sm text-muted-foreground line-through mb-1">
                {item.content}
              </p>
              <p className="text-sm text-muted-foreground pl-1">
                → {item.recommendation}
              </p>
            </div>
          ))}
        </div>
      </GapSection>

      {/* Gap Summary */}
      {(gapAnalysis.gapSummary?.length || 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-dashed border-border rounded-lg p-4 bg-background"
        >
          <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Summary of Key Gaps
          </h4>
          <ol className="space-y-2">
            {gapAnalysis.gapSummary.map((gap, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {i + 1}
                </span>
                <span>{gap}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}
    </div>
  );
}

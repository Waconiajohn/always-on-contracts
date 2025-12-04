/**
 * GapAssessmentStep - Clean, professional gap analysis
 * Redesigned: No pastels, no duplicates, proper visual hierarchy
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  Zap
} from 'lucide-react';
import type { BenchmarkBuilderState, Gap } from '../types';

interface GapAssessmentStepProps {
  state: BenchmarkBuilderState;
  onNext: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
}

export function GapAssessmentStep({
  state,
  onNext
}: GapAssessmentStepProps) {
  const criticalGaps = state.gaps.filter(g => g.severity === 'critical');
  const importantGaps = state.gaps.filter(g => g.severity === 'important');
  const niceToHaveGaps = state.gaps.filter(g => g.severity === 'nice-to-have');
  
  const potentialScore = Math.min(95, state.currentScore + 
    (criticalGaps.length * 8) + 
    (importantGaps.length * 4) + 
    (niceToHaveGaps.length * 2)
  );

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* Compact Summary Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b">
          <div>
            <h1 className="text-2xl font-bold">Gap Analysis</h1>
            <p className="text-muted-foreground mt-1">
              {state.gaps.length} gaps to close for must-interview status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {state.detected.role || 'Role'}
            </Badge>
            {state.detected.industry && (
              <Badge variant="outline" className="text-sm">
                {state.detected.industry}
              </Badge>
            )}
            {state.detected.level && (
              <Badge variant="outline" className="text-sm">
                {state.detected.level}
              </Badge>
            )}
          </div>
        </div>

        {/* Score Summary - Single Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreBox 
            label="Current" 
            value={state.currentScore} 
            variant="default" 
          />
          <ScoreBox 
            label="ATS" 
            value={state.scores.ats} 
            variant="ats" 
          />
          <ScoreBox 
            label="Requirements" 
            value={state.scores.requirements} 
            variant="requirements" 
          />
          <ScoreBox 
            label="Competitive" 
            value={state.scores.competitive} 
            variant="competitive" 
          />
        </div>

        {/* Score Projection - Compact */}
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold">{state.currentScore}</span>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
            <span className="text-3xl font-bold text-primary">{potentialScore}</span>
          </div>
          <div className="flex-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${potentialScore}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-primary">
            +{potentialScore - state.currentScore} pts possible
          </span>
        </div>

        {/* Gaps List - Clean Format */}
        <div className="space-y-6">
          
          {/* Critical Gaps */}
          {criticalGaps.length > 0 && (
            <GapSection
              title="Critical"
              subtitle="Must fix for interview consideration"
              count={criticalGaps.length}
              severity="critical"
              gaps={criticalGaps}
            />
          )}

          {/* Important Gaps */}
          {importantGaps.length > 0 && (
            <GapSection
              title="Important"
              subtitle="Strong impact on hiring decision"
              count={importantGaps.length}
              severity="important"
              gaps={importantGaps}
            />
          )}

          {/* Nice to Have */}
          {niceToHaveGaps.length > 0 && (
            <GapSection
              title="Nice to Have"
              subtitle="Differentiates top candidates"
              count={niceToHaveGaps.length}
              severity="nice-to-have"
              gaps={niceToHaveGaps}
            />
          )}
        </div>

        {/* Quick Wins - Simple List */}
        {state.quickWins.length > 0 && (
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-semibold">Quick Wins</span>
            </div>
            <ul className="space-y-2">
              {state.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Single CTA */}
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={onNext} className="gap-2">
            Start Building My Benchmark Resume
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Sub-components - Clean, Minimal
============================================ */

function ScoreBox({ 
  label, 
  value, 
  variant 
}: { 
  label: string; 
  value: number; 
  variant: 'default' | 'ats' | 'requirements' | 'competitive';
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="p-3 rounded-lg border bg-card text-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${variant === 'default' ? '' : getScoreColor(value)}`}>
        {value}
      </p>
    </div>
  );
}

function GapSection({
  title,
  subtitle,
  count,
  severity,
  gaps
}: {
  title: string;
  subtitle: string;
  count: number;
  severity: 'critical' | 'important' | 'nice-to-have';
  gaps: Gap[];
}) {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
          border: 'border-l-red-500',
          icon: <AlertCircle className="h-4 w-4" />
        };
      case 'important':
        return {
          badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          border: 'border-l-amber-500',
          icon: <AlertTriangle className="h-4 w-4" />
        };
      default:
        return {
          badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          border: 'border-l-blue-500',
          icon: <Info className="h-4 w-4" />
        };
    }
  };

  const styles = getSeverityStyles();

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium ${styles.badge}`}>
          {styles.icon}
          {title} ({count})
        </span>
        <span className="text-sm text-muted-foreground">{subtitle}</span>
      </div>

      {/* Gap Items */}
      <div className="space-y-2">
        {gaps.map((gap) => (
          <GapItem key={gap.id} gap={gap} borderClass={styles.border} />
        ))}
      </div>
    </div>
  );
}

function GapItem({ 
  gap, 
  borderClass 
}: { 
  gap: Gap; 
  borderClass: string;
}) {
  return (
    <div className={`p-4 rounded-lg border bg-card border-l-4 ${borderClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className="text-xs">
              {gap.category}
            </Badge>
            <span className="text-xs text-green-600 font-medium">
              {gap.impact}
            </span>
          </div>
          <p className="font-medium text-sm">{gap.issue}</p>
          <p className="text-sm text-muted-foreground mt-1">{gap.fix}</p>
        </div>
      </div>
    </div>
  );
}

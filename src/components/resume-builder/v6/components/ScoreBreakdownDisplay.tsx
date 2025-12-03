/**
 * ScoreBreakdownDisplay - Visual breakdown of resume scoring dimensions
 */

import { cn } from '@/lib/utils';
import { Target, FileCheck, Trophy, MessageSquare, Loader2 } from 'lucide-react';

interface ScoreBreakdown {
  overall: number;
  ats: number;
  requirements: number;
  competitive: number;
  humanVoice: number;
}

interface ScoreBreakdownDisplayProps {
  breakdown: ScoreBreakdown | null;
  isLoading?: boolean;
  compact?: boolean;
}

const SCORE_DIMENSIONS = [
  { key: 'ats', label: 'ATS Match', icon: FileCheck, color: 'text-blue-500', bgColor: 'bg-blue-500' },
  { key: 'requirements', label: 'Requirements', icon: Target, color: 'text-green-500', bgColor: 'bg-green-500' },
  { key: 'competitive', label: 'Competitive', icon: Trophy, color: 'text-amber-500', bgColor: 'bg-amber-500' },
  { key: 'humanVoice', label: 'Authenticity', icon: MessageSquare, color: 'text-purple-500', bgColor: 'bg-purple-500' }
] as const;

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

export function ScoreBreakdownDisplay({ 
  breakdown, 
  isLoading = false,
  compact = false 
}: ScoreBreakdownDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Analyzing...</span>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        Add content to see score breakdown
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        {SCORE_DIMENSIONS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="flex items-center gap-1">
            <Icon className={cn('h-3 w-3', color)} />
            <span className="text-muted-foreground">{label}:</span>
            <span className={cn('font-medium', getScoreColor(breakdown[key as keyof ScoreBreakdown] as number))}>
              {breakdown[key as keyof ScoreBreakdown]}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Overall Score */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <span className="font-medium">Overall Score</span>
        <span className={cn('text-2xl font-bold', getScoreColor(breakdown.overall))}>
          {breakdown.overall}
        </span>
      </div>

      {/* Individual Dimensions */}
      <div className="grid grid-cols-2 gap-2">
        {SCORE_DIMENSIONS.map(({ key, label, icon: Icon, color, bgColor }) => {
          const score = breakdown[key as keyof ScoreBreakdown] as number;
          return (
            <div key={key} className="p-2 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn('h-4 w-4', color)} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div 
                    className={cn('h-full rounded-full transition-all duration-500', bgColor)}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={cn('text-sm font-medium min-w-[2rem]', getScoreColor(score))}>
                  {score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

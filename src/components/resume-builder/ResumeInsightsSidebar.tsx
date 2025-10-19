import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeInsightsSidebarProps {
  atsScore: number;
  requirementCoverage: number;
}

export const ResumeInsightsSidebar: React.FC<ResumeInsightsSidebarProps> = ({
  atsScore,
  requirementCoverage,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      {/* ATS Score */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="h-4 w-4" />
            ATS Score
          </h3>
          <Badge className={cn('text-lg font-bold', getScoreBg(atsScore))}>
            {atsScore}%
          </Badge>
        </div>
        <Progress value={atsScore} className="mb-2" />
        <p className="text-xs text-muted-foreground">
          {atsScore >= 80
            ? 'Excellent! Resume is highly optimized'
            : atsScore >= 60
            ? 'Good, but room for improvement'
            : 'Needs optimization for ATS systems'}
        </p>
      </Card>

      {/* Requirement Coverage */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Coverage
          </h3>
          <span className={cn('text-lg font-bold', getScoreColor(requirementCoverage))}>
            {requirementCoverage}%
          </span>
        </div>
        <Progress value={requirementCoverage} className="mb-2" />
        <p className="text-xs text-muted-foreground">
          Job requirements matched
        </p>
      </Card>

      {/* Top Issues */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Top Issues
        </h3>
        <div className="space-y-2 text-xs">
          {atsScore < 80 && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0" />
              <p>Add more keywords from job description</p>
            </div>
          )}
          {requirementCoverage < 70 && (
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              <p>Missing key requirements - check Career Vault</p>
            </div>
          )}
          {atsScore >= 80 && requirementCoverage >= 70 && (
            <p className="text-muted-foreground italic">
              Looking great! No major issues detected.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

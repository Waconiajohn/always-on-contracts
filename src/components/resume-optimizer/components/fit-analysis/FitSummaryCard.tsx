import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FitSummaryCardProps } from './types';

export function FitSummaryCard({
  overallFitScore,
  requirementsCount,
  evidenceCount,
  highlyQualifiedCount,
  partiallyQualifiedCount,
  experienceGapsCount
}: FitSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fit Blueprint Complete</CardTitle>
            <CardDescription>
              Analyzed {requirementsCount} requirements against {evidenceCount} evidence points
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{overallFitScore}%</div>
            <div className="text-xs text-muted-foreground">Overall Fit</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Fit Score</span>
            <span>{overallFitScore}%</span>
          </div>
          <Progress value={overallFitScore} className="h-2" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-2xl font-bold text-emerald-700">{highlyQualifiedCount}</div>
            <div className="text-xs text-emerald-600">Highly Qualified</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-2xl font-bold text-amber-700">{partiallyQualifiedCount}</div>
            <div className="text-xs text-amber-600">Partially Qualified</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="text-2xl font-bold text-red-700">{experienceGapsCount}</div>
            <div className="text-xs text-red-600">Experience Gaps</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

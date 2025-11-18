import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp } from 'lucide-react';

interface BenchmarkComparisonPanelProps {
  sectionTitle: string;
  current: number;
  target: number;
  percentage: number;
}

export function BenchmarkComparisonPanel({
  sectionTitle,
  current,
  target,
  percentage
}: BenchmarkComparisonPanelProps) {
  const gap = target - current;
  const status = percentage >= 100 ? 'complete' : percentage >= 75 ? 'excellent' : percentage >= 50 ? 'good' : 'needs_work';

  const statusColors = {
    complete: 'text-green-600',
    excellent: 'text-blue-600',
    good: 'text-yellow-600',
    needs_work: 'text-orange-600'
  };

  const statusMessages = {
    complete: 'Exceeds Benchmark! 🎉',
    excellent: 'Nearly There!',
    good: 'Making Progress',
    needs_work: 'Getting Started'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Benchmark Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className={`font-bold ${statusColors[status]}`}>
              {percentage}%
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            {statusMessages[status]}
          </p>
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-primary">{current}</p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-destructive">{gap}</p>
            <p className="text-xs text-muted-foreground">Gap</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-muted-foreground">{target}</p>
            <p className="text-xs text-muted-foreground">Benchmark</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={status === 'complete' ? 'default' : 'secondary'}>
              {status === 'complete' ? (
                <>✓ Complete</>
              ) : (
                <>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {gap} more needed
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Benchmark Description */}
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-1">Benchmark Standard:</p>
          <p className="text-muted-foreground text-xs">
            Top performers in similar roles typically have {target} items in {sectionTitle}.
            You currently have {current} items, putting you at {percentage}% of the benchmark.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

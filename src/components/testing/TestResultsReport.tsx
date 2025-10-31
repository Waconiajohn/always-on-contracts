import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { TestRunSummary } from '@/lib/testing/types';

interface TestResultsReportProps {
  summary: TestRunSummary;
  showDetails?: boolean;
}

export function TestResultsReport({ summary, showDetails = true }: TestResultsReportProps) {
  const passRate = summary.totalTests > 0
    ? (summary.passedTests / summary.totalTests) * 100
    : 0;

  const getStatusColor = () => {
    if (passRate === 100) return 'text-green-600';
    if (passRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = () => {
    if (passRate === 100) return <Badge variant="default" className="bg-green-600">All Passed</Badge>;
    if (passRate >= 80) return <Badge variant="default" className="bg-yellow-600">Needs Attention</Badge>;
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Test Results: {summary.suiteName}</CardTitle>
            <CardDescription>
              {summary.completedAt
                ? `Completed ${new Date(summary.completedAt).toLocaleString()}`
                : 'In Progress'}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Passed</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {summary.passedTests}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span>Failed</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {summary.failedTests}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              <span>Skipped</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.skippedTests}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Duration</span>
            </div>
            <div className="text-2xl font-bold">
              {(summary.duration / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Pass Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pass Rate</span>
            <span className={`font-bold ${getStatusColor()}`}>
              {passRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={passRate} className="h-2" />
        </div>

        {/* Details Section */}
        {showDetails && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-sm">Test Breakdown</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Total Tests:</span>
                <span className="font-medium">{summary.totalTests}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Success Rate:</span>
                <span className="font-medium">{passRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Average Duration:</span>
                <span className="font-medium">
                  {summary.totalTests > 0 
                    ? ((summary.duration / summary.totalTests) / 1000).toFixed(2)
                    : 0}s per test
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

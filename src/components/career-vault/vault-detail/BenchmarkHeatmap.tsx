import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SectionStatus {
  name: string;
  current: number;
  target: number;
  percentage: number;
}

interface BenchmarkHeatmapProps {
  sections: SectionStatus[];
}

export function BenchmarkHeatmap({ sections }: BenchmarkHeatmapProps) {
  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600 bg-green-500/10';
    if (percentage >= 75) return 'text-blue-600 bg-blue-500/10';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-500/10';
    return 'text-orange-600 bg-orange-500/10';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <TrendingUp className="h-4 w-4" />;
    if (percentage >= 75) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Exceeds';
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 50) return 'Good';
    return 'Needs Work';
  };

  const overallPercentage = Math.round(
    sections.reduce((sum, s) => sum + s.percentage, 0) / sections.length
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Vault Health Heatmap</CardTitle>
          <Badge variant="outline" className={getStatusColor(overallPercentage)}>
            {overallPercentage}% Overall
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Compare your progress across all sections
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{section.name}</span>
                {getStatusIcon(section.percentage)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {section.current}/{section.target}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs ${getStatusColor(section.percentage)}`}
                >
                  {section.percentage}%
                </Badge>
              </div>
            </div>
            <div className="relative">
              <Progress
                value={section.percentage}
                className={`h-2 ${section.percentage >= 100 ? '[&>div]:bg-green-500' : section.percentage >= 75 ? '[&>div]:bg-blue-500' : section.percentage >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-orange-500'}`}
              />
              {section.percentage >= 100 && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">✓</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Status: {getStatusText(section.percentage)}
            </p>
          </div>
        ))}

        <div className="pt-4 border-t">
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="space-y-1">
              <div className="w-full h-2 bg-orange-500 rounded" />
              <span className="text-muted-foreground">&lt; 50%</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-2 bg-yellow-500 rounded" />
              <span className="text-muted-foreground">50-74%</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-2 bg-blue-500 rounded" />
              <span className="text-muted-foreground">75-99%</span>
            </div>
            <div className="space-y-1">
              <div className="w-full h-2 bg-green-500 rounded" />
              <span className="text-muted-foreground">100%+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

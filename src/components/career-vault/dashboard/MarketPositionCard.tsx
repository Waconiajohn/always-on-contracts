import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Zap } from "lucide-react";

interface MarketPositionCardProps {
  competitivePercentile?: number;
  overallScore?: number;
  targetRole?: string;
  criticalGaps?: Array<{
    category: string;
    severity: string;
    description: string;
    impact: string;
  }>;
  quickWins?: Array<{
    action: string;
    time_estimate: string;
    impact_score: number;
    description: string;
  }>;
}

export function MarketPositionCard({
  competitivePercentile,
  overallScore,
  targetRole = "your target role",
  criticalGaps = [],
  quickWins = [],
}: MarketPositionCardProps) {
  // Calculate position tier
  const getPositionTier = (percentile: number) => {
    if (percentile >= 75) return { label: "Top Tier", color: "text-green-600 dark:text-green-400" };
    if (percentile >= 50) return { label: "Competitive", color: "text-blue-600 dark:text-blue-400" };
    if (percentile >= 25) return { label: "Developing", color: "text-yellow-600 dark:text-yellow-400" };
    return { label: "Building", color: "text-orange-600 dark:text-orange-400" };
  };

  const percentile = competitivePercentile ?? 0;
  const tier = getPositionTier(percentile);

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Market Position
            </CardTitle>
            <CardDescription>
              Your competitive standing for {targetRole}
            </CardDescription>
          </div>
          <Badge variant="secondary" className={tier.color}>
            {tier.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Competitive Percentile */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Competitive Percentile</span>
            <span className="font-semibold">{percentile}%</span>
          </div>
          <Progress value={percentile} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Stronger than {percentile}% of candidates for {targetRole}
          </p>
        </div>

        {/* Overall Vault Score */}
        {overallScore !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Vault Strength</span>
              <span className="font-semibold">{overallScore}/100</span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>
        )}

        {/* Critical Gaps */}
        {criticalGaps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-destructive" />
              <h4 className="font-semibold text-sm">Critical Gaps</h4>
            </div>
            <div className="space-y-2">
              {criticalGaps.slice(0, 3).map((gap, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-muted/50 border border-border/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm capitalize">
                      {gap.category.replace(/_/g, ' ')}
                    </p>
                    <Badge
                      variant={gap.severity === 'critical' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {gap.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{gap.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {quickWins.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">Quick Wins</h4>
            </div>
            <div className="space-y-2">
              {quickWins.slice(0, 3).map((win, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{win.action}</p>
                    <Badge variant="outline" className="text-xs">
                      {win.time_estimate}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={win.impact_score * 10} className="h-1 flex-1" />
                    <span className="text-xs text-muted-foreground">
                      +{win.impact_score} impact
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{win.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {criticalGaps.length === 0 && quickWins.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Complete your vault to see market insights</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

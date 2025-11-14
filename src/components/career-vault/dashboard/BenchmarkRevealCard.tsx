import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Target, Zap } from "lucide-react";

interface BenchmarkRevealCardProps {
  role: string;
  level: string;
  industry: string;
  overallTarget: number;
  overallCurrent: number;
  criticalGaps: string[];
  quickWins: string[];
  estimatedTime: string;
  onStart: () => void;
}

export const BenchmarkRevealCard = ({
  role,
  level,
  industry,
  overallTarget,
  overallCurrent,
  criticalGaps,
  quickWins,
  estimatedTime,
  onStart
}: BenchmarkRevealCardProps) => {
  const gap = overallTarget - overallCurrent;

  return (
    <Card className="border-2 border-primary bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="pt-6 space-y-6">
        <div className="text-center space-y-2">
          <Award className="h-12 w-12 text-primary mx-auto" />
          <h2 className="text-3xl font-bold">Your Benchmark is Ready!</h2>
          <p className="text-muted-foreground">
            Based on: <span className="font-medium">{level} {role}</span> in <span className="font-medium">{industry}</span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{overallTarget}</div>
            <p className="text-sm text-muted-foreground">Target Score</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">{overallCurrent}</div>
            <p className="text-sm text-muted-foreground">Current Score</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning">{gap}</div>
            <p className="text-sm text-muted-foreground">Gap to Close</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-destructive" />
              <h3 className="font-semibold">Critical Gaps</h3>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {criticalGaps.slice(0, 3).map((gap, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>
                  {gap}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-success" />
              <h3 className="font-semibold">Quick Wins</h3>
              <Badge variant="outline" className="text-xs">Start Here</Badge>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {quickWins.slice(0, 3).map((win, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-success mt-1">•</span>
                  {win}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Estimated Time to Benchmark</span>
            </div>
            <span className="text-sm font-bold">{estimatedTime}</span>
          </div>
        </div>

        <Button size="lg" className="w-full" onClick={onStart}>
          Start Building Your Vault →
        </Button>
      </CardContent>
    </Card>
  );
};
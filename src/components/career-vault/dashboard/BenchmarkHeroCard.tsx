import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Award, Zap } from "lucide-react";

interface BenchmarkHeroCardProps {
  current: number;
  target: number;
  percentage: number;
  status: string;
  nextMilestone?: string;
  level?: string;
  role?: string;
}

export const BenchmarkHeroCard = ({
  current,
  target,
  percentage,
  status,
  nextMilestone,
  level,
  role
}: BenchmarkHeroCardProps) => {
  const getStatusColor = () => {
    if (percentage >= 85) return "text-success";
    if (percentage >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  const getStatusIcon = () => {
    if (percentage >= 85) return <Award className="h-5 w-5" />;
    if (percentage >= 60) return <TrendingUp className="h-5 w-5" />;
    return <Target className="h-5 w-5" />;
  };

  const getStatusMessage = () => {
    if (percentage >= 85) return "Market Ready";
    if (percentage >= 60) return "Optimizing";
    return "Building";
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Your Career Vault</h2>
              <Badge variant={percentage >= 85 ? "default" : "outline"} className={getStatusColor()}>
                <span className="flex items-center gap-1">
                  {getStatusIcon()}
                  {getStatusMessage()}
                </span>
              </Badge>
            </div>
            {role && level && (
              <p className="text-sm text-muted-foreground">
                {level} {role}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{current}</div>
            <div className="text-sm text-muted-foreground">/ {target} points</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={percentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{percentage}% to benchmark</span>
            <span className="font-medium">{target - current} points needed</span>
          </div>
        </div>

        {nextMilestone && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Next Milestone</p>
                <p className="text-sm text-muted-foreground">{nextMilestone}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-4">{status}</p>
      </CardContent>
    </Card>
  );
};
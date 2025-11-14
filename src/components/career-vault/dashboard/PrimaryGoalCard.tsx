import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Clock } from "lucide-react";

interface PrimaryGoalCardProps {
  goal: string;
  impact: string;
  scoreGain: number;
  newScore: number;
  targetScore: number;
  estimatedTime: string;
  onStart: () => void;
}

export const PrimaryGoalCard = ({
  goal,
  impact,
  scoreGain,
  newScore,
  targetScore,
  estimatedTime,
  onStart
}: PrimaryGoalCardProps) => {
  const newPercentage = Math.round((newScore / targetScore) * 100);

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Your Primary Goal</h3>
            </div>
            
            <div>
              <p className="text-xl font-semibold mb-1">{goal}</p>
              <p className="text-sm text-muted-foreground">{impact}</p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="font-medium text-success">+{scoreGain} points</span>
                <span className="text-muted-foreground">→ {newScore}/{targetScore} ({newPercentage}%)</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{estimatedTime}</span>
              </div>
            </div>
          </div>

          <Button size="lg" onClick={onStart} className="shrink-0">
            Start Now →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
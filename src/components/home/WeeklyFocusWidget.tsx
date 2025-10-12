import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Flame } from "lucide-react";

export const WeeklyFocusWidget = () => {
  // Mock data - in production, fetch from user progress
  const weeklyGoal = 10;
  const completed = 6;
  const streak = 3;
  const percentage = (completed / weeklyGoal) * 100;
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="glass">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Weekly Focus
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                className="text-muted/30"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-accent transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{completed}/{weeklyGoal}</span>
            </div>
          </div>
          
          <div className="flex-1 ml-4">
            <p className="text-xs font-medium mb-1">Applications sent</p>
            <Badge variant="secondary" className="mb-2">
              <Flame className="h-3 w-3 mr-1 text-accent" />
              {streak} day streak
            </Badge>
            <p className="text-xs text-muted-foreground">Keep it going!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

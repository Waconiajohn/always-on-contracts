import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Bot, Briefcase, Zap, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const QuickLaunchWidget = () => {
  const navigate = useNavigate();

  const quickActions = [
    { icon: FileText, label: "Resume", path: "/resume-optimizer", color: "text-ai-primary" },
    { icon: Search, label: "Search", path: "/agents/job-search", color: "text-ai-secondary" },
    { icon: Bot, label: "AI Coach", path: "/coaching", color: "text-ai-complete" },
    { icon: Briefcase, label: "Jobs", path: "/job-search", color: "text-ai-active" },
  ];

  // Mock weekly goal data
  const weeklyGoal = 10;
  const completed = 6;
  const streak = 3;
  const percentage = (completed / weeklyGoal) * 100;

  return (
    <Card className="glass border-ai-primary/20">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-ai-primary" />
            Quick Actions
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <TooltipProvider>
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col gap-1 hover:border-ai-primary/50 hover:shadow-ai-subtle transition-all"
                      onClick={() => navigate(action.path)}
                    >
                      <Icon className={`h-5 w-5 ${action.color}`} />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to {action.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Weekly Goal Progress */}
        <div className="pt-3 border-t border-border/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Weekly Goal</span>
            <span className="font-semibold">{completed}/{weeklyGoal}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="bg-ai-primary h-full transition-all duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {/* Streak */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="secondary" className="text-[10px] bg-ai-processing/10 text-ai-processing border-ai-processing/20">
              <Flame className="h-2.5 w-2.5 mr-1" />
              {streak}-day streak
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

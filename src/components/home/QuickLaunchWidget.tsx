import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Search, Bot, Briefcase } from "lucide-react";
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
    { icon: FileText, label: "Resume", path: "/resume-optimizer", color: "text-primary" },
    { icon: Search, label: "Search", path: "/agents/job-search", color: "text-accent" },
    { icon: Bot, label: "AI Coach", path: "/coaching", color: "text-purple-500" },
    { icon: Briefcase, label: "Jobs", path: "/opportunities", color: "text-green-500" },
  ];

  return (
    <Card className="glass">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Quick Launch</h3>
        
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
                      className="h-16 flex-col gap-1 hover:border-primary/50 transition-all"
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
      </CardContent>
    </Card>
  );
};

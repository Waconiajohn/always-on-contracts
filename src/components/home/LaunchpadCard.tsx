import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getSeasonalIconColor } from "@/lib/seasonalColors";

interface LaunchpadCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  progress?: number;
  isLocked?: boolean;
  lockReason?: string;
  isDualAI?: boolean;
  isPlatinum?: boolean;
  order?: number;
}

export const LaunchpadCard = ({
  title,
  description,
  icon: Icon,
  path,
  progress,
  isLocked,
  lockReason,
  isDualAI,
  isPlatinum,
  order,
}: LaunchpadCardProps) => {
  const navigate = useNavigate();
  const iconColor = getSeasonalIconColor(order || 0);

  return (
    <Card
      className={cn(
        "group relative h-full min-h-[220px] transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        isLocked && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Dual-AI Badge */}
      {isDualAI && !isLocked && (
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-gradient-to-r from-primary to-purple-600 text-white border-0 text-xs"
        >
          🤖🤖 Dual-AI
        </Badge>
      )}

      {/* Platinum Badge */}
      {isPlatinum && (
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 text-xs"
        >
          💎 Platinum
        </Badge>
      )}

      {/* Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{lockReason}</p>
          </div>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0">
            <Icon className={cn("h-6 w-6 transition-colors duration-500", iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg mb-1 truncate">{title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && progress > 0 && !isLocked && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Action Button */}
        <div className="mt-auto pt-4">
          <Button
            onClick={() => !isLocked && navigate(path)}
            disabled={isLocked}
            className="w-full"
            variant={progress && progress > 0 ? "default" : "outline"}
          >
            {isLocked ? "Locked" : progress && progress > 0 ? "Continue" : "Start"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

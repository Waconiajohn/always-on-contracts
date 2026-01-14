import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LucideIcon, Lock, Sparkles, Crown } from "lucide-react";
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
  variant?: 'active' | 'preview' | 'unlocked';
  resumeCompletion?: number;
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
  variant = 'active',
  resumeCompletion = 0,
}: LaunchpadCardProps) => {
  const navigate = useNavigate();
  const iconColor = getSeasonalIconColor(order || 0);

  const isPreview = variant === 'preview';
  const isCompact = variant === 'preview' || variant === 'unlocked';
  const showLockOverlay = isLocked && variant === 'active';
  
  // resumeCompletion used in JSX for preview badge
  console.log('Resume completion:', resumeCompletion);

  return (
    <Card
      className={cn(
        "group relative transition-all duration-300",
        isCompact ? "h-full min-h-[160px]" : "h-full min-h-[220px]",
        !isLocked && "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        isLocked && showLockOverlay && "cursor-not-allowed"
      )}
      onClick={() => !isLocked && navigate(path)}
    >
      {/* Preview Badge - shows vault completion for locked preview items */}
      {isPreview && isLocked && (
        <Badge 
          variant="outline" 
          className="absolute top-3 right-3 gap-1 text-xs bg-background/80 backdrop-blur-sm"
        >
          <Lock className="h-3 w-3" />
          Unlocks at 100%
        </Badge>
      )}

      {/* Dual-AI Badge */}
      {!isPreview && isDualAI && !isLocked && (
        <Badge 
          variant="secondary" 
          className="absolute top-3 right-3 bg-gradient-to-r from-primary to-purple-600 text-white border-0 text-xs gap-1"
        >
          <Sparkles className="h-3 w-3" />
          Dual-AI
        </Badge>
      )}

      {/* Platinum Badge */}
      {!isPreview && isPlatinum && (
        <Badge 
          variant="default" 
          className="absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 text-xs gap-1"
        >
          <Crown className="h-3 w-3" />
          Platinum
        </Badge>
      )}

      {/* Lock Overlay - only for active variant */}
      {showLockOverlay && (
        <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center rounded-lg border-2 border-primary/20">
          <div className="text-center p-4 bg-card/95 rounded-lg shadow-xl border border-border">
            <Lock className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-semibold text-foreground">{lockReason}</p>
          </div>
        </div>
      )}

      <div className={cn("flex flex-col h-full", isCompact ? "p-4" : "p-6")}>
        {/* Icon & Title */}
        <div className={cn("flex items-start gap-4", isCompact ? "mb-2" : "mb-4")}>
          <div className="shrink-0">
            <Icon className={cn(
              "transition-colors duration-500", 
              isCompact ? "h-5 w-5" : "h-6 w-6",
              iconColor
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold mb-1 truncate",
              isCompact ? "text-sm" : "text-lg"
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-muted-foreground line-clamp-2",
              isCompact ? "text-xs" : "text-sm"
            )}>
              {description}
            </p>
          </div>
        </div>

        {/* Progress Bar - only for active variant */}
        {progress !== undefined && progress > 0 && !isLocked && variant === 'active' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Progress</span>
              <span className="text-xs font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* Action Button - only for active or unlocked variants */}
        {(variant === 'active' || variant === 'unlocked') && (
          <div className="mt-auto pt-4">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                if (!isLocked) navigate(path);
              }}
              disabled={isLocked}
              className="w-full"
              size={isCompact ? "sm" : "default"}
              variant={progress && progress > 0 ? "default" : "outline"}
            >
              {isLocked ? "Locked" : progress && progress > 0 ? "Continue" : "Start"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

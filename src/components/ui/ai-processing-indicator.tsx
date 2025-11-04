import { Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIProcessingIndicatorProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "inline" | "overlay";
  className?: string;
}

export const AIProcessingIndicator = ({ 
  message = "AI is analyzing...",
  size = "md",
  variant = "inline",
  className 
}: AIProcessingIndicatorProps) => {
  const sizeClasses = {
    sm: "text-xs gap-1.5",
    md: "text-sm gap-2",
    lg: "text-base gap-3"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border rounded-lg p-6 shadow-lg animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
              <Zap className="h-4 w-4 text-primary absolute top-0 right-0 animate-ping" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">AI Processing</p>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
          </div>
          <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary via-primary-glow to-primary animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      <div className="relative flex items-center gap-2">
        <Sparkles className={cn(iconSizes[size], "text-primary animate-pulse")} />
        <span className="text-muted-foreground font-medium">{message}</span>
        <Zap className={cn(iconSizes[size], "text-primary animate-bounce")} />
      </div>
    </div>
  );
};

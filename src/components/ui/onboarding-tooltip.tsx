import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingTooltipProps {
  isOpen: boolean;
  title: string;
  content: string;
  stepIndex: number;
  totalSteps: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  children: React.ReactNode;
}

export const OnboardingTooltip = ({
  isOpen,
  title,
  content,
  stepIndex,
  totalSteps,
  placement = 'bottom',
  onNext,
  onPrevious,
  onSkip,
  children,
}: OnboardingTooltipProps) => {
  return (
    <TooltipProvider>
      <Tooltip open={isOpen}>
        <TooltipTrigger asChild>
          <div className={cn(
            "relative",
            isOpen && "ring-2 ring-primary ring-offset-2 rounded-lg z-50"
          )}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side={placement}
          className="w-80 p-4 bg-card border-2 border-primary/20 shadow-xl"
          sideOffset={12}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1 text-foreground">{title}</h4>
                <p className="text-xs text-muted-foreground">{content}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onSkip}
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 w-6 rounded-full transition-colors",
                      idx === stepIndex ? "bg-primary" : "bg-muted"
                    )}
                  />
                ))}
              </div>

              <div className="flex gap-1">
                {stepIndex > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onPrevious}
                    className="h-7 px-2"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={onNext}
                  className="h-7 px-3 text-xs"
                >
                  {stepIndex === totalSteps - 1 ? "Finish" : "Next"}
                  {stepIndex < totalSteps - 1 && <ChevronRight className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStep {
  id: string;
  label: string;
  completed: boolean;
}

interface WizardProgressIndicatorProps {
  steps: WizardStep[];
  currentStepId: string;
}

export const WizardProgressIndicator = ({ steps, currentStepId }: WizardProgressIndicatorProps) => {
  const currentIndex = steps.findIndex(s => s.id === currentStepId);

  return (
    <div className="w-full bg-muted/30 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStepId;
            const isPast = index < currentIndex;
            const isCompleted = step.completed;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all",
                      isCurrent && "border-primary bg-primary text-primary-foreground",
                      isPast && "border-primary bg-primary/10 text-primary",
                      !isCurrent && !isPast && "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {isCompleted || isPast ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className={cn("h-4 w-4", isCurrent && "fill-current")} />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 text-center font-medium",
                      isCurrent && "text-primary",
                      isPast && "text-muted-foreground",
                      !isCurrent && !isPast && "text-muted-foreground/50"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] mx-2 bg-border">
                    <div
                      className={cn(
                        "h-full transition-all",
                        isPast ? "bg-primary" : "bg-transparent"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

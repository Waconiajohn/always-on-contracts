/**
 * StepIndicator - Visual step progress indicator
 */

import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps<T extends string = string> {
  steps: T[];
  currentStep: T;
  labels: Record<T, string>;
  onStepClick?: (step: T) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  labels,
  onStepClick
}: StepIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="w-full border-b bg-muted/30 py-4 px-6">
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = onStepClick && (isComplete || isCurrent);

          return (
            <div key={step} className="flex items-center">
              {/* Step circle and label */}
              <button
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all",
                  isCurrent && "bg-primary text-primary-foreground",
                  isComplete && "bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer",
                  !isComplete && !isCurrent && "text-muted-foreground"
                )}
              >
                {/* Step number or checkmark */}
                <span className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
                  isCurrent && "bg-primary-foreground/20",
                  isComplete && "bg-green-500/20",
                  !isComplete && !isCurrent && "bg-muted"
                )}>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>
                
                {/* Step label */}
                <span className="text-sm font-medium hidden sm:inline">
                  {labels[step]}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  index < currentIndex ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

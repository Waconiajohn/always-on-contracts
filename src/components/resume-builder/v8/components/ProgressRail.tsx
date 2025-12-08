/**
 * ProgressRail - 4-step visual progress indicator
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { V8_STEPS, V8_STEP_CONFIG, type V8Step } from '../types';

interface ProgressRailProps {
  currentStep: V8Step;
  completedSteps: Set<V8Step>;
  onStepClick: (step: V8Step) => void;
}

export function ProgressRail({ currentStep, completedSteps, onStepClick }: ProgressRailProps) {
  const currentIndex = V8_STEPS.indexOf(currentStep);

  return (
    <div className="flex items-center justify-between">
      {V8_STEPS.map((step, index) => {
        const config = V8_STEP_CONFIG[step];
        const isComplete = completedSteps.has(step);
        const isCurrent = step === currentStep;
        const isPast = index < currentIndex;
        const isClickable = isPast || isComplete;

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Step Circle */}
            <button
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isCurrent && "border-primary bg-primary text-primary-foreground",
                isComplete && !isCurrent && "border-green-500 bg-green-500 text-white",
                !isCurrent && !isComplete && "border-muted-foreground/30 text-muted-foreground",
                isClickable && !isCurrent && "cursor-pointer hover:border-primary/50"
              )}
            >
              {isComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </button>

            {/* Step Label */}
            <div className="ml-3 hidden sm:block">
              <p className={cn(
                "text-sm font-medium",
                isCurrent && "text-foreground",
                !isCurrent && "text-muted-foreground"
              )}>
                {config.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {config.estimatedTime}
              </p>
            </div>

            {/* Connector Line */}
            {index < V8_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-4">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    index < currentIndex ? "bg-green-500" : "bg-muted-foreground/20"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * StepProgress - Minimal step indicator for V7 builder
 */

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { V7_STEP_ORDER, V7_STEP_LABELS, type V7Step } from '../types';

interface StepProgressProps {
  currentStep: V7Step;
  completedSteps: Set<V7Step>;
  onStepClick?: (step: V7Step) => void;
}

export function StepProgress({ currentStep, completedSteps, onStepClick }: StepProgressProps) {
  const currentIndex = V7_STEP_ORDER.indexOf(currentStep);

  return (
    <div className="w-full px-6 py-3 border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        {V7_STEP_ORDER.map((step, index) => {
          const isActive = step === currentStep;
          const isCompleted = completedSteps.has(step);
          const isPast = index < currentIndex;
          const isClickable = isCompleted || isPast;

          return (
            <div key={step} className="flex items-center">
              {/* Step Indicator */}
              <button
                onClick={() => isClickable && onStepClick?.(step)}
                disabled={!isClickable}
                className={cn(
                  "relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && !isActive && "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                  isPast && !isCompleted && !isActive && "bg-muted text-muted-foreground hover:bg-muted/80",
                  !isActive && !isCompleted && !isPast && "text-muted-foreground",
                  isClickable && "cursor-pointer"
                )}
              >
                {isCompleted && !isActive ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold",
                    isActive ? "bg-primary-foreground/20" : "bg-muted"
                  )}>
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{V7_STEP_LABELS[step]}</span>
              </button>

              {/* Connector Line */}
              {index < V7_STEP_ORDER.length - 1 && (
                <div className="w-4 sm:w-8 h-0.5 mx-1 bg-border relative">
                  {(isPast || isCompleted) && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

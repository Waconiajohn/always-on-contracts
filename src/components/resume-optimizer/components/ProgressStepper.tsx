import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { OptimizerStep, STEP_CONFIG } from '../types';

const STEP_ORDER: OptimizerStep[] = [
  'career-profile',
  'gap-analysis',
  'answer-assistant',
  'customization',
  'strategic-versions',
  'hiring-manager'
];

interface ProgressStepperProps {
  currentStep: OptimizerStep;
  className?: string;
}

export function ProgressStepper({ currentStep, className }: ProgressStepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {STEP_ORDER.map((step, index) => {
        const config = STEP_CONFIG[step];
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;
        
        return (
          <div key={step} className="flex items-center flex-1">
            {/* Step indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary bg-primary/10 text-primary',
                  isUpcoming && 'border-muted-foreground/30 text-muted-foreground/50'
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{config.icon}</span>
                )}
              </div>
              <span 
                className={cn(
                  'mt-2 text-xs font-medium max-w-[80px] text-center',
                  isCurrent && 'text-foreground',
                  !isCurrent && 'text-muted-foreground'
                )}
              >
                {config.title.split(' ')[0]}
              </span>
            </div>
            
            {/* Connector line */}
            {index < STEP_ORDER.length - 1 && (
              <div 
                className={cn(
                  'flex-1 h-0.5 mx-2',
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

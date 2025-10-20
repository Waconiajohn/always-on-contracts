import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Brain, Sparkles, User, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationStep {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
}

interface GenerationProgressProps {
  currentStep: number;
  steps: string[];
  isComplete?: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  currentStep,
  steps,
  isComplete = false
}) => {
  const [animatedSteps, setAnimatedSteps] = useState<GenerationStep[]>([]);

  useEffect(() => {
    const stepConfigs = [
      {
        id: 'research',
        icon: Brain,
        label: 'AI Research',
        description: 'Analyzing job description and industry standards'
      },
      {
        id: 'ideal',
        icon: Sparkles,
        label: 'Industry Standard',
        description: 'Generating example based on top performers'
      },
      {
        id: 'personalized',
        icon: User,
        label: 'Your Version',
        description: 'Customizing with your Career Vault data'
      }
    ];

    const newSteps = stepConfigs.map((config, index) => ({
      ...config,
      status: isComplete
        ? 'complete'
        : index < currentStep
        ? 'complete'
        : index === currentStep
        ? 'active'
        : 'pending'
    } as GenerationStep));

    setAnimatedSteps(newSteps);
  }, [currentStep, isComplete]);

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-1">
            {isComplete ? '✨ Generation Complete!' : 'Generating Your Content...'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isComplete
              ? 'Compare both versions below'
              : 'This takes about 15-20 seconds'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="relative space-y-4">
          {animatedSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.status === 'active';
            const isComplete = step.status === 'complete';
            const isPending = step.status === 'pending';

            return (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < animatedSteps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-5 top-10 w-0.5 h-8 transition-all duration-500',
                      isComplete ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}

                {/* Step Content */}
                <div
                  className={cn(
                    'flex items-start gap-4 p-3 rounded-lg transition-all duration-300',
                    isActive && 'bg-primary/10 scale-105',
                    isComplete && 'opacity-90'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
                      isPending && 'bg-muted',
                      isActive && 'bg-primary text-primary-foreground animate-pulse',
                      isComplete && 'bg-success text-success-foreground'
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-5 w-5" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          'font-medium transition-colors',
                          isPending && 'text-muted-foreground',
                          isActive && 'text-primary',
                          isComplete && 'text-success'
                        )}
                      >
                        {step.label}
                      </h4>
                      {isActive && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </div>
                    <p
                      className={cn(
                        'text-sm transition-colors mt-0.5',
                        isPending && 'text-muted-foreground/60',
                        isActive && 'text-muted-foreground',
                        isComplete && 'text-muted-foreground/70'
                      )}
                    >
                      {step.description}
                    </p>

                    {/* Progress bar for active step */}
                    {isActive && (
                      <div className="mt-2 w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full animate-progress-indeterminate" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        {!isComplete && (
          <div className="mt-6 p-3 bg-card rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">💡 Pro Tip:</span> We're analyzing real-time job
              market data to ensure your content matches industry standards and ATS requirements.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

// Add custom animation to globals.css
// @keyframes progress-indeterminate {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(400%); }
// }
// .animate-progress-indeterminate {
//   animation: progress-indeterminate 1.5s ease-in-out infinite;
//   width: 25%;
// }

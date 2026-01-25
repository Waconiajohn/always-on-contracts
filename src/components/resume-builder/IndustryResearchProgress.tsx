import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, Search, Sparkles, FileText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResearchStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'complete';
}

interface IndustryResearchProgressProps {
  steps: ResearchStep[];
  currentStepIndex: number;
  roleTitle: string;
  industry: string;
  seniorityLevel: string;
}

const stepIcons: Record<string, React.ElementType> = {
  research: Search,
  analyze: Sparkles,
  extract: FileText,
  generate: Target,
};

export function IndustryResearchProgress({
  steps,
  currentStepIndex,
  roleTitle,
  industry,
  seniorityLevel,
}: IndustryResearchProgressProps) {
  const progressPercent = steps.length > 0 
    ? Math.round((currentStepIndex / steps.length) * 100)
    : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Researching Industry Standards
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Analyzing best practices for <span className="font-medium">{seniorityLevel} {roleTitle}</span> in <span className="font-medium">{industry}</span>
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((step) => {
            const IconComponent = stepIcons[step.id] || Circle;
            const isActive = step.status === 'active';
            const isComplete = step.status === 'complete';

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  isActive && 'bg-primary/5 border border-primary/20',
                  isComplete && 'opacity-70'
                )}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/50" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <IconComponent className={cn(
                      'h-4 w-4',
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <span className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {step.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight Preview */}
        {currentStepIndex > 0 && (
          <div className="pt-3 border-t border-border/60">
            <p className="text-xs text-muted-foreground text-center italic">
              Discovered {currentStepIndex * 5}+ industry insights so far...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Default research steps (Fix 6: accurate descriptions)
export const defaultResearchSteps: ResearchStep[] = [
  {
    id: 'research',
    label: 'Researching Industry Standards',
    description: 'Analyzing best practices for this role and seniority level',
    status: 'pending',
  },
  {
    id: 'analyze',
    label: 'Extracting Best Practices',
    description: 'Identifying industry-specific language and power phrases',
    status: 'pending',
  },
  {
    id: 'extract',
    label: 'Building Competitive Benchmarks',
    description: 'Determining what top performers demonstrate',
    status: 'pending',
  },
  {
    id: 'generate',
    label: 'Generating Ideal Example',
    description: 'Creating platinum standard content',
    status: 'pending',
  },
];

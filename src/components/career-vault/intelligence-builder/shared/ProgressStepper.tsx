import { CheckCircle2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProgressStepperProps {
  currentPhase: number;
}

const PHASES = [
  { number: 1, name: 'Market Research', description: 'Analyze your resume & market fit' },
  { number: 2, name: 'Work History', description: 'Map your career timeline' },
  { number: 3, name: 'Benchmark', description: 'Understand your gaps' },
  { number: 4, name: 'Intelligence Building', description: 'Fill in missing data' },
  { number: 5, name: 'Vault Library', description: 'Manage your career intelligence' },
];

export const ProgressStepper = ({ currentPhase }: ProgressStepperProps) => {
  const progressPercentage = ((currentPhase - 1) / (PHASES.length - 1)) * 100;
  const currentPhaseInfo = PHASES[currentPhase - 1];

  return (
    <div className="space-y-6">
      {/* Current Phase Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Phase {currentPhase} of {PHASES.length}: {currentPhaseInfo.name}
        </h1>
        <p className="text-lg text-muted-foreground">{currentPhaseInfo.description}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Phase {currentPhase}</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
      </div>

      {/* Phase Indicators */}
      <div className="grid grid-cols-5 gap-2">
        {PHASES.map((phase) => {
          const isComplete = phase.number < currentPhase;
          const isCurrent = phase.number === currentPhase;
          
          return (
            <div 
              key={phase.number}
              className={`flex flex-col items-center text-center p-3 rounded-lg border transition-all ${
                isComplete 
                  ? 'border-primary bg-primary/5' 
                  : isCurrent
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30'
              }`}
            >
              <div className="flex items-center justify-center mb-2">
                {isComplete ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <Circle className={`h-6 w-6 ${isCurrent ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                )}
              </div>
              <span className={`text-xs font-medium ${isCurrent || isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

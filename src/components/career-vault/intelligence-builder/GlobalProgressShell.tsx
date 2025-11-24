import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlobalProgressShellProps {
  currentPhase: number; // 1-5
  totalPhases?: number;
  progressPercentage: number; // 0-100 within current phase
  timeEstimate?: string; // e.g., "~5 minutes left"
  onExit: () => void;
  children: React.ReactNode;
}

const PHASE_LABELS = [
  "Resume Analysis",
  "Work History",
  "Gap Analysis",
  "Fill Gaps",
  "Vault Library"
];

export const GlobalProgressShell = ({
  currentPhase,
  totalPhases = 5,
  progressPercentage,
  timeEstimate,
  onExit,
  children
}: GlobalProgressShellProps) => {
  const overallProgress = ((currentPhase - 1) / totalPhases) * 100 + (progressPercentage / totalPhases);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Progress Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          {/* Top Row: Title + Exit */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Career Intelligence Builder</h1>
              <p className="text-sm text-muted-foreground">
                Building your market-ready career vault
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Exit to Library
            </Button>
          </div>

          {/* Phase Dots */}
          <div className="flex items-center justify-between mb-3">
            {Array.from({ length: totalPhases }).map((_, index) => {
              const phaseNum = index + 1;
              const isActive = phaseNum === currentPhase;
              const isComplete = phaseNum < currentPhase;

              return (
                <div key={phaseNum} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    {/* Dot */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                        isComplete && "bg-primary text-primary-foreground",
                        isActive && "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2",
                        !isComplete && !isActive && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isComplete ? "✓" : phaseNum}
                    </div>
                    {/* Label */}
                    <span
                      className={cn(
                        "text-xs mt-1 font-medium transition-colors",
                        isActive && "text-foreground",
                        !isActive && "text-muted-foreground"
                      )}
                    >
                      {PHASE_LABELS[index]}
                    </span>
                  </div>
                  {/* Connector Line */}
                  {index < totalPhases - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 transition-colors duration-300",
                        isComplete ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Phase {currentPhase} of {totalPhases}: {PHASE_LABELS[currentPhase - 1]}
              </span>
              {timeEstimate && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {timeEstimate}
                </span>
              )}
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
};

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface JourneyProgressProps {
  hasResume: boolean;
  careerDirection: string | null;
  marketResearchCount: number;
  gapAnalysisExists: boolean;
  vaultStrength: number;
}

export function JourneyProgress({
  hasResume,
  careerDirection,
  marketResearchCount,
  gapAnalysisExists,
  vaultStrength,
}: JourneyProgressProps) {
  const steps = [
    {
      label: "Resume Uploaded & Analyzed",
      completed: hasResume,
      detail: hasResume ? "Resume analyzed" : "Resume required",
    },
    {
      label: "Career Direction Set",
      completed: !!careerDirection,
      detail: careerDirection
        ? `${careerDirection === "stay" ? "Staying in current field" : careerDirection === "pivot" ? "Pivoting to new field" : "Exploring options"}`
        : "Not set yet",
    },
    {
      label: "Market Research",
      completed: marketResearchCount > 0,
      detail:
        marketResearchCount > 0
          ? `${marketResearchCount} job postings analyzed`
          : "Pending career direction",
    },
    {
      label: "Gap Analysis",
      completed: gapAnalysisExists,
      detail: gapAnalysisExists ? "Completed" : "Not yet run",
    },
  ];

  const nextStep =
    vaultStrength < 60
      ? "Continue strengthening your vault by answering questions"
      : "Your vault is ready! Go to Job Search to find matching opportunities";

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-background to-primary/5 shadow-sm">
      <CardContent className="py-6 px-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Journey Progress</h3>
            <div className="text-xs font-medium text-primary">
              {steps.filter(s => s.completed).length}/{steps.length} Complete
            </div>
          </div>

          {/* Horizontal Progress Stepper */}
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
            <div 
              className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` }}
            />

            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                    ${step.completed 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30' 
                      : 'bg-muted border-2 border-border'
                    }
                  `}>
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </div>
                    {step.detail && (
                      <div className="text-[10px] text-muted-foreground mt-0.5 max-w-[100px] mx-auto">
                        {step.detail}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Step CTA */}
          <div className="pt-3 border-t border-primary/10 flex items-start gap-3 bg-primary/5 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Next Step</div>
              <div className="text-sm text-muted-foreground mt-0.5">{nextStep}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface JourneyProgressProps {
  careerDirection: string | null;
  marketResearchCount: number;
  gapAnalysisExists: boolean;
  vaultStrength: number;
}

export function JourneyProgress({
  careerDirection,
  marketResearchCount,
  gapAnalysisExists,
  vaultStrength,
}: JourneyProgressProps) {
  const steps = [
    {
      label: "Resume Uploaded & Analyzed",
      completed: true,
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
    <Card className="shadow-sm">
      <CardContent className="py-4 px-4 space-y-3">
        <div className="text-sm font-semibold">Journey Progress</div>
        
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{step.label}</div>
                {step.detail && (
                  <div className="text-xs text-muted-foreground">{step.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-blue-900 dark:text-blue-100">Next Step</div>
            <div className="text-xs text-muted-foreground">{nextStep}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

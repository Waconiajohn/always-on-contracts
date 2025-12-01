import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Zap, FileText, Search, Briefcase, ArrowRight } from "lucide-react";

interface V3QuickActionsCardProps {
  hasScore: boolean;
  hasActiveResume: boolean;
  applicationCount: number;
}

export const V3QuickActionsCard = ({
  hasScore,
  hasActiveResume,
  applicationCount
}: V3QuickActionsCardProps) => {
  const navigate = useNavigate();

  // Determine the recommended action based on user state
  const getRecommendedStep = () => {
    if (!hasScore) return 1; // Score first
    if (!hasActiveResume) return 2; // Build resume
    return 3; // Apply to jobs
  };

  const recommendedStep = getRecommendedStep();

  const steps = [
    {
      step: 1,
      label: "Score",
      title: "Score Your Resume",
      description: "See where you stand in 90 seconds",
      icon: Zap,
      path: "/quick-score",
      complete: hasScore
    },
    {
      step: 2,
      label: "Build",
      title: "Build Must-Interview Resume",
      description: "Tailored for each job you target",
      icon: FileText,
      path: "/agents/resume-builder-wizard",
      complete: hasActiveResume
    },
    {
      step: 3,
      label: "Apply",
      title: "Find & Apply to Jobs",
      description: "Search 50+ job boards instantly",
      icon: Search,
      path: "/job-search",
      complete: applicationCount > 0
    },
    {
      step: 4,
      label: "Win",
      title: "Interview & Negotiate",
      description: "Prep with real interview questions",
      icon: Briefcase,
      path: "/agents/interview-prep",
      complete: false
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          Your Path to Must-Interview
          <span className="text-sm font-normal text-muted-foreground">
            — Score → Build → Apply → Win
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isRecommended = step.step === recommendedStep;
            const isComplete = step.complete;

            return (
              <button
                key={step.step}
                onClick={() => navigate(step.path)}
                className={`
                  relative p-4 rounded-lg text-left transition-all
                  ${isRecommended 
                    ? 'bg-primary/10 border-2 border-primary shadow-sm' 
                    : isComplete 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-muted/50 border border-transparent hover:border-primary/30'
                  }
                `}
              >
                {/* Step indicator */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    text-xs font-medium px-2 py-0.5 rounded-full
                    ${isComplete ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'}
                  `}>
                    {isComplete ? '✓ Done' : `Step ${step.step}`}
                  </span>
                  {isRecommended && (
                    <span className="text-xs font-medium text-primary">Next</span>
                  )}
                </div>

                {/* Icon and title */}
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-5 w-5 ${isRecommended ? 'text-primary' : isComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <span className="font-medium text-sm">{step.label}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {step.description}
                </p>

                {/* Action hint */}
                {isRecommended && (
                  <div className="mt-2 flex items-center text-xs font-medium text-primary">
                    Start here <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

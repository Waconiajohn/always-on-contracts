import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, Search, TrendingUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
  detail?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface LiveAnalysisFeedProps {
  steps: AnalysisStep[];
  className?: string;
}

export const LiveAnalysisFeed = ({ steps, className }: LiveAnalysisFeedProps) => {
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);

  useEffect(() => {
    // Animate steps appearing one by one
    steps.forEach((step, index) => {
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step.id]);
      }, index * 200);
    });
  }, [steps]);

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isVisible = visibleSteps.includes(step.id);

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 transition-all duration-300",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {step.status === 'complete' ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                ) : step.status === 'active' ? (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium",
                    step.status === 'complete' && "text-foreground",
                    step.status === 'active' && "text-primary",
                    step.status === 'pending' && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                {step.detail && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

// Example usage component with realistic analysis steps
interface ResumeAnalysisFeedProps {
  isAnalyzing: boolean;
  itemsExtracted?: number;
  jobsAnalyzed?: number;
}

export const ResumeAnalysisFeed = ({
  isAnalyzing,
  itemsExtracted = 0,
  jobsAnalyzed = 0
}: ResumeAnalysisFeedProps) => {
  const steps: AnalysisStep[] = [
    {
      id: 'parse',
      label: 'Parsing resume',
      status: itemsExtracted > 0 ? 'complete' : isAnalyzing ? 'active' : 'pending',
      detail: itemsExtracted > 0 ? `Extracted ${itemsExtracted} items` : undefined,
      icon: FileText
    },
    {
      id: 'extract',
      label: 'Extracting achievements',
      status: itemsExtracted > 5 ? 'complete' : itemsExtracted > 0 ? 'active' : 'pending',
      detail: itemsExtracted > 5 ? `Found ${itemsExtracted} key achievements` : undefined,
      icon: TrendingUp
    },
    {
      id: 'search',
      label: 'Searching live job market',
      status: jobsAnalyzed > 0 ? 'complete' : itemsExtracted > 5 ? 'active' : 'pending',
      detail: jobsAnalyzed > 0 ? `Analyzed ${jobsAnalyzed} current job postings` : undefined,
      icon: Search
    },
    {
      id: 'compare',
      label: 'Comparing to market expectations',
      status: jobsAnalyzed >= 10 ? 'complete' : jobsAnalyzed > 0 ? 'active' : 'pending',
      detail: jobsAnalyzed >= 10 ? 'Gap analysis complete' : undefined,
      icon: CheckCircle2
    }
  ];

  return <LiveAnalysisFeed steps={steps} />;
};

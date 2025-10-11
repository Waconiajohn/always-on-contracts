import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, Target } from "lucide-react";

type OnboardingStep = 'upload' | 'analyzing' | 'interview' | 'building';

interface ProgressHeaderProps {
  step: OnboardingStep;
  completionPercentage: number;
}

export const ProgressHeader = ({ step, completionPercentage }: ProgressHeaderProps) => {
  return (
    <Card className="p-6 mb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Career Vault Progress</span>
        <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
      </div>
      <Progress value={completionPercentage} className="h-2" />
      <div className="flex gap-2 mt-4">
        <Badge variant={step === 'analyzing' ? 'default' : completionPercentage > 0 ? 'default' : 'outline'}>
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Resume Analyzed
        </Badge>
        <Badge variant={step === 'interview' ? 'default' : completionPercentage >= 100 ? 'default' : 'outline'}>
          <MessageSquare className="w-3 h-3 mr-1" />
          Interview {completionPercentage < 100 ? 'In Progress' : 'Complete'}
        </Badge>
        <Badge variant={step === 'building' ? 'default' : 'outline'}>
          <Target className="w-3 h-3 mr-1" />
          Career Vault Built
        </Badge>
      </div>
    </Card>
  );
};

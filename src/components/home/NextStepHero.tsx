import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NextStepHeroProps {
  vaultCompletion: number;
}

export const NextStepHero = ({ vaultCompletion }: NextStepHeroProps) => {
  const navigate = useNavigate();

  const getNextStep = () => {
    if (vaultCompletion < 100) {
      return {
        title: "Complete Your Career Vault",
        description: "Your Career Vault is the foundation of everything. Complete it to unlock powerful job search tools.",
        action: "Continue Building",
        path: "/career-vault",
        progress: vaultCompletion,
        icon: Target,
      };
    }

    return {
      title: "Start Your Job Search",
      description: "Your Career Vault is complete! Now use it to find perfectly matched opportunities.",
      action: "Search Jobs",
      path: "/job-search",
      progress: 100,
      icon: CheckCircle2,
    };
  };

  const step = getNextStep();
  const Icon = step.icon;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-semibold mb-1">{step.title}</h2>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>

            {step.progress < 100 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{step.progress}%</span>
                </div>
                <Progress value={step.progress} className="h-2" />
              </div>
            )}

            <Button onClick={() => navigate(step.path)} className="gap-2">
              {step.action}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

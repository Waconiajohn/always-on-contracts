import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Target, FileText, Search, Users } from "lucide-react";
import type { JourneyState } from "@/hooks/useJourneyState";

interface NextStepsCardProps {
  journeyState: JourneyState;
}

const stateConfig: Record<JourneyState, {
  title: string;
  description: string;
  steps: Array<{ label: string; icon: any; path: string; primary?: boolean }>;
}> = {
  'getting-started': {
    title: "Get Started",
    description: "Build your Career Vault to unlock all features",
    steps: [
      { label: "Build Career Vault", icon: Target, path: "/career-vault", primary: true },
      { label: "View Example Resume", icon: FileText, path: "/agents/resume-builder" },
    ],
  },
  'building-momentum': {
    title: "Keep Building",
    description: "Complete your vault to unlock AI-powered tools",
    steps: [
      { label: "Continue Interview", icon: Target, path: "/career-vault", primary: true },
      { label: "Preview Features", icon: Search, path: "/ai-agents" },
    ],
  },
  'vault-complete-first-time': {
    title: "Next Steps",
    description: "Your vault is ready. Choose your next action:",
    steps: [
      { label: "Search for Jobs", icon: Search, path: "/job-search", primary: true },
      { label: "Build Resume", icon: FileText, path: "/agents/resume-builder" },
      { label: "Explore AI Agents", icon: Users, path: "/ai-agents" },
    ],
  },
  'actively-deploying': {
    title: "Active Strategy",
    description: "Keep momentum going with these actions",
    steps: [
      { label: "Find More Jobs", icon: Search, path: "/job-search", primary: true },
      { label: "Optimize Resume", icon: FileText, path: "/resume-optimizer" },
      { label: "Network", icon: Users, path: "/agents/networking" },
    ],
  },
  'interview-phase': {
    title: "Interview Focus",
    description: "Prepare for your upcoming interviews",
    steps: [
      { label: "Interview Prep", icon: Target, path: "/agents/interview-prep", primary: true },
      { label: "View Projects", icon: FileText, path: "/projects" },
    ],
  },
};

export const NextStepsCard = ({ journeyState }: NextStepsCardProps) => {
  const navigate = useNavigate();
  const config = stateConfig[journeyState];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {config.title}
          <ArrowRight className="h-5 w-5 text-primary" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
        <div className="space-y-2">
          {config.steps.map((step) => {
            const Icon = step.icon;
            return (
              <Button
                key={step.path}
                variant={step.primary ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => navigate(step.path)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {step.label}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

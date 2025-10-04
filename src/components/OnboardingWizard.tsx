import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Upload, MessageSquare, Target, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  route?: string;
}

export const OnboardingWizard = ({ onClose }: { onClose?: () => void }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Upload Resume",
      description: "Share your most comprehensive resume with us",
      icon: Upload,
      completed: false,
      route: "/agents/corporate-assistant"
    },
    {
      id: 2,
      title: "Meet Your Corporate Assistant",
      description: "AI-powered career strategist to build your War Chest",
      icon: MessageSquare,
      completed: false,
      route: "/agents/corporate-assistant"
    },
    {
      id: 3,
      title: "Complete Career Interview",
      description: "Answer 20-30 questions to expand your War Chest",
      icon: Target,
      completed: false,
      route: "/agents/corporate-assistant"
    },
    {
      id: 4,
      title: "Review Your War Chest",
      description: "See your power phrases, skills, and hidden competencies",
      icon: CheckCircle2,
      completed: false,
      route: "/war-chest-dashboard"
    },
    {
      id: 5,
      title: "Start Applying",
      description: "Build custom resumes and find opportunities",
      icon: Rocket,
      completed: false,
      route: "/agents/resume-builder"
    }
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleStepClick = (step: OnboardingStep) => {
    if (step.route) {
      navigate(step.route);
      if (onClose) onClose();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-8">
      <div className="mb-8 animate-fade-in">
        <h2 className="text-3xl font-bold mb-2">Welcome to CareerIQ</h2>
        <p className="text-muted-foreground text-lg">
          Let's build your Career War Chest - a comprehensive intelligence system of your skills, 
          achievements, and capabilities
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isPast = step.id < currentStep;

          return (
            <div
              key={step.id}
              className={`
                relative p-6 rounded-lg border-2 cursor-pointer transition-all
                ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                ${isPast ? 'opacity-60' : ''}
              `}
              onClick={() => handleStepClick(step)}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full
                  ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                `}>
                  {step.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{step.title}</h3>
                    {isActive && <Badge>Current Step</Badge>}
                    {step.completed && <Badge variant="secondary">Completed</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>

                <div className="flex items-center">
                  {step.completed ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <Circle className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isActive && (
                <div className="mt-4 pt-4 border-t">
                  <Button onClick={() => handleStepClick(step)} className="w-full">
                    {step.id === 1 ? "Get Started" : "Continue"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          What is a War Chest?
        </h3>
        <p className="text-sm text-muted-foreground">
          Your Career War Chest is a living document that captures not just what you've done, 
          but what you're truly capable of. It includes:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
          <li><strong>Power Phrases:</strong> Quantified achievements that prove your impact</li>
          <li><strong>Transferable Skills:</strong> How your experience applies to different roles/technologies</li>
          <li><strong>Hidden Competencies:</strong> Skills you have but might not realize (e.g., Kaizen expertise without Six Sigma certification)</li>
        </ul>
      </div>

      {onClose && (
        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={onClose}>
            Skip Onboarding
          </Button>
        </div>
      )}
    </Card>
  );
};

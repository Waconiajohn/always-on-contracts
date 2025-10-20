/**
 * Lightweight onboarding for Resume Builder
 * Shows tooltips for first-time users explaining key features
 */

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for where to show tooltip
  position: 'top' | 'bottom' | 'left' | 'right';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Resume Builder',
    description: 'We\'ll generate two versions of each section: an industry-standard example and a personalized version using your Career Vault data.',
    target: '.resume-wizard-header',
    position: 'bottom'
  },
  {
    id: 'vault-selection',
    title: 'Select Your Experience',
    description: 'Choose relevant accomplishments and skills from your Career Vault. The AI will use these to personalize your resume content.',
    target: '.vault-matches-section',
    position: 'top'
  },
  {
    id: 'generation-process',
    title: 'Three-Step Generation',
    description: 'Watch as the AI: (1) Researches industry standards, (2) Creates an ideal example, (3) Personalizes it with your data.',
    target: '.generation-progress',
    position: 'bottom'
  },
  {
    id: 'comparison',
    title: 'Compare & Choose',
    description: 'View both versions side-by-side. Choose the one you prefer, or blend them together in the editor.',
    target: '.dual-comparison',
    position: 'top'
  }
];

const STORAGE_KEY = 'resume_builder_onboarding_completed';

export const ResumeBuilderOnboarding = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay before showing to avoid jarring appearance
      setTimeout(() => setIsActive(true), 500);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setDismissed(true);
    setIsActive(false);
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsActive(false);
  };

  if (!isActive || dismissed) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay to dim background */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto" />

      {/* Onboarding Tooltip */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
        <Card className="p-6 max-w-md bg-background border-primary/30 shadow-xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep < ONBOARDING_STEPS.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

/**
 * Reset onboarding for testing
 */
export const resetResumeBuilderOnboarding = () => {
  localStorage.removeItem(STORAGE_KEY);
};

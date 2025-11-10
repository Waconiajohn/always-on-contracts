import { useState, useEffect } from 'react';

export type OnboardingStep = {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

export const useOnboardingTour = (tourId: string, steps: OnboardingStep[]) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`onboarding-tour-${tourId}`);
    if (!hasSeenTour) {
      setIsActive(true);
    }
  }, [tourId]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    localStorage.setItem(`onboarding-tour-${tourId}`, 'completed');
    setIsActive(false);
  };

  const completeTour = () => {
    localStorage.setItem(`onboarding-tour-${tourId}`, 'completed');
    setIsActive(false);
  };

  const resetTour = () => {
    localStorage.removeItem(`onboarding-tour-${tourId}`);
    setCurrentStep(0);
    setIsActive(true);
  };

  return {
    currentStep: steps[currentStep],
    stepIndex: currentStep,
    totalSteps: steps.length,
    isActive,
    nextStep,
    previousStep,
    skipTour,
    completeTour,
    resetTour,
  };
};

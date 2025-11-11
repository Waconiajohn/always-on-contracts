import { useOnboardingTour, OnboardingStep } from '@/hooks/useOnboardingTour';
import { CustomTourTooltip } from './CustomTourTooltip';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const TOUR_STEPS: OnboardingStep[] = [
  {
    id: 'welcome-vault-score',
    target: '.plain-english-hero',
    title: 'Welcome to Your Career Vault! 🎉',
    content: 'Your vault score shows how complete and impactful your career data is. Higher scores = better resumes and job applications.',
    placement: 'bottom'
  },
  {
    id: 'ai-primary-action',
    target: '.ai-primary-action',
    title: 'Your Next Best Move',
    content: 'Our AI analyzed your vault and found the ONE action that will have the biggest impact. Start here!',
    placement: 'bottom'
  },
  {
    id: 'resume-essentials',
    target: '.layer-1-foundations',
    title: 'Your Resume Essentials',
    content: 'These are the building blocks: work experience, skills, and education. Make sure they\'re complete and quantified.',
    placement: 'right'
  },
  {
    id: 'standout-qualities',
    target: '.layer-2-intelligence',
    title: 'What Makes You Stand Out',
    content: 'Leadership stories, strategic thinking, and professional development. These differentiate you from other candidates.',
    placement: 'right'
  },
  {
    id: 'review-items',
    target: '.vault-tabs',
    title: 'Review & Edit Your Items',
    content: 'Click "Items" to see everything we extracted from your resume. Review items marked "Needs Review" to improve your vault score.',
    placement: 'top'
  },
  {
    id: 'complete',
    target: '.plain-english-hero',
    title: 'You\'re All Set! 🚀',
    content: 'Follow the AI guidance to improve your vault. Need help? Look for tooltips throughout the dashboard.',
    placement: 'bottom'
  }
];

export const CareerVaultDashboardTour = () => {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    isActive,
    nextStep: originalNextStep,
    previousStep,
    skipTour: originalSkipTour,
  } = useOnboardingTour('career-vault-dashboard', TOUR_STEPS);

  // Wrap nextStep to add completion feedback
  const nextStep = () => {
    if (stepIndex === totalSteps - 1) {
      // Last step - show completion message
      toast({
        title: "Tour Complete! 🎉",
        description: "You're ready to build your career vault. Need help? Click the Help button.",
      });
    }
    originalNextStep();
  };

  // Wrap skipTour to add feedback
  const skipTour = () => {
    toast({
      title: "Tour Skipped",
      description: "You can restart the tour anytime from the Help menu.",
    });
    originalSkipTour();
  };

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Find target element on step change
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetElement(null);
      setTargetRect(null);
      return;
    }

    const findAndHighlightTarget = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement;
      
      if (!element) {
        console.warn(`Tour target not found: ${currentStep.target}`);
        // Auto-skip to next step if target doesn't exist
        setTimeout(nextStep, 500);
        return;
      }

      setTargetElement(element);
      setTargetRect(element.getBoundingClientRect());

      // Scroll target into view smoothly
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Delay to ensure DOM is ready
    const timer = setTimeout(findAndHighlightTarget, 300);
    return () => clearTimeout(timer);
  }, [currentStep, isActive, nextStep]);

  // Recalculate position on window resize - THROTTLED to prevent vibration
  useEffect(() => {
    if (!targetElement) return;

    let throttleTimer: NodeJS.Timeout | null = null;
    const handleResize = () => {
      if (throttleTimer) return; // Skip if already scheduled
      throttleTimer = setTimeout(() => {
        setTargetRect(targetElement.getBoundingClientRect());
        throttleTimer = null;
      }, 150); // Only update every 150ms max
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true); // Use capture phase
    
    return () => {
      if (throttleTimer) clearTimeout(throttleTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [targetElement]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft' && stepIndex > 0) {
        e.preventDefault();
        previousStep();
      } else if (e.key === 'ArrowRight' && stepIndex < totalSteps - 1) {
        e.preventDefault();
        nextStep();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skipTour, nextStep, previousStep, stepIndex, totalSteps]);

  if (!isActive || !targetElement || !targetRect || !currentStep) return null;

  const isMobile = window.innerWidth < 768;

  return (
    <>
      {/* Overlay to dim background - CLICKABLE to skip tour */}
      <div 
        className={cn(
          "fixed inset-0 z-[60] transition-all duration-300 cursor-pointer",
          "bg-background/30"
        )}
        onClick={skipTour}
        aria-label="Click to skip tour"
        role="button"
        tabIndex={0}
      />

      {/* Highlight ring around target - NO ANIMATION to prevent visual chaos */}
      <div 
        className="fixed z-[60] pointer-events-none ring-2 ring-primary rounded-lg transition-all duration-200"
        style={{
          top: targetRect.top - 4,
          left: targetRect.left - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
        }}
        aria-hidden="true"
      />

      {/* Custom portal-based tooltip with manual positioning */}
      <CustomTourTooltip
        targetRect={targetRect}
        title={currentStep.title}
        content={currentStep.content}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        placement={currentStep.placement || 'bottom'}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTour}
        isMobile={isMobile}
      />
    </>
  );
};

/**
 * Export reset function for manual tour restart
 */
export const resetCareerVaultTour = () => {
  localStorage.removeItem(`onboarding-tour-career-vault-dashboard`);
  window.location.reload();
};

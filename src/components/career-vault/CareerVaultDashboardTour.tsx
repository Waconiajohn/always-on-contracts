import { useOnboardingTour, OnboardingStep } from '@/hooks/useOnboardingTour';
import { OnboardingTooltip } from '@/components/ui/onboarding-tooltip';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
    nextStep,
    previousStep,
    skipTour,
  } = useOnboardingTour('career-vault-dashboard', TOUR_STEPS);

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

  // Recalculate position on window resize
  useEffect(() => {
    if (!targetElement) return;

    const handleResize = () => {
      setTargetRect(targetElement.getBoundingClientRect());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
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
      {/* Overlay to dim background */}
      <div 
        className={cn(
          "fixed inset-0 z-40 pointer-events-none transition-all duration-300",
          isMobile ? "bg-background/40" : "bg-background/60 backdrop-blur-sm"
        )}
        aria-hidden="true"
      />

      {/* Highlight ring around target */}
      <div 
        className="fixed z-50 pointer-events-none ring-4 ring-primary ring-offset-4 rounded-lg transition-all duration-300 animate-pulse-slow"
        style={{
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
        aria-hidden="true"
      />

      {/* Tooltip attached to target - positioned absolutely */}
      <div className="fixed z-50" style={{ top: 0, left: 0 }}>
        <OnboardingTooltip
          isOpen={isActive}
          title={currentStep.title}
          content={currentStep.content}
          stepIndex={stepIndex}
          totalSteps={totalSteps}
          placement={isMobile ? 'bottom' : currentStep.placement || 'bottom'}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipTour}
        >
          <div 
            style={{
              position: 'absolute',
              top: targetRect.top + targetRect.height / 2,
              left: targetRect.left + targetRect.width / 2,
            }}
          />
        </OnboardingTooltip>
      </div>
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

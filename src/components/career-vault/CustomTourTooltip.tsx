import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface CustomTourTooltipProps {
  targetRect: DOMRect;
  title: string;
  content: string;
  stepIndex: number;
  totalSteps: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isMobile: boolean;
}

/**
 * Custom Portal-Based Tour Tooltip
 * 
 * This component uses React portals to render the tooltip directly in document.body,
 * avoiding Radix UI's positioning constraints. It manually calculates the tooltip
 * position based on the target element's bounding rectangle.
 * 
 * Key Features:
 * - Portal-based rendering (bypasses DOM hierarchy)
 * - Manual positioning with screen edge detection
 * - Mobile-responsive placement
 * - Smooth animations
 * - Keyboard accessible
 */
export const CustomTourTooltip = ({
  targetRect,
  title,
  content,
  stepIndex,
  totalSteps,
  placement = 'bottom',
  onNext,
  onPrevious,
  onSkip,
  isMobile,
}: CustomTourTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);

  // Calculate tooltip position - MEMOIZED to prevent excessive recalculations
  useEffect(() => {
    // Round to prevent sub-pixel changes from causing recalc
    const roundedRect = {
      top: Math.round(targetRect.top),
      left: Math.round(targetRect.left),
      bottom: Math.round(targetRect.bottom),
      right: Math.round(targetRect.right),
      width: Math.round(targetRect.width),
      height: Math.round(targetRect.height),
    };

    const tooltipWidth = 320; // w-80 = 20rem = 320px
    const tooltipOffset = 12;
    const edgePadding = 16;

    let top = 0;
    let left = 0;
    let finalPlacement = isMobile ? 'bottom' : placement;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate base position
    switch (finalPlacement) {
      case 'bottom':
        top = roundedRect.bottom + tooltipOffset;
        left = roundedRect.left + roundedRect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = roundedRect.top - tooltipOffset - 200;
        left = roundedRect.left + roundedRect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = roundedRect.top + roundedRect.height / 2 - 100;
        left = roundedRect.left - tooltipWidth - tooltipOffset;
        break;
      case 'right':
        top = roundedRect.top + roundedRect.height / 2 - 100;
        left = roundedRect.right + tooltipOffset;
        break;
    }

    // Edge detection
    if (left < edgePadding) {
      left = edgePadding;
    } else if (left + tooltipWidth > viewportWidth - edgePadding) {
      left = viewportWidth - tooltipWidth - edgePadding;
    }

    if (top < edgePadding) {
      top = roundedRect.bottom + tooltipOffset;
      finalPlacement = 'bottom';
    } else if (top + 200 > viewportHeight - edgePadding) {
      top = roundedRect.top - tooltipOffset - 200;
      finalPlacement = 'top';
    }

    // Round final position to prevent sub-pixel rendering
    setTooltipPosition({ top: Math.round(top), left: Math.round(left) });
    setActualPlacement(finalPlacement);
  }, [targetRect.top, targetRect.left, targetRect.width, targetRect.height, placement, isMobile]);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [stepIndex]);

  // Reset visibility on step change
  useEffect(() => {
    setIsVisible(false);
  }, [stepIndex]);

  return createPortal(
    <div
      className={cn(
        'fixed z-[61] w-80 transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      )}
      style={{
        top: `${tooltipPosition.top}px`,
        left: `${tooltipPosition.left}px`,
      }}
      role="dialog"
      aria-labelledby="tour-tooltip-title"
      aria-describedby="tour-tooltip-content"
      aria-live="polite"
    >
      {/* Tooltip arrow - positioned based on actual placement */}
      <div
        className={cn(
          'absolute w-3 h-3 bg-card border-primary/20 transform rotate-45',
          actualPlacement === 'bottom' && '-top-1.5 left-1/2 -translate-x-1/2 border-t-2 border-l-2',
          actualPlacement === 'top' && '-bottom-1.5 left-1/2 -translate-x-1/2 border-b-2 border-r-2',
          actualPlacement === 'left' && '-right-1.5 top-1/2 -translate-y-1/2 border-t-2 border-r-2',
          actualPlacement === 'right' && '-left-1.5 top-1/2 -translate-y-1/2 border-b-2 border-l-2'
        )}
        aria-hidden="true"
      />

      {/* Tooltip content card */}
      <div className="bg-card border-2 border-primary/20 rounded-lg shadow-2xl p-4">
        <div className="space-y-3">
          {/* Header with title and PROMINENT close button */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                id="tour-tooltip-title"
                className="font-semibold text-base mb-2 text-foreground"
              >
                {title}
              </h4>
              <p
                id="tour-tooltip-content"
                className="text-sm text-foreground/80 leading-relaxed"
              >
                {content}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onSkip}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
              aria-label="Skip tour (ESC)"
              title="Skip tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Footer with progress dots and navigation */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* Progress indicators */}
            <div className="flex gap-1" role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'h-1.5 w-6 rounded-full transition-colors duration-200',
                    idx === stepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-label={idx === stepIndex ? `Step ${idx + 1} of ${totalSteps} (current)` : undefined}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-1">
              {stepIndex > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onPrevious}
                  className="h-7 px-2"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
              )}
              <Button
                size="sm"
                onClick={onNext}
                className="h-7 px-3 text-xs"
                aria-label={stepIndex === totalSteps - 1 ? 'Finish tour' : 'Next step'}
              >
                {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                {stepIndex < totalSteps - 1 && <ChevronRight className="h-3 w-3 ml-1" />}
              </Button>
            </div>
          </div>

          {/* Keyboard hints (only show on desktop) */}
          {!isMobile && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground text-center">
                💡 Use arrow keys to navigate • ESC to skip
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

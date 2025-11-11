import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

export interface Nudge {
  id: string;
  type: 'gentle' | 'helpful' | 'urgent' | 'celebration';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  dismissible: boolean;
  autoShow: boolean;
  showAfterSeconds?: number;
}

interface SmartNudgeProps {
  nudge: Nudge;
  onAction?: (route: string) => void;
  onDismiss?: (nudgeId: string) => void;
}

/**
 * Smart Nudge Component
 *
 * Proactive, context-aware guidance that appears based on user behavior
 *
 * Features:
 * - Non-intrusive (appears in corner, doesn't block content)
 * - Dismissible (user can close gentle nudges)
 * - Actionable (clear CTA when relevant)
 * - Smart timing (appears after delays, not immediately)
 * - Persistent (remembers dismissed nudges)
 *
 * Types:
 * - gentle: Helpful suggestion (dismissible)
 * - helpful: Improvement opportunity (dismissible)
 * - urgent: Important action needed (less dismissible)
 * - celebration: Positive feedback (auto-dismiss after viewing)
 */
export function SmartNudge({ nudge, onAction, onDismiss }: SmartNudgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Show nudge after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, nudge.showAfterSeconds || 0);

    return () => clearTimeout(timer);
  }, [nudge.showAfterSeconds]);

  // Auto-dismiss celebrations after 5 seconds
  useEffect(() => {
    if (nudge.type === 'celebration' && isVisible) {
      const dismissTimer = setTimeout(() => {
        handleDismiss();
      }, 5000);

      return () => clearTimeout(dismissTimer);
    }
  }, [nudge.type, isVisible]);

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.(nudge.id);
    }, 300);
  };

  const handleAction = () => {
    if (nudge.actionRoute) {
      onAction?.(nudge.actionRoute);
      handleDismiss();
    }
  };

  if (!isVisible) return null;

  const getStyles = () => {
    switch (nudge.type) {
      case 'gentle':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: <Sparkles className="h-5 w-5 text-blue-500" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        };
      case 'helpful':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-200 dark:border-amber-800',
          icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        };
      case 'urgent':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30',
        };
      case 'celebration':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          border: 'border-green-200 dark:border-green-800',
          icon: <Sparkles className="h-5 w-5 text-green-500" />,
          iconBg: 'bg-green-100 dark:bg-green-900/30',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          icon: <Sparkles className="h-5 w-5 text-gray-500" />,
          iconBg: 'bg-gray-100 dark:bg-gray-900/30',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-md
        transition-all duration-300 ease-out
        ${isAnimatingOut ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
      role="alert"
      aria-live={nudge.type === 'urgent' ? 'assertive' : 'polite'}
    >
      <Card className={`${styles.bg} ${styles.border} border-2 shadow-lg`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 p-2 rounded-full ${styles.iconBg}`}>
              {styles.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">{nudge.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {nudge.message}
              </p>

              {/* Action button */}
              {nudge.actionLabel && (
                <Button
                  size="sm"
                  onClick={handleAction}
                  className="mt-3"
                >
                  {nudge.actionLabel} →
                </Button>
              )}
            </div>

            {/* Dismiss button */}
            {nudge.dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-6 w-6 -mr-1 -mt-1"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Smart Nudge Generator
 *
 * Analyzes user behavior and vault state to determine which nudges to show
 */
export function generateSmartNudges(context: {
  daysSinceExtraction?: number;
  unverifiedItems: number;
  viewCount: number;
  lastActionDaysAgo: number;
  score: number;
  hasBlockers: boolean;
  hasRecentImprovements: boolean;
  quickWinsAvailable: number;
}): Nudge[] {
  const nudges: Nudge[] = [];

  // URGENT: Blocker preventing applications
  if (context.hasBlockers) {
    nudges.push({
      id: 'urgent_blocker',
      type: 'urgent',
      title: 'Action Required',
      message: 'Your vault has a critical blocker preventing job applications. Fix it now to unlock opportunities.',
      actionLabel: 'Fix blocker',
      actionRoute: '#blockers',
      dismissible: false,
      autoShow: true,
      showAfterSeconds: 2000,
    });
  }

  // HELPFUL: Items need review (after 2 days)
  if (
    context.daysSinceExtraction &&
    context.daysSinceExtraction > 2 &&
    context.unverifiedItems > 20
  ) {
    nudges.push({
      id: 'review_items',
      type: 'helpful',
      title: '10-Minute Review Could Boost Your Score',
      message: `You have ${context.unverifiedItems} AI-extracted items waiting for review. Quick verification could add 10-15 points to your vault score.`,
      actionLabel: 'Start review',
      actionRoute: '#vault-tabs',
      dismissible: true,
      autoShow: true,
      showAfterSeconds: 3000,
    });
  }

  // GENTLE: Viewing vault multiple times without action
  if (context.viewCount > 5 && context.lastActionDaysAgo > 7) {
    nudges.push({
      id: 'inactive_user',
      type: 'gentle',
      title: 'Ready to Take the Next Step?',
      message: `Your vault is ${context.score}% ready. ${context.quickWinsAvailable > 0 ? `${context.quickWinsAvailable} quick improvements available.` : 'Consider adding more quantified achievements.'}`,
      actionLabel: context.quickWinsAvailable > 0 ? 'See quick wins' : 'Improve vault',
      actionRoute: '#vault-tabs',
      dismissible: true,
      autoShow: true,
      showAfterSeconds: 5000,
    });
  }

  // CELEBRATION: Recent improvements
  if (context.hasRecentImprovements) {
    nudges.push({
      id: 'celebration_improvement',
      type: 'celebration',
      title: 'Great Progress! 🎉',
      message: `Your vault score improved! ${context.score >= 80 ? "You're now in the top tier of professionals." : 'Keep building momentum.'}`,
      dismissible: true,
      autoShow: true,
      showAfterSeconds: 1000,
    });
  }

  // GENTLE: Quick wins available (after 4 days)
  if (
    context.daysSinceExtraction &&
    context.daysSinceExtraction > 4 &&
    context.quickWinsAvailable > 0 &&
    context.score < 85
  ) {
    nudges.push({
      id: 'quick_wins',
      type: 'gentle',
      title: 'Low-Effort, High-Impact Improvements',
      message: `${context.quickWinsAvailable} quick wins available. Small tweaks that make a big difference in how your vault ranks.`,
      actionLabel: 'See suggestions',
      actionRoute: '#vault-tabs',
      dismissible: true,
      autoShow: true,
      showAfterSeconds: 6000,
    });
  }

  return nudges;
}

/**
 * Hook for managing smart nudges with localStorage persistence
 */
export function useSmartNudges(context: Parameters<typeof generateSmartNudges>[0]) {
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);

  // Load dismissed nudges from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dismissedNudges');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedNudges(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse dismissed nudges:', e);
      }
    }
  }, []);

  // Generate and show nudges
  useEffect(() => {
    const allNudges = generateSmartNudges(context);

    // Filter out dismissed nudges
    const availableNudges = allNudges.filter(
      (nudge) => !dismissedNudges.has(nudge.id)
    );

    // Show highest priority nudge
    if (availableNudges.length > 0 && !activeNudge) {
      setActiveNudge(availableNudges[0]);
    }
  }, [context, dismissedNudges, activeNudge]);

  const handleDismiss = (nudgeId: string) => {
    const newDismissed = new Set(dismissedNudges);
    newDismissed.add(nudgeId);
    setDismissedNudges(newDismissed);

    // Save to localStorage
    localStorage.setItem('dismissedNudges', JSON.stringify(Array.from(newDismissed)));

    // Clear active nudge
    setActiveNudge(null);
  };

  return {
    activeNudge,
    onDismiss: handleDismiss,
  };
}

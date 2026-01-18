/**
 * AIFeedbackIndicator - Visual feedback for AI actions
 * Shows loading, success, and error states with smooth animations
 */

import { useState, useEffect } from "react";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";

type FeedbackState = 'idle' | 'loading' | 'success' | 'error';

interface AIFeedbackIndicatorProps {
  state: FeedbackState;
  message?: string;
  className?: string;
  onComplete?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function AIFeedbackIndicator({
  state,
  message,
  className,
  onComplete,
  autoHide = true,
  autoHideDelay = 2000,
}: AIFeedbackIndicatorProps) {
  const [isVisible, setIsVisible] = useState(state !== 'idle');

  useEffect(() => {
    if (state === 'idle') {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    if ((state === 'success' || state === 'error') && autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, autoHideDelay);
      return () => clearTimeout(timer);
    }
  }, [state, autoHide, autoHideDelay, onComplete]);

  if (!isVisible) return null;

  const stateConfig = {
    idle: { icon: null, color: '', bgColor: '' },
    loading: { 
      icon: <Loader2 className="h-4 w-4 animate-spin" />, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    success: { 
      icon: <CheckCircle2 className="h-4 w-4" />, 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    error: { 
      icon: <XCircle className="h-4 w-4" />, 
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
  };

  const config = stateConfig[state];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
        "animate-in fade-in slide-in-from-bottom-1",
        config.bgColor,
        config.color,
        className
      )}
    >
      {config.icon}
      {message && <span>{message}</span>}
    </div>
  );
}

/**
 * AIProcessingOverlay - Full overlay for major AI operations
 */
interface AIProcessingOverlayProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  progress?: number;
}

export function AIProcessingOverlay({
  isVisible,
  title = "AI is working...",
  subtitle = "This may take a few seconds",
  progress,
}: AIProcessingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border rounded-xl p-8 shadow-lg max-w-sm mx-4 text-center space-y-4">
        {/* Animated icon */}
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <Brain className="h-8 w-8 text-primary animate-pulse" />
          </div>
        </div>

        {/* Title and subtitle */}
        <div className="space-y-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}

        {/* Sparkles animation */}
        <div className="flex justify-center gap-1">
          <Sparkles className="h-4 w-4 text-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
          <Sparkles className="h-4 w-4 text-primary/70 animate-bounce" style={{ animationDelay: '150ms' }} />
          <Sparkles className="h-4 w-4 text-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * AIActionButton - Button with built-in loading state
 */
interface AIActionButtonProps {
  onClick: () => Promise<void> | void;
  label: string;
  loadingLabel?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default';
  disabled?: boolean;
  className?: string;
}

export function AIActionButton({
  onClick,
  label,
  loadingLabel = 'Processing...',
  icon = <Sparkles className="h-4 w-4" />,
  variant = 'outline',
  size = 'sm',
  disabled = false,
  className,
}: AIActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={cn(
        "inline-flex items-center gap-2 font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        size === 'sm' ? 'h-8 px-3 text-xs rounded-md' : 'h-10 px-4 text-sm rounded-lg',
        variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        <>
          {icon}
          {label}
        </>
      )}
    </button>
  );
}

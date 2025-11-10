import { Brain, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface Category {
  name: string;
  icon?: React.ReactNode;
  status: 'queued' | 'processing' | 'complete';
  progress?: number;
}

interface AIThinkingIndicatorProps {
  categories: Category[];
  currentProgress: number;
  insightsExtracted: number;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
  className?: string;
}

const substatusMessages = [
  '🧠 Analyzing achievement patterns...',
  '💡 Extracting quantified results...',
  '✨ Identifying hidden competencies...',
  '🎯 Mapping transferable skills...',
  '📊 Evaluating leadership indicators...',
  '🔍 Finding power phrases with metrics...',
  '💼 Assessing executive presence...',
  '🌟 Discovering unique differentiators...',
];

export const AIThinkingIndicator = ({
  categories,
  currentProgress,
  insightsExtracted,
  estimatedTimeRemaining,
  onCancel,
  className
}: AIThinkingIndicatorProps) => {
  const [currentMessage, setCurrentMessage] = useState(substatusMessages[0]);

  // Rotate substatus messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => {
        const currentIndex = substatusMessages.indexOf(prev);
        const next = (currentIndex + 1) % substatusMessages.length;
        return substatusMessages[next];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Brain className="h-10 w-10 text-ai-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-ai-active rounded-full animate-ping" />
          </div>
          <h3 className="text-xl font-bold">AI Deep Analysis in Progress</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Analyzing your career data across multiple dimensions
        </p>
      </div>

      {/* Category Progress Cards */}
      <div className="space-y-2">
        {categories.map((category) => (
          <div
            key={category.name}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300',
              category.status === 'processing' 
                ? 'bg-ai-primary/10 border-ai-primary/30 shadow-ai-subtle animate-pulse-subtle' 
                : category.status === 'complete'
                ? 'bg-success/10 border-success/30'
                : 'bg-muted/30 border-border'
            )}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {category.status === 'complete' ? (
                <CheckCircle2 className="h-5 w-5 text-success" />
              ) : category.status === 'processing' ? (
                <Loader2 className="h-5 w-5 text-ai-primary animate-spin" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
              )}
            </div>

            {/* Category Name */}
            <span className={cn(
              'font-medium text-sm flex-1',
              category.status === 'processing' && 'text-ai-primary',
              category.status === 'complete' && 'text-success'
            )}>
              {category.name}
            </span>

            {/* Progress Bar */}
            <div className="flex-1 max-w-[200px]">
              <Progress 
                value={
                  category.status === 'complete' ? 100 :
                  category.status === 'processing' ? (category.progress || 50) :
                  0
                }
                className="h-2"
              />
            </div>

            {/* Percentage */}
            <span className="text-xs font-semibold text-muted-foreground w-12 text-right">
              {category.status === 'complete' ? '100%' :
               category.status === 'processing' ? `${category.progress || 50}%` :
               '0%'}
            </span>
          </div>
        ))}
      </div>

      {/* Live Status */}
      <div className="space-y-3">
        {/* Rotating Substatus */}
        <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-ai-primary/5 via-ai-secondary/5 to-ai-primary/5 rounded-lg border border-ai-primary/20">
          <span className="text-sm font-medium text-ai-primary animate-pulse">
            {currentMessage}
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-ai-primary">{insightsExtracted}</p>
            <p className="text-xs text-muted-foreground">Insights Found</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-ai-secondary">{currentProgress}%</p>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-ai-processing">
              {estimatedTimeRemaining ? `${estimatedTimeRemaining}s` : '30-60s'}
            </p>
            <p className="text-xs text-muted-foreground">Est. Remaining</p>
          </div>
        </div>
      </div>

      {/* Patience Message */}
      <div className="text-center space-y-2">
        <p className="text-xs text-muted-foreground">
          ⏱️ Deep analysis typically takes 30-60 seconds
        </p>
        <p className="text-xs text-muted-foreground italic">
          AI is being thorough to extract maximum career intelligence
        </p>
      </div>

      {/* Cancel Button (Optional) */}
      {onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Cancel Analysis
          </button>
        </div>
      )}
    </div>
  );
};

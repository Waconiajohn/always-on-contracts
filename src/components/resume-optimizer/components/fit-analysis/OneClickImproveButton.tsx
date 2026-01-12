import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Loader2, 
  ChevronRight,
  Wand2,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ImprovementMode = 'quick' | 'deep';

interface OneClickImproveButtonProps {
  bulletText: string;
  requirementText?: string;
  jobDescription?: string;
  onImproved: (newBullet: string, improvements: string[]) => void;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

export function OneClickImproveButton({
  bulletText,
  requirementText,
  jobDescription,
  onImproved,
  variant = 'default',
  className,
}: OneClickImproveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<ImprovementMode>('quick');
  const [showModeSelector, setShowModeSelector] = useState(false);

  const handleImprove = async (selectedMode: ImprovementMode = mode) => {
    setIsLoading(true);
    setShowModeSelector(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-rewrite-bullet', {
        body: {
          originalBullet: bulletText,
          requirementText: requirementText || '',
          jobDescription: jobDescription || '',
          mode: selectedMode,
        }
      });
      
      if (error) throw error;
      
      if (data?.rewrittenBullet) {
        onImproved(data.rewrittenBullet, data.improvements || []);
        toast.success(
          selectedMode === 'quick' 
            ? 'Quick polish applied!' 
            : 'Deep rewrite complete!'
        );
      }
    } catch (err) {
      console.error('Improve error:', err);
      toast.error('Failed to improve bullet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("gap-1.5 h-7 text-xs text-primary hover:bg-primary/10", className)}
        onClick={() => handleImprove('quick')}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Improving...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3" />
            <span>Improve</span>
          </>
        )}
      </Button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        className={cn(
          "inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={() => handleImprove('quick')}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        <span className="underline underline-offset-2">AI Improve</span>
      </button>
    );
  }

  // Default variant with mode selector
  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 transition-all",
            showModeSelector && "rounded-r-none border-r-0"
          )}
          onClick={() => {
            if (showModeSelector) {
              handleImprove();
            } else {
              setShowModeSelector(true);
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Improving...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI Improve</span>
              {!showModeSelector && <ChevronRight className="h-3 w-3 ml-0.5" />}
            </>
          )}
        </Button>

        {showModeSelector && !isLoading && (
          <div className="flex items-center animate-in slide-in-from-left-2 duration-200">
            <Button
              variant={mode === 'quick' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 rounded-none border-r-0"
              onClick={() => {
                setMode('quick');
                handleImprove('quick');
              }}
            >
              <Zap className="h-3 w-3" />
              Quick
            </Button>
            <Button
              variant={mode === 'deep' ? 'default' : 'outline'}
              size="sm"
              className="gap-1 rounded-l-none"
              onClick={() => {
                setMode('deep');
                handleImprove('deep');
              }}
            >
              <Sparkles className="h-3 w-3" />
              Deep
            </Button>
          </div>
        )}
      </div>

      {showModeSelector && !isLoading && (
        <div className="absolute top-full left-0 mt-1 text-xs text-muted-foreground">
          {mode === 'quick' ? 'Light polish & keyword boost' : 'Complete rewrite with new angle'}
        </div>
      )}
    </div>
  );
}

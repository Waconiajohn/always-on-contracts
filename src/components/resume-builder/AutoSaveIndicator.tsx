import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  className?: string;
}

export function AutoSaveIndicator({ status, lastSaved, className }: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" briefly then fade
  useEffect(() => {
    if (status === 'saved') {
      setShowSaved(true);
      const timeout = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const formatLastSaved = (date: Date | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs transition-opacity duration-200',
        status === 'idle' && !showSaved && 'opacity-0',
        className
      )}
    >
      {status === 'saving' && (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}

      {(status === 'saved' || showSaved) && status !== 'saving' && (
        <>
          <Check className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">
            Saved {lastSaved && formatLastSaved(lastSaved)}
          </span>
        </>
      )}

      {status === 'error' && (
        <>
          <CloudOff className="h-3 w-3 text-destructive" />
          <span className="text-destructive">Save failed</span>
        </>
      )}

      {status === 'idle' && !showSaved && lastSaved && (
        <>
          <Cloud className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">
            Last saved {formatLastSaved(lastSaved)}
          </span>
        </>
      )}
    </div>
  );
}

// Hook for auto-save functionality
interface UseAutoSaveOptions {
  content: string;
  onSave: (content: string) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave({ content, onSave, debounceMs = 2000, enabled = true }: UseAutoSaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastContent, setLastContent] = useState(content);

  useEffect(() => {
    if (!enabled || content === lastContent) return;

    setStatus('saving');

    const timeout = setTimeout(async () => {
      try {
        await onSave(content);
        setLastContent(content);
        setLastSaved(new Date());
        setStatus('saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setStatus('error');
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [content, lastContent, onSave, debounceMs, enabled]);

  return { status, lastSaved };
}

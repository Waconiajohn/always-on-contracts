import { useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface KeyboardShortcutsProps {
  onAnalyze: () => void;
  onReset: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts({ onAnalyze, onReset, onExport }: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      if (modKey && e.key === 'Enter') {
        e.preventDefault();
        onAnalyze();
      } else if (modKey && e.key === 'r') {
        e.preventDefault();
        onReset();
      } else if (modKey && e.key === 'e' && onExport) {
        e.preventDefault();
        onExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnalyze, onReset, onExport]);
}

export function KeyboardShortcutsTooltip() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1.5 rounded-md hover:bg-muted transition-colors">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="space-y-1">
            <div><kbd className="px-1 bg-muted rounded">{modKey}+Enter</kbd> Analyze</div>
            <div><kbd className="px-1 bg-muted rounded">{modKey}+R</kbd> Reset</div>
            <div><kbd className="px-1 bg-muted rounded">{modKey}+E</kbd> Export</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

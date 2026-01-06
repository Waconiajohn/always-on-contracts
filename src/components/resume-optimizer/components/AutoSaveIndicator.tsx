import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useOptimizerAutoSave } from '../hooks/useOptimizerAutoSave';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  className?: string;
}

export function AutoSaveIndicator({ className }: AutoSaveIndicatorProps) {
  const { isSaving, formatLastSave } = useOptimizerAutoSave();
  const lastSaveText = formatLastSave();

  return (
    <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Saving...</span>
          </motion.div>
        ) : lastSaveText ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <Cloud className="h-3 w-3" />
            <span>Saved {lastSaveText}</span>
          </motion.div>
        ) : (
          <motion.div
            key="not-saved"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 text-muted-foreground/50"
          >
            <CloudOff className="h-3 w-3" />
            <span>Not saved</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

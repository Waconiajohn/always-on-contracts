import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Loader2, BarChart3, Users, BookOpen } from 'lucide-react';

export interface BulletOption {
  id: string;
  label: string;
  bullet: string;
  emphasis: string;
}

interface BulletOptionsPanelProps {
  options: BulletOption[];
  isLoading: boolean;
  onSelect: (option: BulletOption) => void;
  selectedId?: string;
}

const OPTION_ICONS: Record<string, React.ElementType> = {
  'A': BarChart3,
  'B': Users,
  'C': BookOpen,
};

const OPTION_STYLES: Record<string, { border: string; bg: string; accent: string }> = {
  'A': { 
    border: 'border-primary/30 hover:border-primary/50', 
    bg: 'bg-primary/5 hover:bg-primary/10',
    accent: 'text-primary'
  },
  'B': { 
    border: 'border-muted-foreground/30 hover:border-muted-foreground/50', 
    bg: 'bg-muted/50 hover:bg-muted',
    accent: 'text-muted-foreground'
  },
  'C': { 
    border: 'border-secondary/30 hover:border-secondary/50', 
    bg: 'bg-secondary/20 hover:bg-secondary/30',
    accent: 'text-foreground'
  },
};

export function BulletOptionsPanel({ 
  options, 
  isLoading, 
  onSelect, 
  selectedId 
}: BulletOptionsPanelProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Generating 3 options...</span>
      </div>
    );
  }

  if (!options.length) return null;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Choose your preferred style:
      </p>
      <div className="space-y-2">
        <AnimatePresence>
          {options.map((option, index) => {
            const Icon = OPTION_ICONS[option.id] || BarChart3;
            const styles = OPTION_STYLES[option.id] || OPTION_STYLES['A'];
            const isSelected = selectedId === option.id;

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => onSelect(option)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all",
                    styles.border,
                    styles.bg,
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg bg-background shadow-sm",
                      styles.accent
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono">
                          {option.id}
                        </Badge>
                        <span className={cn("text-sm font-semibold", styles.accent)}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">
                        {option.bullet}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {option.emphasis}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

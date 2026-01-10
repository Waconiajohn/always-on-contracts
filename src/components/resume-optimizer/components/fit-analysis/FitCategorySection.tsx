import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequirementCard } from './RequirementCard';
import { FitCategorySectionProps, CATEGORY_CONFIG, FitCategory } from './types';

// Professional neutral color scheme - no colored backgrounds
const CATEGORY_STYLES: Record<FitCategory, {
  icon: typeof CheckCircle2;
  iconColor: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  badgeText: string;
}> = {
  'HIGHLY QUALIFIED': {
    icon: CheckCircle2,
    iconColor: 'text-primary',
    borderColor: 'border-primary/30',
    headerBg: 'bg-primary/5',
    badgeBg: 'bg-primary/10',
    badgeText: 'text-primary'
  },
  'PARTIALLY QUALIFIED': {
    icon: AlertCircle,
    iconColor: 'text-muted-foreground',
    borderColor: 'border-border',
    headerBg: 'bg-muted/50',
    badgeBg: 'bg-muted',
    badgeText: 'text-muted-foreground'
  },
  'EXPERIENCE GAP': {
    icon: XCircle,
    iconColor: 'text-muted-foreground/70',
    borderColor: 'border-border/50',
    headerBg: 'bg-muted/30',
    badgeBg: 'bg-muted/50',
    badgeText: 'text-muted-foreground'
  }
};

export function FitCategorySection({ 
  category, 
  entries, 
  isExpanded, 
  onToggle,
  getRequirementById,
  getEvidenceById
}: FitCategorySectionProps) {
  const config = CATEGORY_CONFIG[category];
  const styles = CATEGORY_STYLES[category];
  const Icon = styles.icon;
  
  if (entries.length === 0) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Collapsible
        open={isExpanded}
        onOpenChange={onToggle}
        className={cn(
          "rounded-xl border overflow-hidden shadow-sm transition-all",
          styles.borderColor
        )}
      >
        <CollapsibleTrigger 
          asChild
          aria-expanded={isExpanded}
          aria-controls={`category-${category.replace(/\s/g, '-').toLowerCase()}`}
        >
          <div className="cursor-pointer group">
            {/* Clean Header */}
            <div className={cn(
              "relative px-6 py-4 transition-all border-b",
              styles.headerBg,
              "group-hover:bg-muted/60"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg bg-background shadow-sm border", styles.borderColor)}>
                    <Icon className={cn("h-5 w-5", styles.iconColor)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={cn(
                    "text-sm font-semibold px-3 py-1 rounded-full border-0",
                    styles.badgeBg,
                    styles.badgeText
                  )}>
                    {entries.length}
                  </Badge>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-1.5 rounded-md bg-muted/50"
                  >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent id={`category-${category.replace(/\s/g, '-').toLowerCase()}`}>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 space-y-4 bg-background"
              >
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.requirementId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <RequirementCard
                      entry={entry}
                      getRequirementById={getRequirementById}
                      getEvidenceById={getEvidenceById}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

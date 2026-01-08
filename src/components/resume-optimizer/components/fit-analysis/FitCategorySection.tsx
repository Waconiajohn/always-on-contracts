import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, XCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequirementCard } from './RequirementCard';
import { FitCategorySectionProps, CATEGORY_CONFIG, FitCategory } from './types';

const CATEGORY_STYLES: Record<FitCategory, {
  icon: typeof CheckCircle2;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
}> = {
  'HIGHLY QUALIFIED': {
    icon: CheckCircle2,
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-emerald-600',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    badgeText: 'text-emerald-700 dark:text-emerald-300'
  },
  'PARTIALLY QUALIFIED': {
    icon: AlertCircle,
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-600',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/50',
    badgeText: 'text-amber-700 dark:text-amber-300'
  },
  'EXPERIENCE GAP': {
    icon: XCircle,
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-600',
    borderColor: 'border-red-200 dark:border-red-800',
    badgeBg: 'bg-red-100 dark:bg-red-900/50',
    badgeText: 'text-red-700 dark:text-red-300'
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
          "rounded-2xl border-2 overflow-hidden shadow-lg transition-all",
          styles.borderColor
        )}
      >
        <CollapsibleTrigger 
          asChild
          aria-expanded={isExpanded}
          aria-controls={`category-${category.replace(/\s/g, '-').toLowerCase()}`}
        >
          <div className="cursor-pointer group">
            {/* Gradient Header */}
            <div className={cn(
              "relative px-6 py-5 bg-gradient-to-r text-white transition-all",
              styles.gradientFrom,
              styles.gradientTo,
              "group-hover:shadow-md"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{config.title}</h3>
                    <p className="text-white/80 text-sm mt-0.5">{config.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge className={cn(
                    "text-base font-bold px-4 py-1.5 rounded-full",
                    styles.badgeBg,
                    styles.badgeText
                  )}>
                    {entries.length}
                  </Badge>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-2 rounded-lg bg-white/20"
                  >
                    <ChevronDown className="h-5 w-5 text-white" />
                  </motion.div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-4 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <motion.div 
                  className="h-full bg-white/60 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(entries.length / entries.length) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                />
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
                className="p-6 space-y-5 bg-gradient-to-b from-muted/30 to-background"
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

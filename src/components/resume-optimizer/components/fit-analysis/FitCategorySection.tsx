import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RequirementCard } from './RequirementCard';
import { FitCategorySectionProps, CATEGORY_CONFIG, FitCategory } from './types';

const CATEGORY_ICONS: Record<FitCategory, React.ReactNode> = {
  'HIGHLY QUALIFIED': <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
  'PARTIALLY QUALIFIED': <AlertCircle className="h-5 w-5 text-amber-600" />,
  'EXPERIENCE GAP': <XCircle className="h-5 w-5 text-red-600" />
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
  
  if (entries.length === 0) return null;
  
  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      className={cn('rounded-lg border', config.borderClass, config.bgClass)}
    >
      <CollapsibleTrigger 
        asChild
        aria-expanded={isExpanded}
        aria-controls={`category-${category.replace(/\s/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-background/50 transition-colors">
          <div className="flex items-center gap-3">
            {CATEGORY_ICONS[category]}
            <div>
              <h3 className={cn('font-semibold', config.colorClass)}>{config.title}</h3>
              <p className="text-xs text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary">{entries.length}</Badge>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent id={`category-${category.replace(/\s/g, '-').toLowerCase()}`}>
        <div className="p-4 pt-0 space-y-3">
          {entries.map((entry) => (
            <RequirementCard
              key={entry.requirementId}
              entry={entry}
              getRequirementById={getRequirementById}
              getEvidenceById={getEvidenceById}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

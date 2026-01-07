import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { EvidenceTagProps, STRENGTH_COLORS } from './types';

export function EvidenceTag({ evidenceId, getEvidenceById }: EvidenceTagProps) {
  const evidence = getEvidenceById(evidenceId);
  
  if (!evidence) {
    return <Badge variant="outline" className="text-xs">{evidenceId}</Badge>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn("text-xs cursor-help", STRENGTH_COLORS[evidence.strength])}
          >
            {evidenceId}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-1">
            <p className="font-medium text-xs">{evidence.sourceRole}</p>
            <p className="text-xs">{evidence.text}</p>
            <Badge variant="secondary" className="text-xs mt-1">{evidence.strength}</Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

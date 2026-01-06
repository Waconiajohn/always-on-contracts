import { cn } from '@/lib/utils';
import { ConfidenceLevel, CONFIDENCE_CONFIG } from '../types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceIndicator({ level, showLabel = true, className }: ConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[level];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              config.bgColor,
              config.color,
              config.borderColor,
              'cursor-help',
              className
            )}
          >
            <span className="mr-1">{config.icon}</span>
            {showLabel && <span>{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs max-w-[200px]">
            {level === 'very-high' && 'Strong match with clear evidence from your resume'}
            {level === 'high' && 'Good match with relevant experience'}
            {level === 'moderate' && 'Some relevant experience, may need positioning'}
            {level === 'low' && 'Limited match, requires creative positioning'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

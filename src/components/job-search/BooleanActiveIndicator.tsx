import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BooleanActiveIndicatorProps {
  booleanString: string;
  searchName?: string;
  onClear: () => void;
}

export function BooleanActiveIndicator({
  booleanString,
  searchName,
  onClear,
}: BooleanActiveIndicatorProps) {
  // Truncate boolean string for display
  const displayString = booleanString.length > 60 
    ? booleanString.slice(0, 60) + '...' 
    : booleanString;

  return (
    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Badge variant="default" className="flex items-center gap-1 shrink-0">
                <Search className="h-3 w-3" />
                AI Boolean Active
              </Badge>
              {searchName && (
                <span className="text-sm font-medium truncate">
                  {searchName}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-md">
            <p className="text-xs font-mono">{booleanString}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex items-center gap-2 shrink-0">
        <code className="text-xs text-muted-foreground hidden sm:block max-w-[200px] truncate">
          {displayString}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

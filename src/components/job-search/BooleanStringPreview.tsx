import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BooleanStringPreviewProps {
  booleanString: string;
}

export function BooleanStringPreview({ booleanString }: BooleanStringPreviewProps) {
  if (!booleanString) return null;

  // Parse the boolean string into segments
  const parseSegments = (str: string) => {
    const segments: Array<{ text: string; type: 'title' | 'skill' | 'exclude' | 'operator' }> = [];
    
    // Split by operators while preserving them
    const parts = str.split(/(\sAND\s|\sOR\s|\sNOT\s)/gi);
    
    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      
      if (/^(AND|OR|NOT)$/i.test(trimmed)) {
        segments.push({ text: trimmed, type: 'operator' });
      } else if (trimmed.toLowerCase().includes('not ') || trimmed.startsWith('-')) {
        segments.push({ text: trimmed, type: 'exclude' });
      } else if (trimmed.includes('(') || trimmed.includes('"')) {
        // Job titles usually in quotes or parentheses
        segments.push({ text: trimmed, type: 'title' });
      } else {
        segments.push({ text: trimmed, type: 'skill' });
      }
    });
    
    return segments;
  };

  const segments = parseSegments(booleanString);

  const getSegmentColor = (type: string) => {
    switch (type) {
      case 'title': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20';
      case 'skill': return 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20';
      case 'exclude': return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20';
      case 'operator': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted';
    }
  };

  const getTooltipText = (type: string) => {
    switch (type) {
      case 'title': return 'Job title variations to search for';
      case 'skill': return 'Required or preferred skills';
      case 'exclude': return 'Terms to exclude from results';
      case 'operator': return 'Boolean logic operator';
      default: return '';
    }
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span>Boolean String Preview</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {segments.map((segment, idx) => (
            <Tooltip key={idx}>
              <TooltipTrigger asChild>
                <Badge 
                  variant="outline" 
                  className={`${getSegmentColor(segment.type)} cursor-help`}
                >
                  {segment.text}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getTooltipText(segment.type)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20">Title</Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20">Skill</Badge>
          <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20">Exclude</Badge>
        </div>
      </div>
    </Card>
  );
}

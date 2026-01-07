import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { ATSAlignmentCardProps } from './types';

export function ATSAlignmentCard({ atsAlignment }: ATSAlignmentCardProps) {
  const { covered, missingButAddable, missingRequiresExperience } = atsAlignment;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          ATS Keyword Alignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {covered.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-emerald-700 mb-2">✓ Keywords Covered ({covered.length})</h4>
            <div className="flex flex-wrap gap-1">
              {covered.map((item, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700">
                  {item.keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {missingButAddable.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-amber-700 mb-2">⚡ Can Be Added ({missingButAddable.length})</h4>
            <div className="flex flex-wrap gap-1">
              {missingButAddable.map((item, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 cursor-help">
                        {item.keyword}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Add to: {item.whereToAdd}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        
        {missingRequiresExperience.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2">✗ Requires Experience ({missingRequiresExperience.length})</h4>
            <div className="flex flex-wrap gap-1">
              {missingRequiresExperience.map((item, idx) => (
                <TooltipProvider key={idx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700 cursor-help">
                        {item.keyword}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{item.whyGap}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

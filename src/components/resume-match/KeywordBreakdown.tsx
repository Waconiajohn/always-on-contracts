import { Check, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { KeywordMatch, GapAnalysis } from './types';

interface KeywordBreakdownProps {
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  gapAnalysis?: GapAnalysis;
  skillsMatch?: number;
  experienceMatch?: number;
}

export function KeywordBreakdown({
  matchedKeywords,
  missingKeywords,
  gapAnalysis,
  skillsMatch = 0,
  experienceMatch = 0
}: KeywordBreakdownProps) {
  const [showAllMissing, setShowAllMissing] = useState(false);

  // Group keywords by priority
  const criticalMissing = missingKeywords.filter(k => k.priority === 'critical');
  const importantMissing = missingKeywords.filter(k => k.priority === 'important');
  const niceToHaveMissing = missingKeywords.filter(k => k.priority === 'nice_to_have');

  const totalMatch = matchedKeywords.length;
  const totalMissing = missingKeywords.length;
  const matchPercentage = totalMatch + totalMissing > 0 
    ? Math.round((totalMatch / (totalMatch + totalMissing)) * 100) 
    : 0;

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span>Keyword Analysis</span>
          <Badge variant={matchPercentage >= 70 ? 'default' : matchPercentage >= 50 ? 'secondary' : 'destructive'}>
            {matchPercentage}% Match
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score bars */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Skills Match</span>
              <span className="font-medium">{skillsMatch}%</span>
            </div>
            <Progress value={skillsMatch} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Experience Match</span>
              <span className="font-medium">{experienceMatch}%</span>
            </div>
            <Progress value={experienceMatch} className="h-1.5" />
          </div>
        </div>

        {/* Matched Keywords */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto py-2 px-2">
              <span className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  Matched ({totalMatch})
                </span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.map((kw, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    kw.priority === 'critical' && "border-green-500 bg-green-50 dark:bg-green-950",
                    kw.priority === 'important' && "border-green-400 bg-green-50/50 dark:bg-green-950/50"
                  )}
                >
                  <Check className="h-3 w-3 mr-1 text-green-500" />
                  {kw.keyword}
                </Badge>
              ))}
              {matchedKeywords.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No matched keywords yet</p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Missing Keywords - Critical */}
        {criticalMissing.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <X className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700 dark:text-red-400">
                Critical Missing ({criticalMissing.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {criticalMissing.slice(0, showAllMissing ? undefined : 10).map((kw, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs border-red-300 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300"
                >
                  <X className="h-3 w-3 mr-1" />
                  {kw.keyword}
                  {kw.prevalence && (
                    <span className="ml-1 opacity-70">({kw.prevalence})</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Missing Keywords - Important */}
        {importantMissing.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Important Missing ({importantMissing.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {importantMissing.slice(0, showAllMissing ? undefined : 8).map((kw, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs border-amber-300 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                >
                  {kw.keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Nice to have */}
        {niceToHaveMissing.length > 0 && showAllMissing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium">Nice to Have ({niceToHaveMissing.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {niceToHaveMissing.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {kw.keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Show more/less toggle */}
        {(criticalMissing.length > 10 || importantMissing.length > 8 || niceToHaveMissing.length > 0) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAllMissing(!showAllMissing)}
            className="w-full text-xs"
          >
            {showAllMissing ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show All Missing ({totalMissing})
              </>
            )}
          </Button>
        )}

        {/* Gap Summary */}
        {gapAnalysis?.gapSummary && gapAnalysis.gapSummary.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Key Gaps to Address:</p>
            <ul className="space-y-1">
              {gapAnalysis.gapSummary.slice(0, 4).map((gap, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

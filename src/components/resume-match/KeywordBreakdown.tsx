import { Check, X, AlertTriangle, ChevronDown, ChevronUp, Plus, Wand2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { KeywordMatch, GapAnalysis } from './types';

interface KeywordBreakdownProps {
  matchedKeywords: KeywordMatch[];
  missingKeywords: KeywordMatch[];
  gapAnalysis?: GapAnalysis;
  skillsMatch?: number;
  experienceMatch?: number;
  onAddSkill?: (skill: string) => void;
  onGenerateBullet?: (keyword: string) => void;
  isAddingSkill?: boolean;
  isGeneratingBullet?: boolean;
}

export function KeywordBreakdown({
  matchedKeywords,
  missingKeywords,
  gapAnalysis,
  skillsMatch = 0,
  experienceMatch = 0,
  onAddSkill,
  onGenerateBullet,
  isAddingSkill = false,
  isGeneratingBullet = false,
}: KeywordBreakdownProps) {
  const [showAllMissing, setShowAllMissing] = useState(false);
  const [addingKeyword, setAddingKeyword] = useState<string | null>(null);
  const [generatingKeyword, setGeneratingKeyword] = useState<string | null>(null);
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());

  // Group keywords by priority
  const criticalMissing = missingKeywords.filter(k => k.priority === 'critical');
  const importantMissing = missingKeywords.filter(k => k.priority === 'important');
  const niceToHaveMissing = missingKeywords.filter(k => k.priority === 'nice_to_have');

  const totalMatch = matchedKeywords.length;
  const totalMissing = missingKeywords.length;
  const matchPercentage = totalMatch + totalMissing > 0 
    ? Math.round((totalMatch / (totalMatch + totalMissing)) * 100) 
    : 0;

  const handleAddSkill = async (keyword: string) => {
    if (!onAddSkill) return;
    setAddingKeyword(keyword);
    try {
      await onAddSkill(keyword);
      setAddedKeywords(prev => new Set([...prev, keyword]));
    } finally {
      setAddingKeyword(null);
    }
  };

  const handleGenerateBullet = async (keyword: string) => {
    if (!onGenerateBullet) return;
    setGeneratingKeyword(keyword);
    try {
      await onGenerateBullet(keyword);
      setAddedKeywords(prev => new Set([...prev, keyword]));
    } finally {
      setGeneratingKeyword(null);
    }
  };

  const renderKeywordBadge = (kw: KeywordMatch, variant: 'critical' | 'important' | 'nice') => {
    const isAdded = addedKeywords.has(kw.keyword);
    const isAddingThis = addingKeyword === kw.keyword;
    const isGeneratingThis = generatingKeyword === kw.keyword;
    const hasActions = onAddSkill || onGenerateBullet;

    const badgeClasses = {
      critical: "border-red-300 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300",
      important: "border-amber-300 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300",
      nice: "border-border",
    };

    if (isAdded) {
      return (
        <Badge 
          variant="outline" 
          className="text-xs border-green-300 bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300"
        >
          <Check className="h-3 w-3 mr-1" />
          {kw.keyword}
        </Badge>
      );
    }

    return (
      <TooltipProvider key={kw.keyword} delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs group/badge cursor-default transition-all",
                badgeClasses[variant],
                hasActions && "hover:pr-1"
              )}
            >
              {variant === 'critical' && <X className="h-3 w-3 mr-1" />}
              {kw.keyword}
              {kw.prevalence && (
                <span className="ml-1 opacity-70">({kw.prevalence})</span>
              )}
              
              {/* Action buttons - show on hover */}
              {hasActions && (
                <span className="hidden group-hover/badge:inline-flex items-center gap-0.5 ml-1.5">
                  {onAddSkill && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSkill(kw.keyword);
                      }}
                      disabled={isAddingSkill || isAddingThis}
                      title="Add to Skills"
                    >
                      {isAddingThis ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  {onGenerateBullet && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-primary/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateBullet(kw.keyword);
                      }}
                      disabled={isGeneratingBullet || isGeneratingThis}
                      title="Generate bullet point"
                    >
                      {isGeneratingThis ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Wand2 className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs font-medium">{kw.keyword}</p>
            {hasActions && (
              <p className="text-xs text-primary mt-1">
                Click + to add to skills, or ✨ to generate a bullet
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <X className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-700 dark:text-red-400">
                  Critical Missing ({criticalMissing.length})
                </span>
              </div>
              {(onAddSkill || onGenerateBullet) && (
                <span className="text-[10px] text-muted-foreground">
                  Hover for actions
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {criticalMissing.slice(0, showAllMissing ? undefined : 10).map((kw, i) => (
                <span key={i}>{renderKeywordBadge(kw, 'critical')}</span>
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
                <span key={i}>{renderKeywordBadge(kw, 'important')}</span>
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
                <span key={i}>{renderKeywordBadge(kw, 'nice')}</span>
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

        {/* Added keywords summary */}
        {addedKeywords.size > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ {addedKeywords.size} keyword{addedKeywords.size > 1 ? 's' : ''} addressed
            </p>
          </div>
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

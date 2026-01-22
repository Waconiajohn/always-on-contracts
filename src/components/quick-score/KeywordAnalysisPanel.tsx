/**
 * KeywordAnalysisPanel - Visual keyword comparison with pills
 * Shows ALL matched vs missing keywords with frequency counts
 * Click keywords to see context from JD and Resume
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KeywordContextPopover, KeywordWithContext } from './KeywordContextPopover';
interface Keyword {
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  prevalence?: string;
  frequency?: number;
  jdContext?: string;
  resumeContext?: string;
  suggestedPhrasing?: string;
}

interface KeywordAnalysisPanelProps {
  matchedKeywords: Keyword[];
  missingKeywords: Keyword[];
  onAddToResume?: (keyword: KeywordWithContext) => void;
}

export function KeywordAnalysisPanel({
  matchedKeywords = [],
  missingKeywords = [],
  onAddToResume
}: KeywordAnalysisPanelProps) {
  const [hasClickedKeyword, setHasClickedKeyword] = useState(false);
  
  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  const matchPercentage = totalKeywords > 0 
    ? Math.round((matchedKeywords.length / totalKeywords) * 100) 
    : 0;

  // Group missing keywords by priority
  const criticalMissing = missingKeywords.filter(k => k.priority === 'critical');
  const highMissing = missingKeywords.filter(k => k.priority === 'high');
  const mediumMissing = missingKeywords.filter(k => k.priority === 'medium');
  // Check if any keywords have context data
  const hasContextData = matchedKeywords.some(k => k.jdContext || k.resumeContext) ||
                         missingKeywords.some(k => k.jdContext || k.suggestedPhrasing);

  const handleKeywordClick = () => {
    if (!hasClickedKeyword) {
      setHasClickedKeyword(true);
    }
  };

  const renderKeywordBadge = (kw: Keyword, index: number, isMatched: boolean) => {
    const hasContext = kw.jdContext || kw.resumeContext || kw.suggestedPhrasing;
    
    const badge = (
      <Badge 
        variant="outline"
        className={cn(
          "text-xs font-normal transition-all",
          isMatched 
            ? "bg-primary/5 border-primary/20 text-primary" 
            : kw.priority === 'critical'
              ? "bg-destructive/5 border-destructive/20 text-destructive"
              : "bg-muted/50",
          kw.priority === 'critical' && isMatched && "bg-primary/10 border-primary/30",
          hasContext && "cursor-pointer hover:bg-accent hover:border-accent-foreground/20"
        )}
        onClick={hasContext ? handleKeywordClick : undefined}
      >
        {isMatched ? (
          <Check className="h-2.5 w-2.5 mr-1" />
        ) : (
          <X className="h-2.5 w-2.5 mr-1" />
        )}
        {kw.keyword}
        {!isMatched && kw.frequency && (
          <span className="ml-1 opacity-70">({kw.frequency}×)</span>
        )}
      </Badge>
    );

    if (hasContext) {
      return (
        <KeywordContextPopover
          key={index}
          keyword={kw as KeywordWithContext}
          isMatched={isMatched}
          onAddToResume={onAddToResume}
        >
          {badge}
        </KeywordContextPopover>
      );
    }

    return <span key={index}>{badge}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="border border-border rounded-lg bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Keyword Match
          </h3>
          <Badge 
            variant={matchPercentage >= 70 ? 'default' : matchPercentage >= 50 ? 'secondary' : 'outline'}
            className="font-medium"
          >
            {matchedKeywords.length}/{totalKeywords} ({matchPercentage}%)
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {hasContextData && !hasClickedKeyword && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
              <MousePointerClick className="h-3 w-3" />
              <span>Click for context</span>
            </div>
          )}
          {criticalMissing.length > 0 && (
            <div className="flex items-center gap-1 text-destructive text-xs">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{criticalMissing.length} critical missing</span>
            </div>
          )}
        </div>
      </div>

      {/* All Keywords - No slicing, show everything */}
      <div className="p-4 space-y-4">
        {/* Matched Keywords - Show ALL */}
        {matchedKeywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              Matched Keywords ({matchedKeywords.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.map((kw, i) => 
                renderKeywordBadge(kw, i, true)
              )}
            </div>
          </div>
        )}

        {/* Critical Missing - Show ALL */}
        {criticalMissing.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <X className="h-3 w-3 text-destructive" />
              Missing - Critical ({criticalMissing.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {criticalMissing.map((kw, i) => 
                renderKeywordBadge(kw, i, false)
              )}
            </div>
          </div>
        )}

        {/* High Priority Missing - Show ALL */}
        {highMissing.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <X className="h-3 w-3 text-chart-4" />
              Missing - High Priority ({highMissing.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {highMissing.map((kw, i) => 
                renderKeywordBadge(kw, i, false)
              )}
            </div>
          </div>
        )}

        {/* Medium Priority Missing - Show ALL */}
        {mediumMissing.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <X className="h-3 w-3 text-muted-foreground" />
              Missing - Recommended ({mediumMissing.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {mediumMissing.map((kw, i) => 
                renderKeywordBadge(kw, i, false)
              )}
            </div>
          </div>
        )}
      </div>

    </motion.div>
  );
}

/**
 * KeywordAnalysisPanel - Visual keyword comparison with pills
 * Shows matched vs missing keywords with frequency counts
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, Check, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Keyword {
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  prevalence?: string;
  frequency?: number;
  jdContext?: string;
  resumeContext?: string;
}

interface KeywordAnalysisPanelProps {
  matchedKeywords: Keyword[];
  missingKeywords: Keyword[];
}

export function KeywordAnalysisPanel({
  matchedKeywords = [],
  missingKeywords = []
}: KeywordAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  const matchPercentage = totalKeywords > 0 
    ? Math.round((matchedKeywords.length / totalKeywords) * 100) 
    : 0;

  const criticalMissing = missingKeywords.filter(k => k.priority === 'critical');
  const otherMissing = missingKeywords.filter(k => k.priority !== 'critical');

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
        {criticalMissing.length > 0 && (
          <div className="flex items-center gap-1 text-destructive text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{criticalMissing.length} critical missing</span>
          </div>
        )}
      </div>

      {/* Matched Keywords */}
      <div className="p-4 space-y-4">
        {/* Matched */}
        {matchedKeywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3 text-primary" />
              Matched Keywords
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchedKeywords.slice(0, isExpanded ? undefined : 10).map((kw, i) => (
                <Badge 
                  key={i}
                  variant="outline"
                  className={cn(
                    "text-xs font-normal bg-primary/5 border-primary/20 text-primary",
                    kw.priority === 'critical' && "bg-primary/10 border-primary/30"
                  )}
                >
                  <Check className="h-2.5 w-2.5 mr-1" />
                  {kw.keyword}
                </Badge>
              ))}
              {!isExpanded && matchedKeywords.length > 10 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  +{matchedKeywords.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Critical Missing */}
        {criticalMissing.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <X className="h-3 w-3 text-destructive" />
              Missing (Critical)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {criticalMissing.map((kw, i) => (
                <Badge 
                  key={i}
                  variant="outline"
                  className="text-xs font-normal bg-destructive/5 border-destructive/20 text-destructive"
                >
                  <X className="h-2.5 w-2.5 mr-1" />
                  {kw.keyword}
                  {kw.frequency && (
                    <span className="ml-1 text-destructive/70">({kw.frequency}x in JD)</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Other Missing */}
        <AnimatePresence>
          {isExpanded && otherMissing.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <X className="h-3 w-3 text-muted-foreground" />
                Missing (Recommended)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {otherMissing.map((kw, i) => (
                  <Badge 
                    key={i}
                    variant="outline"
                    className="text-xs font-normal bg-muted/50"
                  >
                    {kw.keyword}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expand/Collapse */}
      {(matchedKeywords.length > 10 || otherMissing.length > 0) && (
        <div className="px-4 pb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-muted-foreground hover:text-foreground w-full justify-center gap-1"
          >
            {isExpanded ? 'Show Less' : 'View All Keywords'}
            <ChevronDown className={cn(
              "h-3.5 w-3.5 transition-transform",
              isExpanded && "rotate-180"
            )} />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

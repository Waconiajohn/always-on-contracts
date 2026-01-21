/**
 * QuickScoreKeywords - Visual keyword pills display
 * Dopamine-hit design: immediately visible matched/missing keywords
 */

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeywordItem {
  keyword: string;
  priority: string;
}

interface QuickScoreKeywordsProps {
  matchedKeywords: KeywordItem[];
  missingKeywords: KeywordItem[];
}

const MAX_VISIBLE = 8;

export function QuickScoreKeywords({ matchedKeywords, missingKeywords }: QuickScoreKeywordsProps) {
  const visibleMatched = matchedKeywords.slice(0, MAX_VISIBLE);
  const hiddenMatchedCount = matchedKeywords.length - MAX_VISIBLE;
  
  const visibleMissing = missingKeywords.slice(0, MAX_VISIBLE);
  const hiddenMissingCount = missingKeywords.length - MAX_VISIBLE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="border border-border rounded-lg bg-background p-6 space-y-6"
    >
      {/* Matched Keywords */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Matched
          </span>
          <span className="text-sm font-semibold text-primary">
            ({matchedKeywords.length})
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {visibleMatched.map((kw, i) => (
            <motion.span
              key={kw.keyword}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.03 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                "bg-primary/10 text-primary border border-primary/20"
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              {kw.keyword}
            </motion.span>
          ))}
          {hiddenMatchedCount > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm text-muted-foreground bg-muted">
              +{hiddenMatchedCount} more
            </span>
          )}
          {matchedKeywords.length === 0 && (
            <span className="text-sm text-muted-foreground italic">
              No keywords matched yet
            </span>
          )}
        </div>
      </div>

      {/* Missing Keywords */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Missing
          </span>
          <span className="text-sm font-semibold text-foreground">
            ({missingKeywords.length})
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {visibleMissing.map((kw, i) => (
            <motion.span
              key={kw.keyword}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.03 }}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                kw.priority === 'critical' 
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted text-muted-foreground border border-border"
              )}
            >
              <XCircle className="h-3 w-3" />
              {kw.keyword}
              {kw.priority === 'critical' && (
                <span className="text-[10px] uppercase tracking-wider opacity-70">critical</span>
              )}
            </motion.span>
          ))}
          {hiddenMissingCount > 0 && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm text-muted-foreground bg-muted">
              +{hiddenMissingCount} more
            </span>
          )}
          {missingKeywords.length === 0 && (
            <span className="text-sm text-primary font-medium">
              ✓ All keywords covered!
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

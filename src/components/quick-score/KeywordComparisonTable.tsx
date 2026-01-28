/**
 * KeywordComparisonTable - Two-column comparison view
 * Shows JD requirements vs Resume evidence side-by-side
 * Apple-simple design: subtle borders, clean typography, no shaded pills
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, X, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface KeywordRowData {
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  category?: 'required' | 'preferred' | 'nice-to-have';
  type?: 'technical' | 'domain' | 'leadership' | 'soft' | 'certification' | 'tool';
  isMatched: boolean;
  jdContext?: string;
  resumeContext?: string;
  suggestedPhrasing?: string;
  frequency?: number;
}

interface KeywordComparisonTableProps {
  keywords: KeywordRowData[];
  onAddKeyword?: (keyword: KeywordRowData) => void;
}

// Group keywords by priority
function groupByPriority(keywords: KeywordRowData[]) {
  const critical = keywords.filter(k => k.priority === 'critical' || k.category === 'required');
  const high = keywords.filter(k => k.priority === 'high' && k.category !== 'required');
  const medium = keywords.filter(k => k.priority === 'medium');
  
  return { critical, high, medium };
}

// Priority section component
function PrioritySection({
  title,
  keywords,
  onAddKeyword,
  defaultExpanded = true,
}: {
  title: string;
  keywords: KeywordRowData[];
  onAddKeyword?: (keyword: KeywordRowData) => void;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const matchedCount = keywords.filter(k => k.isMatched).length;

  if (keywords.length === 0) return null;

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {matchedCount}/{keywords.length} matched
        </span>
      </button>

      {/* Keywords */}
      {isExpanded && (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-1/2 text-xs font-medium">JOB DESCRIPTION</TableHead>
              <TableHead className="w-1/2 text-xs font-medium">YOUR RESUME</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.map((kw, index) => (
              <KeywordRow key={`${kw.keyword}-${index}`} keyword={kw} onAdd={onAddKeyword} />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// Individual keyword row
function KeywordRow({
  keyword,
  onAdd,
}: {
  keyword: KeywordRowData;
  onAdd?: (keyword: KeywordRowData) => void;
}) {
  return (
    <TableRow
      className={cn(
        'transition-colors',
        !keyword.isMatched && keyword.priority === 'critical' && 'bg-destructive/5'
      )}
    >
      {/* JD Column */}
      <TableCell className="align-top border-r border-border">
        <div className="flex items-start gap-2">
          {keyword.isMatched ? (
            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          ) : (
            <X className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{keyword.keyword}</span>
              {keyword.priority === 'critical' && (
                <span className="text-[10px] font-medium text-destructive uppercase">Required</span>
              )}
              {keyword.frequency && keyword.frequency > 1 && (
                <span className="text-[10px] text-muted-foreground">
                  ({keyword.frequency}×)
                </span>
              )}
            </div>
            {keyword.jdContext && (
              <p className="mt-1 text-xs text-muted-foreground italic leading-relaxed">
                "{keyword.jdContext}"
              </p>
            )}
          </div>
        </div>
      </TableCell>

      {/* Resume Column */}
      <TableCell className="align-top">
        {keyword.isMatched ? (
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-sm text-primary font-medium">Found</span>
              {keyword.resumeContext && (
                <p className="mt-1 text-xs text-muted-foreground italic leading-relaxed">
                  "{keyword.resumeContext}"
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Not found</span>
            </div>
            {onAdd && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                onClick={() => onAdd(keyword)}
              >
                <Plus className="h-3 w-3" />
                Add
              </Button>
            )}
          </div>
        )}
        {!keyword.isMatched && keyword.suggestedPhrasing && (
          <p className="mt-2 text-xs text-chart-4">
            <span className="font-medium">Tip:</span> {keyword.suggestedPhrasing}
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}

export function KeywordComparisonTable({
  keywords,
  onAddKeyword,
}: KeywordComparisonTableProps) {
  const matchedCount = keywords.filter(k => k.isMatched).length;
  const matchPercentage = keywords.length > 0 
    ? Math.round((matchedCount / keywords.length) * 100) 
    : 0;

  const { critical, high, medium } = groupByPriority(keywords);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="border border-border rounded-lg bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Keyword Analysis
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {matchedCount}/{keywords.length} matched
            </span>
            <span
              className={cn(
                'text-sm font-medium',
                matchPercentage >= 70 ? 'text-primary' : 
                matchPercentage >= 50 ? 'text-chart-4' : 
                'text-destructive'
              )}
            >
              ({matchPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Priority Sections */}
      <div className="divide-y divide-border">
        <PrioritySection
          title="Critical / Required Skills"
          keywords={critical}
          onAddKeyword={onAddKeyword}
          defaultExpanded={true}
        />
        <PrioritySection
          title="High Priority Skills"
          keywords={high}
          onAddKeyword={onAddKeyword}
          defaultExpanded={true}
        />
        <PrioritySection
          title="Recommended Skills"
          keywords={medium}
          onAddKeyword={onAddKeyword}
          defaultExpanded={false}
        />
      </div>

      {/* Empty state */}
      {keywords.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-sm">No keywords analyzed yet</p>
        </div>
      )}
    </motion.div>
  );
}

/**
 * KeywordContextPopover - Shows keyword context from JD and Resume
 * Displays side-by-side comparison when clicking a keyword pill
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Copy, ArrowRight, FileText, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export interface KeywordWithContext {
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  frequency?: number;
  jdContext?: string;
  resumeContext?: string;
  suggestedPhrasing?: string;
  prevalence?: string;
}

interface KeywordContextPopoverProps {
  keyword: KeywordWithContext;
  isMatched: boolean;
  onAddToResume?: (keyword: KeywordWithContext) => void;
  children: React.ReactNode;
}

export function KeywordContextPopover({
  keyword,
  isMatched,
  onAddToResume,
  children
}: KeywordContextPopoverProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const textToCopy = keyword.suggestedPhrasing || keyword.resumeContext || keyword.keyword;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToResume = () => {
    onAddToResume?.(keyword);
    setOpen(false);
  };

  // Highlight keyword within context text
  const highlightKeyword = (text: string | undefined, kw: string) => {
    if (!text) return null;
    const regex = new RegExp(`(${kw})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded font-medium">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const priorityColors = {
    critical: 'text-destructive',
    high: 'text-amber-600 dark:text-amber-400',
    medium: 'text-muted-foreground'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0" 
        align="start"
        side="bottom"
        sideOffset={8}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isMatched ? 'default' : 'outline'}
                  className={cn(
                    "font-semibold",
                    !isMatched && "border-destructive/30 text-destructive"
                  )}
                >
                  {keyword.keyword}
                </Badge>
                <span className={cn("text-xs font-medium", priorityColors[keyword.priority])}>
                  {keyword.priority}
                </span>
              </div>
              {keyword.frequency && (
                <span className="text-xs text-muted-foreground">
                  {keyword.frequency}× in JD
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
              {/* JD Context */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Briefcase className="h-3 w-3" />
                  Job Description
                </div>
                <div className="text-sm p-2.5 rounded-md bg-muted/50 border-l-2 border-muted-foreground/30">
                  {keyword.jdContext ? (
                    <p className="leading-relaxed">
                      "{highlightKeyword(keyword.jdContext, keyword.keyword)}"
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic">No context available</p>
                  )}
                </div>
              </div>

              {/* Resume Context */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Your Resume
                  {isMatched && <Check className="h-3 w-3 text-primary ml-1" />}
                </div>
                <div className={cn(
                  "text-sm p-2.5 rounded-md border-l-2",
                  isMatched 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-destructive/5 border-destructive/20"
                )}>
                  {isMatched && keyword.resumeContext ? (
                    <p className="leading-relaxed">
                      "{highlightKeyword(keyword.resumeContext, keyword.keyword)}"
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic flex items-center gap-1.5">
                      <X className="h-3 w-3 text-destructive" />
                      Not found in your resume
                    </p>
                  )}
                </div>
              </div>

              {/* Suggested Phrasing (for missing keywords) */}
              {!isMatched && keyword.suggestedPhrasing && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <span>💡</span>
                    Suggested Phrasing
                  </div>
                  <div className="text-sm p-2.5 rounded-md bg-primary/5 border border-primary/20">
                    <p className="leading-relaxed text-foreground">
                      "{keyword.suggestedPhrasing}"
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                      {onAddToResume && (
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleAddToResume}
                        >
                          Add to Resume
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Match quality indicator for matched keywords */}
              {isMatched && keyword.resumeContext && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-primary/5 text-xs text-primary">
                  <Check className="h-3.5 w-3.5" />
                  <span>Strong match — your usage aligns with requirements</span>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}

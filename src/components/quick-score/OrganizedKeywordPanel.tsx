/**
 * OrganizedKeywordPanel - Displays keywords grouped by category and type
 * Shows matched/missing keywords with JD context and suggested phrasing
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Check, X, ChevronDown, ChevronRight, 
  Lightbulb, Quote, Wand2, Code, Users, Award, 
  Briefcase, Heart, Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface OrganizedKeyword {
  keyword: string;
  priority: 'critical' | 'high' | 'medium';
  category?: 'required' | 'preferred' | 'nice-to-have';
  type?: 'technical' | 'domain' | 'leadership' | 'soft' | 'certification' | 'tool';
  jdContext?: string;
  resumeContext?: string;
  suggestedPhrasing?: string;
  frequency?: number;
}

interface OrganizedKeywordPanelProps {
  matchedKeywords: OrganizedKeyword[];
  missingKeywords: OrganizedKeyword[];
  onAddToResume?: (keyword: OrganizedKeyword) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  technical: Code,
  domain: Briefcase,
  leadership: Users,
  soft: Heart,
  certification: Award,
  tool: Wrench
};

function KeywordBadge({ 
  keyword, 
  isMatched, 
  expanded,
  onToggle,
  onAddToResume 
}: { 
  keyword: OrganizedKeyword; 
  isMatched: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAddToResume?: () => void;
}) {
  const hasContext = keyword.jdContext || keyword.resumeContext || keyword.suggestedPhrasing;
  const TypeIcon = keyword.type ? typeIcons[keyword.type] : null;

  return (
    <div className="relative">
      <Badge 
        variant="outline"
        className={cn(
          "text-xs font-normal transition-all cursor-pointer",
          isMatched 
            ? "bg-primary/5 border-primary/20 text-primary hover:bg-primary/10" 
            : keyword.priority === 'critical'
              ? "bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive/10"
              : "bg-muted/50 hover:bg-muted",
          expanded && "ring-2 ring-primary/30"
        )}
        onClick={onToggle}
      >
        {isMatched ? (
          <Check className="h-2.5 w-2.5 mr-1" />
        ) : (
          <X className="h-2.5 w-2.5 mr-1" />
        )}
        {TypeIcon && <TypeIcon className="h-2.5 w-2.5 mr-1 opacity-50" />}
        {keyword.keyword}
        {!isMatched && keyword.frequency && keyword.frequency > 1 && (
          <span className="ml-1 opacity-70">({keyword.frequency}×)</span>
        )}
        {hasContext && (
          <ChevronDown className={cn(
            "h-2.5 w-2.5 ml-1 transition-transform",
            expanded && "rotate-180"
          )} />
        )}
      </Badge>

      <AnimatePresence>
        {expanded && hasContext && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 top-full mt-1 left-0 w-80 p-3 rounded-lg border border-border bg-card shadow-lg"
          >
            {keyword.jdContext && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                  <Quote className="h-3 w-3" />
                  From Job Description:
                </div>
                <p className="text-xs text-foreground bg-muted/50 p-2 rounded italic">
                  "{keyword.jdContext}"
                </p>
              </div>
            )}

            {keyword.resumeContext && isMatched && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-primary mb-1">
                  <Check className="h-3 w-3" />
                  Your Resume Shows:
                </div>
                <p className="text-xs text-foreground bg-primary/5 p-2 rounded italic">
                  "{keyword.resumeContext}"
                </p>
              </div>
            )}

            {keyword.suggestedPhrasing && !isMatched && (
              <div className="mb-2">
                <div className="flex items-center gap-1 text-xs font-medium text-amber-500 mb-1">
                  <Lightbulb className="h-3 w-3" />
                  Suggested Addition:
                </div>
                <p className="text-xs text-foreground bg-amber-500/5 p-2 rounded">
                  {keyword.suggestedPhrasing}
                </p>
              </div>
            )}

            {!isMatched && onAddToResume && (
              <Button 
                size="sm" 
                className="w-full mt-2 gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToResume();
                }}
              >
                <Wand2 className="h-3 w-3" />
                Add to Resume
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function KeywordSection({ 
  title, 
  keywords, 
  isMatched,
  categoryColor,
  expandedKeyword,
  onToggleKeyword,
  onAddToResume
}: {
  title: string;
  keywords: OrganizedKeyword[];
  isMatched: boolean;
  categoryColor?: string;
  expandedKeyword: string | null;
  onToggleKeyword: (keyword: string) => void;
  onAddToResume?: (keyword: OrganizedKeyword) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);

  if (keywords.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1 text-left">
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className={cn("text-xs font-medium", categoryColor || "text-muted-foreground")}>
          {title}
        </span>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
          {keywords.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-wrap gap-1.5 mt-2 ml-5">
          {keywords.map((kw, i) => (
            <KeywordBadge
              key={`${kw.keyword}-${i}`}
              keyword={kw}
              isMatched={isMatched}
              expanded={expandedKeyword === kw.keyword}
              onToggle={() => onToggleKeyword(kw.keyword)}
              onAddToResume={onAddToResume ? () => onAddToResume(kw) : undefined}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OrganizedKeywordPanel({
  matchedKeywords = [],
  missingKeywords = [],
  onAddToResume
}: OrganizedKeywordPanelProps) {
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  
  const totalKeywords = matchedKeywords.length + missingKeywords.length;
  const matchPercentage = totalKeywords > 0 
    ? Math.round((matchedKeywords.length / totalKeywords) * 100) 
    : 0;

  // Group keywords by category
  const groupByCategory = (keywords: OrganizedKeyword[]) => ({
    required: keywords.filter(k => k.category === 'required'),
    preferred: keywords.filter(k => k.category === 'preferred'),
    niceToHave: keywords.filter(k => k.category === 'nice-to-have'),
    uncategorized: keywords.filter(k => !k.category)
  });

  const matchedGroups = groupByCategory(matchedKeywords);
  const missingGroups = groupByCategory(missingKeywords);

  const handleToggleKeyword = (keyword: string) => {
    setExpandedKeyword(expandedKeyword === keyword ? null : keyword);
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
            Keyword Analysis
          </h3>
          <Badge 
            variant={matchPercentage >= 70 ? 'default' : matchPercentage >= 50 ? 'secondary' : 'outline'}
            className="font-medium"
          >
            {matchedKeywords.length}/{totalKeywords} matched ({matchPercentage}%)
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Click keywords for context
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Matched Keywords Section */}
        {matchedKeywords.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Check className="h-4 w-4" />
              Matched Keywords
            </div>
            <div className="space-y-2 pl-2">
              <KeywordSection
                title="Required Skills Found"
                keywords={matchedGroups.required}
                isMatched={true}
                categoryColor="text-primary"
                expandedKeyword={expandedKeyword}
                onToggleKeyword={handleToggleKeyword}
              />
              <KeywordSection
                title="Preferred Skills Found"
                keywords={matchedGroups.preferred}
                isMatched={true}
                categoryColor="text-primary/80"
                expandedKeyword={expandedKeyword}
                onToggleKeyword={handleToggleKeyword}
              />
              <KeywordSection
                title="Bonus Skills Found"
                keywords={matchedGroups.niceToHave}
                isMatched={true}
                categoryColor="text-primary/60"
                expandedKeyword={expandedKeyword}
                onToggleKeyword={handleToggleKeyword}
              />
              {matchedGroups.uncategorized.length > 0 && (
                <KeywordSection
                  title="Other Matches"
                  keywords={matchedGroups.uncategorized}
                  isMatched={true}
                  expandedKeyword={expandedKeyword}
                  onToggleKeyword={handleToggleKeyword}
                />
              )}
            </div>
          </div>
        )}

        {/* Missing Keywords Section */}
        {missingKeywords.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-sm font-medium text-destructive">
              <X className="h-4 w-4" />
              Missing Keywords
            </div>
            <div className="space-y-2 pl-2">
              <KeywordSection
                title="Required Skills Missing"
                keywords={missingGroups.required}
                isMatched={false}
                categoryColor="text-destructive"
                expandedKeyword={expandedKeyword}
                onToggleKeyword={handleToggleKeyword}
                onAddToResume={onAddToResume}
              />
              <KeywordSection
                title="Preferred Skills Missing"
                keywords={missingGroups.preferred}
                isMatched={false}
                categoryColor="text-amber-500"
                expandedKeyword={expandedKeyword}
                onToggleKeyword={handleToggleKeyword}
                onAddToResume={onAddToResume}
              />
              <KeywordSection
                title="Nice-to-Have Missing"
                keywords={missingGroups.niceToHave}
                isMatched={false}
                expandedKeyword={expandedKeyword}
                onToggleKeyword={handleToggleKeyword}
                onAddToResume={onAddToResume}
              />
              {missingGroups.uncategorized.length > 0 && (
                <KeywordSection
                  title="Other Missing"
                  keywords={missingGroups.uncategorized}
                  isMatched={false}
                  expandedKeyword={expandedKeyword}
                  onToggleKeyword={handleToggleKeyword}
                  onAddToResume={onAddToResume}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

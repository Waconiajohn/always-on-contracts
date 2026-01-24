import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Plus, 
  X, 
  HelpCircle, 
  Ban,
  Check,
  ChevronDown
} from 'lucide-react';
import type { KeywordDecision, SectionHint } from '@/types/resume-builder';

interface KeywordChipProps {
  keyword: string;
  hasEvidence: boolean;
  decision?: KeywordDecision;
  source?: 'jd' | 'benchmark';
  sectionHint?: SectionHint;
  onDecision: (keyword: string, decision: KeywordDecision) => void;
  disabled?: boolean;
}

export function KeywordChip({
  keyword,
  hasEvidence,
  decision,
  source,
  sectionHint,
  onDecision,
  disabled = false,
}: KeywordChipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Determine chip state styling
  const getChipStyles = () => {
    if (decision === 'add') {
      return 'bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400';
    }
    if (decision === 'ignore') {
      return 'bg-muted text-muted-foreground border-muted line-through';
    }
    if (decision === 'not_true') {
      return 'bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400 line-through';
    }
    if (decision === 'ask_me') {
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400';
    }
    // Default - no decision yet
    if (hasEvidence) {
      return 'bg-primary/10 text-primary border-primary/30';
    }
    return 'bg-muted text-foreground border-border';
  };

  const getDecisionIcon = () => {
    if (decision === 'add') return <Check className="h-3 w-3" />;
    if (decision === 'ignore') return <X className="h-3 w-3" />;
    if (decision === 'not_true') return <Ban className="h-3 w-3" />;
    if (decision === 'ask_me') return <HelpCircle className="h-3 w-3" />;
    return null;
  };

  const handleDecision = (newDecision: KeywordDecision) => {
    onDecision(keyword, newDecision);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
            getChipStyles(),
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'hover:opacity-80 cursor-pointer'
          )}
        >
          {getDecisionIcon()}
          <span>{keyword}</span>
          {!decision && <ChevronDown className="h-3 w-3 opacity-60" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {/* Source & Section hint */}
          <div className="px-2 py-1 text-xs text-muted-foreground border-b border-border mb-2">
            <span className="capitalize">{source || 'keyword'}</span>
            {sectionHint && (
              <span className="ml-1">• Best in {sectionHint}</span>
            )}
          </div>

          {/* Add - only enabled if evidence exists */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            disabled={!hasEvidence}
            onClick={() => handleDecision('add')}
          >
            <Plus className="h-4 w-4 text-green-600" />
            <span>Add to resume</span>
            {!hasEvidence && (
              <span className="text-xs text-muted-foreground ml-auto">
                No evidence
              </span>
            )}
          </Button>

          {/* Ask me - triggers question flow */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleDecision('ask_me')}
          >
            <HelpCircle className="h-4 w-4 text-yellow-600" />
            <span>Ask me about this</span>
          </Button>

          {/* Ignore */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => handleDecision('ignore')}
          >
            <X className="h-4 w-4 text-muted-foreground" />
            <span>Ignore for now</span>
          </Button>

          {/* Not true - permanently suppressed */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDecision('not_true')}
          >
            <Ban className="h-4 w-4" />
            <span>Not true for me</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Additional exports for FixPage

interface KeywordChipGroupProps {
  title: string;
  keywords: Array<{ id: string; keyword: string; decision?: string }>;
  onDecision: (keywordId: string, decision: KeywordDecision) => void;
  icon: React.ReactNode;
  emptyMessage?: string;
}

export function KeywordChipGroup({ 
  title, 
  keywords, 
  onDecision, 
  icon,
  emptyMessage = 'None' 
}: KeywordChipGroupProps) {
  const { Card } = require('@/components/ui/card');
  const { Badge } = require('@/components/ui/badge');

  if (keywords.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground italic">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="secondary" className="text-xs">{keywords.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) => (
          <KeywordChip
            key={kw.id}
            keyword={kw.keyword}
            hasEvidence={true}
            decision={kw.decision as KeywordDecision}
            onDecision={(_, decision) => onDecision(kw.id, decision)}
          />
        ))}
      </div>
    </Card>
  );
}

interface GapCardProps {
  category: string;
  requirement: string;
  severity: 'critical' | 'important' | 'nice_to_have';
  onAddBullet?: () => void;
}

export function GapCard({ category, requirement, severity, onAddBullet }: GapCardProps) {
  const { Card } = require('@/components/ui/card');
  const { Badge } = require('@/components/ui/badge');
  const { Button } = require('@/components/ui/button');
  const { AlertCircle, Plus } = require('lucide-react');

  const severityConfig = {
    critical: { 
      label: 'Critical',
      className: 'border-destructive/50 bg-destructive/5'
    },
    important: { 
      label: 'Important',
      className: 'border-accent/50 bg-accent/5'
    },
    nice_to_have: { 
      label: 'Nice to Have',
      className: 'border-muted bg-muted/30'
    },
  };

  const config = severityConfig[severity];

  return (
    <Card className={cn('p-4', config.className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4" />
            <Badge variant="outline" className="text-xs">{category}</Badge>
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
          <p className="text-sm">{requirement}</p>
        </div>
        {onAddBullet && (
          <Button variant="outline" size="sm" onClick={onAddBullet}>
            <Plus className="h-3 w-3 mr-1" />
            Add Bullet
          </Button>
        )}
      </div>
    </Card>
  );
}

export default KeywordChip;

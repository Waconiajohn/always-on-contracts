/**
 * AIEnhancementToolbar - Simplified, explained AI actions
 * Context-aware with clear descriptions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Target, 
  BarChart3, 
  Award,
  Loader2,
  Sparkles,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AIEnhancementType, SectionType } from '../types';

interface AIAction {
  id: AIEnhancementType;
  name: string;
  icon: React.ReactNode;
  description: string;
  bestFor: string;
  impact: string;
  color: string;
}

const AI_ACTIONS: AIAction[] = [
  {
    id: 'expand',
    name: 'Expand',
    icon: <FileText className="h-5 w-5" />,
    description: 'Takes your rough notes and creates professional prose',
    bestFor: 'Starting from scratch',
    impact: '+3 points',
    color: 'text-blue-500'
  },
  {
    id: 'ats-boost',
    name: 'ATS Boost',
    icon: <Target className="h-5 w-5" />,
    description: 'Injects exact keywords from this job posting',
    bestFor: 'Final polish',
    impact: '+5 points',
    color: 'text-green-500'
  },
  {
    id: 'quantify',
    name: 'Quantify',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Adds numbers and percentages to show real impact',
    bestFor: 'Vague accomplishments',
    impact: '+4 points',
    color: 'text-amber-500'
  },
  {
    id: 'benchmark',
    name: 'Benchmark',
    icon: <Award className="h-5 w-5" />,
    description: 'Elevates to industry-leading standard',
    bestFor: 'Already good content',
    impact: '+8 points',
    color: 'text-purple-500'
  }
];

interface AIEnhancementToolbarProps {
  sectionType: SectionType;
  currentContent: string;
  onEnhance: (type: AIEnhancementType) => Promise<string | null>;
  onApplySuggestion: (content: string) => void;
  disabled?: boolean;
}

export function AIEnhancementToolbar({
  sectionType,
  onEnhance,
  onApplySuggestion,
  disabled
}: AIEnhancementToolbarProps) {
  const [activeAction, setActiveAction] = useState<AIEnhancementType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEnhance = async (actionId: AIEnhancementType) => {
    if (disabled || isLoading) return;
    
    setActiveAction(actionId);
    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await onEnhance(actionId);
      if (result) {
        setSuggestion(result);
      } else {
        setError('Could not generate suggestion. Please try again.');
      }
    } catch (err) {
      setError('Enhancement failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApplySuggestion(suggestion);
      setSuggestion(null);
      setActiveAction(null);
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setActiveAction(null);
    setError(null);
  };

  const handleRegenerate = () => {
    if (activeAction) {
      handleEnhance(activeAction);
    }
  };

  // Get contextual tip based on section
  const getSectionTip = () => {
    switch (sectionType) {
      case 'summary':
        return '💡 Tip: Use EXPAND first, then ATS BOOST for maximum impact';
      case 'experience':
        return '💡 Tip: Use QUANTIFY to add metrics, then BENCHMARK to elevate';
      case 'skills':
        return '💡 Tip: Use ATS BOOST to ensure keyword coverage';
      default:
        return '💡 Tip: Start with EXPAND, then refine with other tools';
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Enhancement</h3>
        </div>
        <p className="text-xs text-muted-foreground">{getSectionTip()}</p>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {AI_ACTIONS.map((action) => {
          const isActive = activeAction === action.id;
          const isDisabled = disabled || (isLoading && !isActive);

          return (
            <motion.button
              key={action.id}
              onClick={() => handleEnhance(action.id)}
              disabled={isDisabled}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              className={cn(
                "relative p-4 rounded-lg border text-left transition-all",
                "hover:border-primary/50 hover:shadow-sm",
                isActive && "border-primary bg-primary/5",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Loading Overlay */}
              {isLoading && isActive && (
                <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              <div className="space-y-2">
                {/* Icon & Name */}
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-md bg-muted", action.color)}>
                    {action.icon}
                  </div>
                  <span className="font-medium">{action.name}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {action.description}
                </p>

                {/* Best For & Impact */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    Best for: {action.bestFor}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {action.impact}
                  </Badge>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Suggestion Preview */}
      <AnimatePresence>
        {(suggestion || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className={cn(
              "p-4 space-y-3",
              error && "border-destructive"
            )}>
              {error ? (
                <div className="flex items-center gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Suggestion Preview
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {AI_ACTIONS.find(a => a.id === activeAction)?.name}
                    </Badge>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-md text-sm max-h-40 overflow-auto">
                    {suggestion}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={handleApply} className="gap-1">
                      <Check className="h-3 w-3" />
                      Apply
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRegenerate} className="gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Regenerate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleDismiss} className="gap-1">
                      <X className="h-3 w-3" />
                      Dismiss
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

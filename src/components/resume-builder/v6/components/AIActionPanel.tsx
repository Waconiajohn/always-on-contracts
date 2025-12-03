/**
 * AIActionPanel - AI enhancement actions with clear descriptions
 * Replaces confusing conservative/moderate/aggressive with specific actions
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Plus, Target, TrendingUp, Sparkles, Search,
  Loader2, CheckCircle2, Undo2, Wand2, AlertCircle
} from 'lucide-react';

export interface AIAction {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  scoreImpact: number;
}

export const AI_ACTIONS: AIAction[] = [
  {
    id: 'expand',
    icon: Plus,
    label: 'Expand & Add Detail',
    description: 'Expands brief input with achievements, metrics, and impact statements',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    scoreImpact: 3
  },
  {
    id: 'keywords',
    icon: Target,
    label: 'Add JD Keywords',
    description: 'Injects exact keywords from the job description for ATS matching',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    scoreImpact: 5
  },
  {
    id: 'quantify',
    icon: TrendingUp,
    label: 'Quantify Impact',
    description: 'Adds specific numbers, percentages, and dollar amounts',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    scoreImpact: 4
  },
  {
    id: 'benchmark',
    icon: Sparkles,
    label: 'Match Benchmark Standard',
    description: 'Elevates content to top-candidate level for your role/industry',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    scoreImpact: 8
  },
  {
    id: 'industry',
    icon: Search,
    label: 'Use Industry Research',
    description: 'Incorporates terminology specific to your target industry',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    scoreImpact: 4
  }
];

interface AIActionPanelProps {
  sectionLabel: string;
  content: string;
  onContentChange: (content: string) => void;
  onApplyAI: (actionId: string) => Promise<string>;
  onSave: () => void;
  isGenerating: boolean;
  error?: string | null;
}

export function AIActionPanel({
  sectionLabel,
  content,
  onContentChange,
  onApplyAI,
  onSave,
  isGenerating,
  error
}: AIActionPanelProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const handleActionClick = async (actionId: string) => {
    if (isGenerating) return;
    
    setSelectedAction(actionId);
    
    // Save current content to history for undo
    if (content.trim()) {
      setHistory(prev => [...prev.slice(-4), content]); // Keep last 5 states
    }

    try {
      const result = await onApplyAI(actionId);
      setAiSuggestion(result);
    } catch (err) {
      console.error('AI action failed:', err);
    }
  };

  const applySuggestion = () => {
    if (aiSuggestion) {
      onContentChange(aiSuggestion);
      setAiSuggestion(null);
      setSelectedAction(null);
    }
  };

  const dismissSuggestion = () => {
    setAiSuggestion(null);
    setSelectedAction(null);
  };

  const undoLastChange = () => {
    if (history.length > 0) {
      const previousContent = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      onContentChange(previousContent);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold mb-1">Editing: {sectionLabel}</h3>
          <p className="text-sm text-muted-foreground">
            Enter your content, then use AI actions to enhance it
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Content Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Content</label>
            {history.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={undoLastChange}
                className="h-7 text-xs gap-1"
              >
                <Undo2 className="h-3 w-3" />
                Undo
              </Button>
            )}
          </div>
          <Textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={`Enter your ${sectionLabel.toLowerCase()} content here...`}
            className="min-h-[140px] resize-none"
          />
        </div>

        {/* AI Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI Enhancements</span>
          </div>
          
          <div className="grid gap-2">
            {AI_ACTIONS.map((action) => (
              <Card 
                key={action.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  action.borderColor,
                  selectedAction === action.id && "ring-2 ring-primary"
                )}
                onClick={() => handleActionClick(action.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", action.bgColor)}>
                      <action.icon className={cn("h-4 w-4", action.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{action.label}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          +{action.scoreImpact} pts
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {action.description}
                      </p>
                    </div>
                    {isGenerating && selectedAction === action.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Suggestion</span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background rounded p-3 border">
                {aiSuggestion}
              </p>
              <div className="flex gap-2">
                <Button onClick={applySuggestion} size="sm" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Apply
                </Button>
                <Button onClick={dismissSuggestion} variant="outline" size="sm">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <Button 
          onClick={onSave} 
          className="w-full gap-2"
          disabled={!content.trim()}
        >
          <CheckCircle2 className="h-4 w-4" />
          Save & Continue
        </Button>
      </div>
    </ScrollArea>
  );
}

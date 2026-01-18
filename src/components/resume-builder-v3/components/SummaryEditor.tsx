/**
 * SummaryEditor - Interactive professional summary editor with AI refinement
 * Mirrors BulletEditor patterns for consistent UX
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sparkles, 
  Target, 
  RefreshCw, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Wand2
} from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryActionType = 'polish' | 'add_keywords' | 'modernize' | 'regenerate';

interface SummaryEditorProps {
  summary: string;
  jobDescription: string;
  onSummaryUpdate: (newSummary: string) => void;
}

const ACTION_CONFIG: Record<SummaryActionType, { icon: typeof Sparkles; label: string; description: string }> = {
  polish: {
    icon: Sparkles,
    label: "Polish Language",
    description: "Refine wording for impact and clarity",
  },
  add_keywords: {
    icon: Target,
    label: "Add Keywords",
    description: "Incorporate job-relevant terminology",
  },
  modernize: {
    icon: Wand2,
    label: "Modernize",
    description: "Update to current industry language",
  },
  regenerate: {
    icon: RefreshCw,
    label: "Regenerate",
    description: "Completely rewrite the summary",
  },
};

export function SummaryEditor({
  summary,
  jobDescription,
  onSummaryUpdate,
}: SummaryEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<SummaryActionType | null>(null);
  const [preview, setPreview] = useState<{
    improvedSummary: string;
    changes: string;
    action: SummaryActionType;
  } | null>(null);
  const [showActions, setShowActions] = useState(false);

  const handleAction = async (action: SummaryActionType) => {
    setIsLoading(true);
    setLoadingAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('regenerate-bullet', {
        body: {
          bulletId: 'summary',
          sectionType: 'summary',
          jobDescription,
          currentText: summary,
          action,
        },
      });

      if (error) throw error;

      if (data?.improvedBullet) {
        setPreview({
          improvedSummary: data.improvedBullet,
          changes: data.changes || 'Improved summary',
          action,
        });
      } else {
        throw new Error('No improved summary returned');
      }
    } catch (error) {
      console.error('Failed to refine summary:', error);
      toast.error('Failed to refine summary. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleAccept = () => {
    if (preview) {
      onSummaryUpdate(preview.improvedSummary);
      toast.success('Summary updated!');
      setPreview(null);
      setShowActions(false);
    }
  };

  const handleReject = () => {
    setPreview(null);
  };

  // If showing preview, render the comparison view
  if (preview) {
    return (
      <div className="space-y-2">
        <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-4">
          {/* Before */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</span>
            <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/50 leading-relaxed">
              {summary}
            </p>
          </div>
          
          {/* After */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-primary uppercase tracking-wide">After</span>
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {preview.improvedSummary}
            </p>
          </div>
          
          {/* Changes description */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>{preview.changes}</span>
          </div>
          
          {/* Accept/Reject buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleAccept}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <Check className="h-3 w-3" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <X className="h-3 w-3" />
              Keep Original
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 group">
      <p className="text-sm leading-relaxed">{summary}</p>
      
      {/* Toggle button - visible on hover or when expanded */}
      <div className={cn(
        "transition-opacity duration-200",
        showActions ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowActions(!showActions)}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          disabled={isLoading}
        >
          <Sparkles className="h-3 w-3" />
          Improve Summary with AI
          {showActions ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-1.5 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {(Object.entries(ACTION_CONFIG) as [SummaryActionType, typeof ACTION_CONFIG[SummaryActionType]][]).map(
            ([action, config]) => {
              const Icon = config.icon;
              const isThisLoading = isLoading && loadingAction === action;
              
              return (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(action)}
                  disabled={isLoading}
                  className="h-7 px-2.5 text-xs gap-1.5"
                  title={config.description}
                >
                  {isThisLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Icon className="h-3 w-3" />
                  )}
                  {config.label}
                </Button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

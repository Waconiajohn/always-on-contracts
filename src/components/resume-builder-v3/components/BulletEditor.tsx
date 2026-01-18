/**
 * BulletEditor - Interactive bullet point editor with AI refinement
 * Allows users to strengthen, add metrics, regenerate, or view alternative versions
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sparkles, 
  BarChart3, 
  RefreshCw, 
  Check, 
  X, 
  Loader2,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2,
  Undo2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BulletEditActionType } from "@/types/resume-builder-v3";
import { useRefinementSuggestions } from "@/hooks/useRefinementSuggestions";
import { useMultipleBulletOptions } from "@/hooks/useMultipleBulletOptions";
import { AlternativeVersionsPanel } from "./AlternativeVersionsPanel";
import { BulletOptionsPanel } from "./BulletOptionsPanel";

interface BulletEditorProps {
  bullet: string;
  experienceIndex: number;
  bulletIndex: number;
  jobDescription: string;
  onBulletUpdate: (experienceIndex: number, bulletIndex: number, newBullet: string) => void;
}



const ACTION_CONFIG = {
  strengthen: {
    icon: Sparkles,
    label: "Strengthen",
    description: "Make more powerful with action verbs",
  },
  add_metrics: {
    icon: BarChart3,
    label: "Add Metrics",
    description: "Add quantifiable outcomes",
  },
  regenerate: {
    icon: RefreshCw,
    label: "Regenerate",
    description: "Completely rewrite",
  },
} as const;

export function BulletEditor({
  bullet,
  experienceIndex,
  bulletIndex,
  jobDescription,
  onBulletUpdate,
}: BulletEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<BulletEditActionType | null>(null);
  const [preview, setPreview] = useState<{
    improvedBullet: string;
    changes: string;
    action: BulletEditActionType;
  } | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [viewMode, setViewMode] = useState<'default' | 'alternatives' | 'options'>('default');
  const [editHistory, setEditHistory] = useState<string[]>([]);

  // Hooks for advanced suggestions
  const { 
    suggestions: refinementSuggestions, 
    isLoading: isLoadingAlternatives, 
    fetchSuggestions: fetchAlternatives,
    clearSuggestions: clearAlternatives
  } = useRefinementSuggestions({
    bulletText: bullet,
    jobDescription,
  });

  const {
    options: bulletOptions,
    isLoading: isLoadingOptions,
    generateOptions,
    clearOptions
  } = useMultipleBulletOptions();

  const handleAction = async (action: BulletEditActionType) => {
    setIsLoading(true);
    setLoadingAction(action);

    try {
      const { data, error } = await supabase.functions.invoke('regenerate-bullet', {
        body: {
          bulletId: `${experienceIndex}-${bulletIndex}`,
          sectionType: 'experience',
          jobDescription,
          currentText: bullet,
          action,
        },
      });

      if (error) throw error;

      if (data?.improvedBullet) {
        setPreview({
          improvedBullet: data.improvedBullet,
          changes: data.changes || 'Improved bullet',
          action,
        });
      } else {
        throw new Error('No improved bullet returned');
      }
    } catch (error) {
      console.error('Failed to refine bullet:', error);
      toast.error('Failed to refine bullet. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  };

  const handleShowAlternatives = async () => {
    setViewMode('alternatives');
    await fetchAlternatives();
  };

  const handleShowOptions = async () => {
    setViewMode('options');
    await generateOptions({
      requirementText: bullet,
      currentBullet: bullet,
      jobDescription,
    });
  };

  const handleSelectAlternative = (selectedBullet: string) => {
    onBulletUpdate(experienceIndex, bulletIndex, selectedBullet);
    toast.success('Bullet updated!');
    setViewMode('default');
    clearAlternatives();
    setShowActions(false);
  };

  const handleSelectOption = (selectedBullet: string) => {
    onBulletUpdate(experienceIndex, bulletIndex, selectedBullet);
    toast.success('Bullet updated!');
    setViewMode('default');
    clearOptions();
    setShowActions(false);
  };

  const handleCancelAdvanced = () => {
    setViewMode('default');
    clearAlternatives();
    clearOptions();
  };

  const handleAccept = useCallback(() => {
    if (preview) {
      // Save current bullet to history before updating
      setEditHistory(prev => [...prev, bullet].slice(-5)); // Keep last 5 versions
      onBulletUpdate(experienceIndex, bulletIndex, preview.improvedBullet);
      toast.success('Bullet updated!');
      setPreview(null);
      setShowActions(false);
    }
  }, [preview, bullet, experienceIndex, bulletIndex, onBulletUpdate]);

  const handleReject = useCallback(() => {
    setPreview(null);
  }, []);

  const handleUndo = useCallback(() => {
    if (editHistory.length > 0) {
      const lastVersion = editHistory[editHistory.length - 1];
      onBulletUpdate(experienceIndex, bulletIndex, lastVersion);
      setEditHistory(prev => prev.slice(0, -1));
      toast.success('Reverted to previous version');
    }
  }, [editHistory, experienceIndex, bulletIndex, onBulletUpdate]);

  // If showing alternative versions panel
  if (viewMode === 'alternatives') {
    return (
      <li className="text-sm">
        <AlternativeVersionsPanel
          versions={refinementSuggestions?.alternativeVersions || { conservative: '', moderate: '', aggressive: '' }}
          isLoading={isLoadingAlternatives}
          onSelect={handleSelectAlternative}
          onCancel={handleCancelAdvanced}
          currentBullet={bullet}
        />
      </li>
    );
  }

  // If showing multiple options panel
  if (viewMode === 'options') {
    return (
      <li className="text-sm">
        <BulletOptionsPanel
          options={bulletOptions}
          isLoading={isLoadingOptions}
          onSelect={handleSelectOption}
          onCancel={handleCancelAdvanced}
          currentBullet={bullet}
        />
      </li>
    );
  }

  // If showing preview, render the comparison view
  if (preview) {
    return (
      <li className="text-sm">
        <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-3">
          {/* Before */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</span>
            <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
              {bullet}
            </p>
          </div>
          
          {/* After */}
          <div className="space-y-1">
            <span className="text-xs font-medium text-primary uppercase tracking-wide">After</span>
            <p className="text-sm font-medium text-foreground">
              {preview.improvedBullet}
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
      </li>
    );
  }

  return (
    <li className="text-sm group">
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground mt-0.5">•</span>
        <div className="flex-1 space-y-1.5">
          <span>{bullet}</span>
          
          {/* Toggle button - ALWAYS VISIBLE with sparkle indicator */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className={cn(
                "h-7 px-2.5 text-xs gap-1.5 border-primary/30 hover:border-primary hover:bg-primary/5",
                showActions && "bg-primary/10 border-primary"
              )}
              disabled={isLoading}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary font-medium">Improve with AI</span>
              {showActions ? (
                <ChevronUp className="h-3 w-3 text-primary" />
              ) : (
                <ChevronDown className="h-3 w-3 text-primary" />
              )}
            </Button>
            {editHistory.length > 0 && (
              <span className="text-[10px] text-muted-foreground">({editHistory.length} edits)</span>
            )}
          </div>
          
          {/* Action buttons */}
          {showActions && (
            <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Quick actions row */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(ACTION_CONFIG) as [BulletEditActionType, typeof ACTION_CONFIG[BulletEditActionType]][]).map(
                  ([action, config]) => {
                    const Icon = config.icon;
                    const isThisLoading = isLoading && loadingAction === action;
                    
                    return (
                      <Button
                        key={action}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAction(action)}
                        disabled={isLoading || isLoadingAlternatives || isLoadingOptions}
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
              
              {/* Advanced options row */}
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowAlternatives}
                  disabled={isLoading || isLoadingAlternatives || isLoadingOptions}
                  className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  title="View conservative, moderate, and aggressive rewrites"
                >
                  {isLoadingAlternatives ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Layers className="h-3 w-3" />
                  )}
                  View Alternatives
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowOptions}
                  disabled={isLoading || isLoadingAlternatives || isLoadingOptions}
                  className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                  title="Generate 3 different strategic angles"
                >
                  {isLoadingOptions ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  3 Options
                </Button>
                {editHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUndo}
                    className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    title="Undo last AI edit"
                  >
                    <Undo2 className="h-3 w-3" />
                    Undo
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
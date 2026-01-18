/**
 * BulletEditor - Interactive bullet point editor with AI refinement
 * Allows users to strengthen, add metrics, regenerate, or view alternative versions
 */

import { useState } from "react";
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
  Wand2
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

  const handleAccept = () => {
    if (preview) {
      onBulletUpdate(experienceIndex, bulletIndex, preview.improvedBullet);
      toast.success('Bullet updated!');
      setPreview(null);
      setShowActions(false);
    }
  };

  const handleReject = () => {
    setPreview(null);
  };

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
              Improve with AI
              {showActions ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
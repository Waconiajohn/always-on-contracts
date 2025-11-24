import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Star, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InlineAICoachProps {
  originalText: string;
  itemId?: string;
  itemType?: string;
  positionId?: string;
  vaultId: string;
  onAccept: (improvedText: string) => void;
  className?: string;
}

type CoachingMode = 'improve' | 'quantify' | 'star' | null;

interface AISuggestion {
  text: string;
  mode: CoachingMode;
  reasoning?: string;
  factDriftDetected?: boolean;
  factDriftDetails?: any;
}

export const InlineAICoach = ({
  originalText,
  itemId,
  itemType,
  positionId,
  vaultId,
  onAccept,
  className
}: InlineAICoachProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<CoachingMode>(null);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [editedText, setEditedText] = useState("");

  const handleCoach = async (mode: CoachingMode) => {
    if (!mode) return;
    
    setIsLoading(true);
    setCurrentMode(mode);
    setSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          mode,
          originalText,
          itemId,
          itemType,
          positionId,
          vaultId
        }
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion({
          text: data.suggestion,
          mode,
          reasoning: data.reasoning,
          factDriftDetected: data.factDriftDetected,
          factDriftDetails: data.factDriftDetails
        });
        setEditedText(data.suggestion);
      } else {
        throw new Error("No suggestion returned");
      }
    } catch (error) {
      console.error("AI Coach error:", error);
      toast.error("Failed to generate suggestion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (!suggestion) return;
    onAccept(editedText);
    setSuggestion(null);
    setCurrentMode(null);
    toast.success("Changes applied!");
  };

  const handleReject = () => {
    setSuggestion(null);
    setCurrentMode(null);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Action Buttons */}
      {!suggestion && (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCoach('improve')}
            disabled={isLoading}
            className="hover-scale"
          >
            {isLoading && currentMode === 'improve' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 mr-1" />
            )}
            Improve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCoach('quantify')}
            disabled={isLoading}
            className="hover-scale"
          >
            {isLoading && currentMode === 'quantify' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            Add Metrics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCoach('star')}
            disabled={isLoading}
            className="hover-scale"
          >
            {isLoading && currentMode === 'star' ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Star className="h-3 w-3 mr-1" />
            )}
            Make it STAR
          </Button>
        </div>
      )}

      {/* Suggestion Box (slides down when ready) */}
      {suggestion && (
        <div className="border rounded-lg p-4 bg-accent/50 space-y-3 animate-fade-in">
          {/* Fact Drift Warning */}
          {suggestion.factDriftDetected && (
            <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">⚠️ Verify Changes:</span>
                <span className="text-foreground">
                  AI detected numerical changes. Please confirm accuracy before accepting.
                </span>
              </div>
            </div>
          )}

          {/* Editable Suggestion */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              AI Suggestion ({suggestion.mode}):
            </label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full p-3 rounded-md border bg-background text-sm min-h-[80px] resize-y"
              placeholder="Edit suggestion..."
            />
          </div>

          {/* Reasoning (if provided) */}
          {suggestion.reasoning && (
            <div className="text-xs text-muted-foreground italic">
              💡 {suggestion.reasoning}
            </div>
          )}

          {/* Accept/Reject Buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleAccept}
              className="flex-1"
            >
              <Check className="h-3 w-3 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
            >
              <X className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

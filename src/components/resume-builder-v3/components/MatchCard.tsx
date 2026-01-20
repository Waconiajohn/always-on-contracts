/**
 * MatchCard - Actionable card for partial matches
 * Shows what JD wants, what you have, and an AI-improved version ready to accept
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  Check,
  X,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";

interface MatchCardProps {
  match: FitAnalysisResult["strengths"][0];
  resume: OptimizedResume;
  jobDescription: string;
  onBulletUpdate: (experienceIndex: number, bulletIndex: number, newBullet: string) => void;
  onSummaryUpdate: (newSummary: string) => void;
  onActionApplied: () => void;
  onActionSkipped: () => void;
}

export function MatchCard({
  match,
  resume,
  jobDescription,
  onBulletUpdate,
  onSummaryUpdate,
  onActionApplied,
  onActionSkipped,
}: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [improvement, setImprovement] = useState<{
    original: string;
    improved: string;
    explanation: string;
    target: { type: "bullet" | "summary"; experienceIndex?: number; bulletIndex?: number };
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Find the related content in resume
  const findRelatedContent = (): { type: "bullet" | "summary"; text: string; experienceIndex?: number; bulletIndex?: number } | null => {
    // Check if evidence is from summary
    if (resume.summary.toLowerCase().includes(match.evidence.toLowerCase().slice(0, 30))) {
      return { type: "summary", text: resume.summary };
    }
    
    // Search through experience bullets
    for (let expIdx = 0; expIdx < resume.experience.length; expIdx++) {
      const exp = resume.experience[expIdx];
      for (let bulletIdx = 0; bulletIdx < exp.bullets.length; bulletIdx++) {
        const bullet = exp.bullets[bulletIdx];
        // Check for overlap with evidence
        if (bullet.toLowerCase().includes(match.evidence.toLowerCase().slice(0, 20))) {
          return { type: "bullet", text: bullet, experienceIndex: expIdx, bulletIndex: bulletIdx };
        }
      }
    }
    
    // Default to first experience first bullet if we can't find match
    if (resume.experience.length > 0 && resume.experience[0].bullets.length > 0) {
      return { type: "bullet", text: resume.experience[0].bullets[0], experienceIndex: 0, bulletIndex: 0 };
    }
    
    return null;
  };

  const handleGenerateImprovement = async () => {
    const related = findRelatedContent();
    if (!related) {
      toast.error("Could not find related content to improve");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-bullet", {
        body: {
          bulletId: `match-${match.requirement}`,
          sectionType: related.type,
          jobDescription,
          currentText: related.text,
          action: "strengthen",
          targetRequirement: match.requirement,
        },
      });

      if (error) throw error;

      if (data?.improvedBullet) {
        setImprovement({
          original: related.text,
          improved: data.improvedBullet,
          explanation: data.changes || "Strengthened alignment with job requirements",
          target: {
            type: related.type,
            experienceIndex: related.experienceIndex,
            bulletIndex: related.bulletIndex,
          },
        });
        setEditValue(data.improvedBullet);
      }
    } catch (error) {
      console.error("Failed to generate improvement:", error);
      toast.error("Failed to generate improvement. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (!improvement) return;
    
    const valueToApply = isEditing ? editValue : improvement.improved;
    
    if (improvement.target.type === "summary") {
      onSummaryUpdate(valueToApply);
    } else if (improvement.target.experienceIndex !== undefined && improvement.target.bulletIndex !== undefined) {
      onBulletUpdate(improvement.target.experienceIndex, improvement.target.bulletIndex, valueToApply);
    }
    
    toast.success("Improvement applied!");
    onActionApplied();
  };

  const handleSkip = () => {
    onActionSkipped();
  };

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{match.requirement}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
            You have: "{match.evidence}"
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200/50 dark:border-amber-800/50 pt-3">
          {/* Before generating improvement */}
          {!improvement && !isLoading && (
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Current evidence:</p>
                <p className="text-sm text-foreground">{match.evidence}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateImprovement}
                  size="sm"
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggest Improvement
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating improvement...</span>
            </div>
          )}

          {/* Show improvement with before/after */}
          {improvement && (
            <div className="space-y-3">
              {/* Before */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Before:</p>
                <p className="text-sm text-muted-foreground line-through">
                  {improvement.original}
                </p>
              </div>

              {/* After (editable) */}
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-primary">After:</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="h-6 text-xs gap-1 text-muted-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                    {isEditing ? "Preview" : "Edit"}
                  </Button>
                </div>
                {isEditing ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="min-h-[80px] text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">
                    {editValue || improvement.improved}
                  </p>
                )}
              </div>

              {/* Explanation */}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                {improvement.explanation}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImprovement(null);
                    setIsEditing(false);
                  }}
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Regenerate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Skip
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

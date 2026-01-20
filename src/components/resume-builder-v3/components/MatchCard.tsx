/**
 * MatchCard - Clean, minimal actionable card for partial matches
 * Modern design with subtle borders and clear hierarchy
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Sparkles,
  Check,
  RotateCcw,
  Loader2,
  Pencil,
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
  const [isLoading, setIsLoading] = useState(false);
  const [improvement, setImprovement] = useState<{
    original: string;
    improved: string;
    explanation: string;
    target: { type: "bullet" | "summary"; experienceIndex?: number; bulletIndex?: number };
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const findRelatedContent = (): { type: "bullet" | "summary"; text: string; experienceIndex?: number; bulletIndex?: number } | null => {
    if (resume.summary.toLowerCase().includes(match.evidence.toLowerCase().slice(0, 30))) {
      return { type: "summary", text: resume.summary };
    }
    
    for (let expIdx = 0; expIdx < resume.experience.length; expIdx++) {
      const exp = resume.experience[expIdx];
      for (let bulletIdx = 0; bulletIdx < exp.bullets.length; bulletIdx++) {
        const bullet = exp.bullets[bulletIdx];
        if (bullet.toLowerCase().includes(match.evidence.toLowerCase().slice(0, 20))) {
          return { type: "bullet", text: bullet, experienceIndex: expIdx, bulletIndex: bulletIdx };
        }
      }
    }
    
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
        const message =
          (error as any)?.message ||
          (typeof error === "string" ? error : null) ||
          "Failed to generate improvement. Please try again.";
        toast.error(message);
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

  return (
    <div className="border border-border rounded-lg hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="p-4">
        <h4 className="font-medium text-foreground">{match.requirement}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Current: "{match.evidence}"
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Initial state - show button */}
        {!improvement && !isLoading && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleGenerateImprovement}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Suggest Improvement
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onActionSkipped}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Generating improvement...</span>
          </div>
        )}

        {/* Show improvement */}
        {improvement && (
          <div className="space-y-4">
            {/* Before/After */}
            <div className="grid gap-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</span>
                <p className="text-sm text-muted-foreground mt-1 line-through decoration-muted-foreground/30">
                  {improvement.original}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">After</span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <Pencil className="h-3 w-3" />
                    {isEditing ? "Preview" : "Edit"}
                  </button>
                </div>
                {isEditing ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="mt-1 min-h-[80px] text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground mt-1">
                    {editValue || improvement.improved}
                  </p>
                )}
              </div>
            </div>

            {/* Why this change */}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              {improvement.explanation}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Button size="sm" onClick={handleAccept} className="gap-2">
                <Check className="h-4 w-4" />
                Accept
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImprovement(null);
                  setIsEditing(false);
                  handleGenerateImprovement();
                }}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onActionSkipped}
                className="text-muted-foreground ml-auto"
              >
                Skip
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

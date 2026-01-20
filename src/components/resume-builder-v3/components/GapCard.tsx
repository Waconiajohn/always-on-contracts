/**
 * GapCard - Actionable card for missing requirements
 * Shows what's missing, why it matters, and offers to add a bullet or skill
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Check,
  X,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";

interface GapCardProps {
  gap: FitAnalysisResult["gaps"][0];
  resume: OptimizedResume;
  jobDescription: string;
  onBulletAdd: (experienceIndex: number, newBullet: string) => void;
  onSkillAdd: (skill: string) => void;
  onActionApplied: () => void;
  onActionSkipped: () => void;
}

const SEVERITY_CONFIG = {
  critical: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
    label: "Critical",
  },
  moderate: {
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900",
    label: "Should Have",
  },
  minor: {
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900",
    label: "Nice to Have",
  },
};

export function GapCard({
  gap,
  resume,
  jobDescription,
  onBulletAdd,
  onSkillAdd,
  onActionApplied,
  onActionSkipped,
}: GapCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedBullet, setSuggestedBullet] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [selectedExperience, setSelectedExperience] = useState<string>("0");
  const [showQuestion, setShowQuestion] = useState(false);

  const config = SEVERITY_CONFIG[gap.severity];

  // Check if this is likely a skill gap vs experience gap
  const isSkillGap = gap.requirement.toLowerCase().includes("skill") ||
    gap.requirement.split(" ").length <= 3 ||
    /^[A-Z][a-z]+(\s[A-Z][a-z]+)?$/.test(gap.requirement);

  const handleGenerateBullet = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-bullet", {
        body: {
          bulletId: `gap-${gap.requirement}`,
          sectionType: "experience",
          jobDescription,
          currentText: "", // No current text - we're adding new
          action: "regenerate",
          targetRequirement: gap.requirement,
          // Context from the experience to match voice
          contextBullets: resume.experience[parseInt(selectedExperience)]?.bullets.slice(0, 2),
        },
      });

      if (error) throw error;

      if (data?.improvedBullet) {
        setSuggestedBullet(data.improvedBullet);
        setEditValue(data.improvedBullet);
      }
    } catch (error) {
      console.error("Failed to generate bullet:", error);
      toast.error("Failed to generate suggestion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBullet = () => {
    const bulletToAdd = isEditing ? editValue : suggestedBullet;
    if (!bulletToAdd) return;
    
    onBulletAdd(parseInt(selectedExperience), bulletToAdd);
    toast.success("Bullet added to experience!");
    onActionApplied();
  };

  const handleAddAsSkill = () => {
    // Extract the core skill from the requirement
    const skill = gap.requirement.split(" ").slice(0, 3).join(" ");
    onSkillAdd(skill);
    toast.success(`Added "${skill}" to skills`);
    onActionApplied();
  };

  const handleSkip = () => {
    onActionSkipped();
  };

  return (
    <div className={cn("rounded-lg border overflow-hidden", config.bgColor)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start justify-between p-4 text-left hover:bg-white/30 dark:hover:bg-black/10 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{gap.requirement}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {gap.suggestion}
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
        <div className="px-4 pb-4 space-y-3 border-t border-current/10 pt-3">
          {/* Question prompt for gaps that need user input */}
          {!suggestedBullet && !isLoading && !showQuestion && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {isSkillGap ? (
                  <Button
                    size="sm"
                    onClick={handleAddAsSkill}
                    className="gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add to Skills
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      onClick={() => setShowQuestion(true)}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Help Me Add This
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  I Don't Have This
                </Button>
              </div>
            </div>
          )}

          {/* Question phase - ask which experience to add to */}
          {showQuestion && !suggestedBullet && !isLoading && (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg">
                <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Where did you demonstrate this?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the job where you can add evidence of: {gap.requirement}
                  </p>
                </div>
              </div>

              <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                <SelectTrigger className="bg-white dark:bg-gray-900">
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  {resume.experience.map((exp, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {exp.title} at {exp.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleGenerateBullet}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Bullet
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuestion(false)}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-900 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating bullet...</span>
            </div>
          )}

          {/* Suggested bullet */}
          {suggestedBullet && (
            <div className="space-y-3">
              <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-primary">Suggested bullet:</p>
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
                    {editValue || suggestedBullet}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Adding to: <span className="font-medium">{resume.experience[parseInt(selectedExperience)]?.title}</span> at {resume.experience[parseInt(selectedExperience)]?.company}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAddBullet}
                  className="gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Add Bullet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateBullet}
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

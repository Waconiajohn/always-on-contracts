/**
 * GapCard - Clean, minimal actionable card for missing requirements
 * Modern design with subtle borders and clear hierarchy
 * Includes skill currency detection to suggest more recent roles
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
  RotateCcw,
  Loader2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FitAnalysisResult, OptimizedResume } from "@/types/resume-builder-v3";
import { SkillCurrencyPrompt } from "./SkillCurrencyPrompt";
import { findMoreRecentExperiences, getRecencyStatus } from "@/lib/gapSectionMatcher";

interface GapCardProps {
  gap: FitAnalysisResult["gaps"][0];
  resume: OptimizedResume;
  jobDescription: string;
  onBulletAdd: (experienceIndex: number, newBullet: string) => void;
  onSkillAdd: (skill: string) => void;
  onActionApplied: () => void;
  onActionSkipped: () => void;
}

export function GapCard({
  gap,
  resume,
  jobDescription,
  onBulletAdd,
  onSkillAdd,
  onActionApplied,
  onActionSkipped,
}: GapCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedBullet, setSuggestedBullet] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [selectedExperience, setSelectedExperience] = useState<string>("0");
  const [step, setStep] = useState<"initial" | "select" | "generated">("initial");
  
  // Skill currency prompt state
  const [showCurrencyPrompt, setShowCurrencyPrompt] = useState(false);
  const [pendingBullet, setPendingBullet] = useState<string | null>(null);
  const [moreRecentExperiences, setMoreRecentExperiences] = useState<
    Array<{ index: number; title: string; company: string; dates: string }>
  >([]);

  // Check if this is likely a skill gap
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
          currentText: "",
          action: "regenerate",
          targetRequirement: gap.requirement,
          contextBullets: resume.experience[parseInt(selectedExperience)]?.bullets.slice(0, 2),
        },
      });

      if (error) throw error;

      if (data?.improvedBullet) {
        setSuggestedBullet(data.improvedBullet);
        setEditValue(data.improvedBullet);
        setStep("generated");
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
    
    const expIndex = parseInt(selectedExperience);
    const selectedExp = resume.experience[expIndex];
    
    // Check for more recent experiences where this skill could go
    const recentExps = findMoreRecentExperiences(expIndex, bulletToAdd, resume);
    
    // If the selected role is dated/stale and there are more recent options, show prompt
    const recency = getRecencyStatus(selectedExp?.dates || '');
    if (recency !== 'recent' && recentExps.length > 0) {
      setPendingBullet(bulletToAdd);
      setMoreRecentExperiences(recentExps);
      setShowCurrencyPrompt(true);
      return;
    }
    
    // Otherwise, add directly
    onBulletAdd(expIndex, bulletToAdd);
    toast.success("Bullet added!");
    onActionApplied();
  };

  const handleCurrencySelection = (experienceIndex: number) => {
    if (pendingBullet) {
      onBulletAdd(experienceIndex, pendingBullet);
      toast.success(`Bullet added to ${resume.experience[experienceIndex]?.title || 'experience'}!`);
      onActionApplied();
      setPendingBullet(null);
      setShowCurrencyPrompt(false);
    }
  };

  const handleAddAsSkill = () => {
    const skill = gap.requirement.split(" ").slice(0, 3).join(" ");
    onSkillAdd(skill);
    toast.success(`Added "${skill}" to skills`);
    onActionApplied();
  };

  const severityLabel = gap.severity === "critical" ? "Required" : 
    gap.severity === "moderate" ? "Preferred" : "Nice to have";

  // Format experience options with dates
  const experienceOptions = resume.experience.map((exp, idx) => {
    const recency = getRecencyStatus(exp.dates);
    return {
      index: idx,
      label: `${exp.title} at ${exp.company}`,
      dates: exp.dates,
      recency,
    };
  });

  return (
    <>
      <div className="border border-border rounded-lg hover:border-primary/30 transition-colors">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-foreground">{gap.requirement}</h4>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full flex-shrink-0",
              gap.severity === "critical" 
                ? "bg-destructive/10 text-destructive" 
                : "bg-muted text-muted-foreground"
            )}>
              {severityLabel}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{gap.suggestion}</p>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {/* Initial state */}
          {step === "initial" && !isLoading && (
            <div className="flex flex-wrap items-center gap-2">
              {isSkillGap ? (
                <Button
                  size="sm"
                  onClick={handleAddAsSkill}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add to Skills
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Bullet
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onActionSkipped}
                className="text-muted-foreground"
              >
                I don't have this
              </Button>
            </div>
          )}

          {/* Select experience step */}
          {step === "select" && !isLoading && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Which role should include this?
              </p>
              
              <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {experienceOptions.map((exp) => (
                    <SelectItem key={exp.index} value={exp.index.toString()}>
                      <div className="flex items-center gap-2 w-full">
                        <span className="truncate">{exp.label}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded ml-auto",
                          exp.recency === 'recent' && "bg-primary/10 text-primary",
                          exp.recency === 'dated' && "bg-muted text-muted-foreground",
                          exp.recency === 'stale' && "bg-destructive/10 text-destructive"
                        )}>
                          {exp.dates}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleGenerateBullet}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("initial")}
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating bullet...</span>
            </div>
          )}

          {/* Generated bullet */}
          {step === "generated" && suggestedBullet && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    Suggested Bullet
                  </span>
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
                    className="mt-2 min-h-[80px] text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground mt-2">
                    {editValue || suggestedBullet}
                  </p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Adding to: <span className="font-medium">{resume.experience[parseInt(selectedExperience)]?.title}</span>
                <span className="ml-1 text-muted-foreground/70">
                  ({resume.experience[parseInt(selectedExperience)]?.dates})
                </span>
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button size="sm" onClick={handleAddBullet} className="gap-2">
                  <Check className="h-4 w-4" />
                  Add Bullet
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateBullet}
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

      {/* Skill Currency Prompt */}
      <SkillCurrencyPrompt
        open={showCurrencyPrompt}
        onOpenChange={setShowCurrencyPrompt}
        bulletText={pendingBullet || ""}
        originalExperience={{
          index: parseInt(selectedExperience),
          title: resume.experience[parseInt(selectedExperience)]?.title || "",
          company: resume.experience[parseInt(selectedExperience)]?.company || "",
          dates: resume.experience[parseInt(selectedExperience)]?.dates || "",
        }}
        alternativeExperiences={moreRecentExperiences}
        onSelectExperience={handleCurrencySelection}
      />
    </>
  );
}

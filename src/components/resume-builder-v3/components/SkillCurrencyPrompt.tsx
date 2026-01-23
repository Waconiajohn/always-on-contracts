/**
 * SkillCurrencyPrompt - Suggests moving content to more recent roles
 * Shows when a user adds content to an older job
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Sparkles, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRecencyStatus } from "@/lib/gapSectionMatcher";

interface Experience {
  index: number;
  title: string;
  company: string;
  dates: string;
}

interface SkillCurrencyPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bulletText: string;
  originalExperience: Experience;
  alternativeExperiences: Experience[];
  onSelectExperience: (experienceIndex: number) => void;
}

export function SkillCurrencyPrompt({
  open,
  onOpenChange,
  bulletText,
  originalExperience,
  alternativeExperiences,
  onSelectExperience,
}: SkillCurrencyPromptProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    alternativeExperiences[0]?.index ?? originalExperience.index
  );

  const handleConfirm = () => {
    onSelectExperience(selectedIndex);
    onOpenChange(false);
  };

  const handleKeepOriginal = () => {
    onSelectExperience(originalExperience.index);
    onOpenChange(false);
  };

  const allOptions = [
    ...alternativeExperiences.map(exp => ({
      ...exp,
      recency: getRecencyStatus(exp.dates),
      isRecommended: exp.index === alternativeExperiences[0]?.index,
    })),
    {
      ...originalExperience,
      recency: getRecencyStatus(originalExperience.dates),
      isRecommended: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Show You're Current
          </DialogTitle>
          <DialogDescription>
            This skill could go in a more recent role to demonstrate you're still using it.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Bullet preview */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Adding this bullet:</p>
            <p className="text-sm text-foreground line-clamp-3">{bulletText}</p>
          </div>

          {/* Role options */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Where should it go?</p>
            
            <RadioGroup
              value={selectedIndex.toString()}
              onValueChange={(val) => setSelectedIndex(parseInt(val))}
              className="space-y-2"
            >
              {allOptions.map((exp) => (
                <div
                  key={exp.index}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                    selectedIndex === exp.index 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <RadioGroupItem value={exp.index.toString()} id={`exp-${exp.index}`} />
                  <Label 
                    htmlFor={`exp-${exp.index}`} 
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {exp.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {exp.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          exp.recency === 'recent' && "bg-primary/10 text-primary",
                          exp.recency === 'dated' && "bg-muted text-muted-foreground",
                          exp.recency === 'stale' && "bg-destructive/10 text-destructive"
                        )}>
                          {exp.dates}
                        </span>
                        {exp.isRecommended && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <Sparkles className="h-3 w-3" />
                            Best
                          </span>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Tip */}
          <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg">
            <Clock className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> Adding skills to your most recent roles 
              shows employers you're actively using them. Avoid listing the same skill in multiple jobs.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleKeepOriginal}>
            Keep in {originalExperience.company.split(' ')[0]}
          </Button>
          <Button onClick={handleConfirm}>
            Add to Selected Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AlternativeVersionsPanel - Display conservative/moderate/aggressive rewrites
 * Uses the useRefinementSuggestions hook to fetch multiple versions
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Zap, 
  Flame, 
  Check, 
  X, 
  Loader2,
  Lightbulb
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlternativeVersions {
  conservative: string;
  moderate: string;
  aggressive: string;
}

interface AlternativeVersionsPanelProps {
  versions: AlternativeVersions;
  isLoading: boolean;
  onSelect: (bullet: string) => void;
  onCancel: () => void;
  currentBullet: string;
}

const VERSION_CONFIG = {
  conservative: {
    id: "conservative",
    label: "Conservative",
    description: "Minor improvements, preserves your voice",
    icon: Shield,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
  },
  moderate: {
    id: "moderate",
    label: "Moderate",
    description: "Balanced rewrite with keyword optimization",
    icon: Zap,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
  },
  aggressive: {
    id: "aggressive",
    label: "Aggressive",
    description: "Maximum impact for ATS and recruiters",
    icon: Flame,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
  },
} as const;

export function AlternativeVersionsPanel({
  versions,
  isLoading,
  onSelect,
  onCancel,
  currentBullet,
}: AlternativeVersionsPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<keyof AlternativeVersions | null>(null);

  if (isLoading) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Generating alternative versions...
          </span>
        </div>
      </div>
    );
  }

  const versionEntries = Object.entries(VERSION_CONFIG) as [keyof AlternativeVersions, typeof VERSION_CONFIG[keyof typeof VERSION_CONFIG]][];

  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lightbulb className="h-4 w-4 text-primary" />
        <span>Choose rewrite intensity</span>
      </div>

      <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
        <span className="font-medium">Current:</span> {currentBullet}
      </div>

      <RadioGroup
        value={selectedVersion || undefined}
        onValueChange={(v) => setSelectedVersion(v as keyof AlternativeVersions)}
        className="space-y-3"
      >
        {versionEntries.map(([key, config]) => {
          const Icon = config.icon;
          const bulletText = versions[key];
          
          if (!bulletText) return null;
          
          return (
            <div
              key={key}
              className={cn(
                "relative flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                selectedVersion === key
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onClick={() => setSelectedVersion(key)}
            >
              <RadioGroupItem
                value={key}
                id={key}
                className="mt-1"
              />
              <Label
                htmlFor={key}
                className="flex-1 cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded", config.bgClass)}>
                    <Icon className={cn("h-3.5 w-3.5", config.colorClass)} />
                  </div>
                  <span className="font-medium text-sm">{config.label}</span>
                  <span className="text-xs text-muted-foreground">
                    — {config.description}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed pl-7">
                  {bulletText}
                </p>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          onClick={() => selectedVersion && onSelect(versions[selectedVersion])}
          disabled={!selectedVersion}
          className="gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          Use Selected
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

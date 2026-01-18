/**
 * BulletOptionsPanel - Display multiple AI-generated bullet variations
 * Shows 3 strategic angles: Metrics-Focused, Scope-Focused, Narrative-Focused
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Check, 
  X, 
  Loader2,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulletOption {
  id: string;
  label: string;
  bullet: string;
  emphasis: string;
}

interface BulletOptionsPanelProps {
  options: BulletOption[];
  isLoading: boolean;
  onSelect: (bullet: string) => void;
  onCancel: () => void;
  currentBullet?: string;
}

const OPTION_ICONS: Record<string, typeof BarChart3> = {
  A: BarChart3, // Metrics
  B: Users,     // Scope
  C: BookOpen,  // Narrative
};

const OPTION_COLORS: Record<string, string> = {
  A: "text-blue-500",
  B: "text-green-500",
  C: "text-purple-500",
};

export function BulletOptionsPanel({
  options,
  isLoading,
  onSelect,
  onCancel,
  currentBullet,
}: BulletOptionsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">
            Generating 3 strategic bullet options...
          </span>
        </div>
      </div>
    );
  }

  if (options.length === 0) {
    return null;
  }

  const selectedOption = options.find(o => o.id === selectedId);

  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Choose your preferred style</span>
      </div>

      {currentBullet && (
        <div className="text-xs text-muted-foreground bg-background/50 rounded p-2">
          <span className="font-medium">Current:</span> {currentBullet}
        </div>
      )}

      <RadioGroup
        value={selectedId || undefined}
        onValueChange={setSelectedId}
        className="space-y-3"
      >
        {options.map((option) => {
          const Icon = OPTION_ICONS[option.id] || Sparkles;
          const colorClass = OPTION_COLORS[option.id] || "text-primary";
          
          return (
            <div
              key={option.id}
              className={cn(
                "relative flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                selectedId === option.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
              onClick={() => setSelectedId(option.id)}
            >
              <RadioGroupItem
                value={option.id}
                id={option.id}
                className="mt-1"
              />
              <Label
                htmlFor={option.id}
                className="flex-1 cursor-pointer space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", colorClass)} />
                  <span className="font-medium text-sm">{option.label}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {option.bullet}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {option.emphasis}
                </p>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      <div className="flex items-center gap-2 pt-2">
        <Button
          size="sm"
          onClick={() => selectedOption && onSelect(selectedOption.bullet)}
          disabled={!selectedId}
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

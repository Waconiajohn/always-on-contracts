import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, X, ArrowRight } from "lucide-react";
import { EnrichmentSuggestion } from "@/types/master-resume";

interface EnrichmentPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: EnrichmentSuggestion[];
  onAddSelected: (items: EnrichmentSuggestion[]) => void;
  onSkip: () => void;
  isAdding: boolean;
}

export const EnrichmentPrompt = ({
  open,
  onOpenChange,
  suggestions,
  onAddSelected,
  onSkip,
  isAdding,
}: EnrichmentPromptProps) => {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(
    new Set(suggestions.map((_, i) => i))
  );

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const handleAddSelected = () => {
    const items = suggestions.filter((_, i) => selectedItems.has(i));
    onAddSelected(items);
  };

  const getTypeBadge = (type: EnrichmentSuggestion['type']) => {
    switch (type) {
      case 'bullet':
        return <Badge variant="secondary">Experience</Badge>;
      case 'skill':
        return <Badge variant="outline">Skill</Badge>;
      case 'achievement':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Achievement</Badge>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Grow Your Master Resume
          </DialogTitle>
          <DialogDescription>
            We found new content in your optimized resume. Add it to your Master Resume 
            so it keeps getting more comprehensive over time.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] mt-4">
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedItems.has(index)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                }`}
                onClick={() => toggleItem(index)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedItems.has(index)}
                    onCheckedChange={() => toggleItem(index)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(suggestion.type)}
                      {suggestion.confidence >= 0.8 && (
                        <Badge variant="outline" className="text-xs">
                          High confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{suggestion.content}</p>
                    {suggestion.sourceContext && (
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {suggestion.sourceContext}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onSkip} disabled={isAdding}>
            <X className="h-4 w-4 mr-2" />
            Skip for now
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedItems.size === 0 || isAdding}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

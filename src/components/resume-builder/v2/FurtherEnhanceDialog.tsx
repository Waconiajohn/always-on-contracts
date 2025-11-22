import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";

interface FurtherEnhanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalBullet: string;
  currentEnhancedBullet: string;
  requirement: string;
  onEnhanced: (newBullet: string) => void;
  jobContext?: string;
}

const QUICK_PROMPTS = [
  { label: "More Quantifiable", value: "quantifiable", description: "Add metrics and numbers" },
  { label: "More Technical", value: "technical", description: "Add technical details" },
  { label: "Emphasize Leadership", value: "leadership", description: "Highlight leadership aspects" },
];

export const FurtherEnhanceDialog = ({
  open,
  onOpenChange,
  originalBullet,
  currentEnhancedBullet,
  requirement,
  onEnhanced,
  jobContext
}: FurtherEnhanceDialogProps) => {
  const [userGuidance, setUserGuidance] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async (guidance: string) => {
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('further-enhance-bullet', {
        body: {
          originalBullet,
          currentEnhancedBullet,
          requirement,
          userGuidance: guidance,
          jobContext
        }
      });

      if (error) throw error;

      if (data?.enhancedBullet) {
        onEnhanced(data.enhancedBullet);
        toast.success("Bullet enhanced successfully");
        onOpenChange(false);
        setUserGuidance("");
      } else {
        throw new Error("No enhanced bullet returned");
      }
    } catch (error) {
      console.error("Error enhancing bullet:", error);
      toast.error("Failed to enhance bullet");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Further Enhance This Bullet
          </DialogTitle>
          <DialogDescription>
            Tell us how to improve this bullet, or choose a quick enhancement option
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Bullet */}
          <div>
            <label className="text-sm font-medium">Current Enhanced Version:</label>
            <div className="mt-1 p-3 bg-muted rounded text-sm">
              {currentEnhancedBullet}
            </div>
          </div>

          {/* Requirement Context */}
          <div>
            <label className="text-sm font-medium">Addressing:</label>
            <div className="mt-1 p-2 bg-blue-50 rounded text-sm text-blue-900">
              {requirement}
            </div>
          </div>

          {/* Quick Prompts */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quick Enhancements:</label>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.value}
                  variant="outline"
                  size="sm"
                  className="h-auto flex-col items-start p-3"
                  onClick={() => handleEnhance(prompt.value)}
                  disabled={isEnhancing}
                >
                  <span className="font-medium text-xs">{prompt.label}</span>
                  <span className="text-xs text-muted-foreground">{prompt.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Guidance */}
          <div>
            <label className="text-sm font-medium mb-2 block">Or provide custom guidance:</label>
            <Textarea
              value={userGuidance}
              onChange={(e) => setUserGuidance(e.target.value)}
              placeholder="E.g., 'Add more detail about the technology stack used' or 'Emphasize the cross-functional collaboration'"
              className="min-h-[80px]"
            />
            <Button
              onClick={() => handleEnhance(userGuidance)}
              disabled={!userGuidance.trim() || isEnhancing}
              className="mt-2 w-full"
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enhancing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Apply Custom Enhancement
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

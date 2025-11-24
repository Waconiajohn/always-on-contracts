import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StrategicCoachDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: {
    originalText: string;
    itemId?: string;
    itemType?: string;
    positionId?: string;
    vaultId: string;
    positionTitle?: string;
    marketContext?: any; // Gap data, requirements, etc.
  };
  onApply: (improvedText: string) => void;
}

export const StrategicCoachDrawer = ({
  open,
  onOpenChange,
  context,
  onApply
}: StrategicCoachDrawerProps) => {
  const [userQuery, setUserQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    suggestion: string;
    strategy: string;
    reasoning: string;
  } | null>(null);

  const handleAskCoach = async () => {
    if (!userQuery.trim()) {
      toast.error("Please describe what you want to improve");
      return;
    }

    setIsLoading(true);
    setAiResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          mode: 'expand',
          originalText: context.originalText,
          itemId: context.itemId,
          itemType: context.itemType,
          positionId: context.positionId,
          vaultId: context.vaultId,
          userQuery,
          marketContext: context.marketContext,
          positionTitle: context.positionTitle
        }
      });

      if (error) throw error;

      if (data?.suggestion) {
        setAiResponse({
          suggestion: data.suggestion,
          strategy: data.strategy || "",
          reasoning: data.reasoning || ""
        });
      } else {
        throw new Error("No response from AI coach");
      }
    } catch (error) {
      console.error("Strategic coach error:", error);
      toast.error("Failed to get strategic advice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (!aiResponse) return;
    onApply(aiResponse.suggestion);
    setAiResponse(null);
    setUserQuery("");
    onOpenChange(false);
    toast.success("Applied strategic improvements!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Strategic Career Coach
          </SheetTitle>
          <SheetDescription>
            Get deep, context-aware guidance on how to position your experience for maximum impact.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Context Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Text:</label>
            <div className="p-3 rounded-md border bg-muted text-sm">
              {context.originalText}
            </div>
            {context.positionTitle && (
              <p className="text-xs text-muted-foreground">
                Position: {context.positionTitle}
              </p>
            )}
          </div>

          {/* User Query Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              What do you want to improve?
            </label>
            <Textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Examples:
• 'Make this more executive-level'
• 'Emphasize my leadership of a remote team'
• 'Add technical depth around the cloud migration'
• 'Connect this to the market need for AI/ML skills'"
              className="min-h-[120px]"
              disabled={isLoading}
            />
            <Button
              onClick={handleAskCoach}
              disabled={isLoading || !userQuery.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Get Strategic Advice
                </>
              )}
            </Button>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="space-y-4 p-4 rounded-lg border bg-accent/30 animate-fade-in">
              {/* Strategy Card */}
              {aiResponse.strategy && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Strategy:
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {aiResponse.strategy}
                  </p>
                </div>
              )}

              {/* Improved Text */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Improved Version:</label>
                <div className="p-3 rounded-md border bg-background text-sm">
                  {aiResponse.suggestion}
                </div>
              </div>

              {/* Reasoning */}
              {aiResponse.reasoning && (
                <div className="text-xs text-muted-foreground italic">
                  💡 {aiResponse.reasoning}
                </div>
              )}

              {/* Apply Button */}
              <Button onClick={handleApply} className="w-full">
                Apply Strategic Improvements
              </Button>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <h3 className="text-sm font-semibold mb-2">💡 Pro Tips:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Be specific about what you want to emphasize</li>
              <li>• Mention the target role or industry if relevant</li>
              <li>• Ask about connecting to market gaps we identified</li>
              <li>• Request executive-level language for senior positions</li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

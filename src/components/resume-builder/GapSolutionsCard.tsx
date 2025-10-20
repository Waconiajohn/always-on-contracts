import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Plus, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GapSolution {
  approach: 'pure_ai' | 'vault_based' | 'alternative';
  title: string;
  content: string;
  reasoning: string;
}

interface GapSolutionsCardProps {
  requirement: string;
  vaultMatches: any[];
  jobContext: {
    title: string;
    industry: string;
    seniority: string;
  };
  onAddToVault?: (solution: string) => void;
}

export const GapSolutionsCard = ({
  requirement,
  vaultMatches,
  jobContext,
  onAddToVault
}: GapSolutionsCardProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [solutions, setSolutions] = useState<GapSolution[]>([]);

  const handleGenerateSolutions = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-gap-solutions', {
        body: {
          requirement,
          vault_items: vaultMatches.slice(0, 5), // Top 5 relevant matches
          job_title: jobContext.title,
          industry: jobContext.industry,
          seniority: jobContext.seniority
        }
      });

      if (error) throw error;

      setSolutions(data.solutions || []);
      setIsExpanded(true);

      toast({
        title: "Solutions generated",
        description: "Review 3 approaches to address this gap"
      });

    } catch (error) {
      console.error('Error generating gap solutions:', error);
      toast({
        title: "Generation failed",
        description: "Could not generate solutions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToVault = (solution: GapSolution) => {
    if (onAddToVault) {
      onAddToVault(solution.content);
    }
    toast({
      title: "Added to vault",
      description: "This solution has been saved to your Career Vault"
    });
  };

  return (
    <Card className="p-4 border-warning/30">
      <div className="space-y-3">
        {/* Requirement Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-medium text-sm mb-1">{requirement}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => isExpanded ? setIsExpanded(false) : handleGenerateSolutions()}
            disabled={isGenerating}
            className="flex-shrink-0"
          >
            {isGenerating ? (
              "Generating..."
            ) : isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <Lightbulb className="h-3 w-3 mr-1" />
                Show Solutions
              </>
            )}
          </Button>
        </div>

        {/* Expanded Solutions */}
        {isExpanded && solutions.length > 0 && (
          <Tabs defaultValue="pure_ai" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pure_ai" className="text-xs">
                💎 Pure AI
              </TabsTrigger>
              <TabsTrigger value="vault_based" className="text-xs">
                ⭐ From Vault
              </TabsTrigger>
              <TabsTrigger value="alternative" className="text-xs">
                🎯 Alternative
              </TabsTrigger>
            </TabsList>

            {solutions.map((solution) => (
              <TabsContent
                key={solution.approach}
                value={solution.approach}
                className="space-y-3 mt-3"
              >
                <div className="p-3 bg-card rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{solution.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {solution.approach === 'pure_ai' ? 'Industry Standard' :
                       solution.approach === 'vault_based' ? 'Your Experience' :
                       'Transferable'}
                    </Badge>
                  </div>

                  <p className="text-sm mb-3 whitespace-pre-line">
                    {solution.content}
                  </p>

                  <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                    <span className="font-medium">Why this works: </span>
                    {solution.reasoning}
                  </div>

                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAddToVault(solution)}
                    className="w-full gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add This to Career Vault
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Default Quick Actions (when not expanded) */}
        {!isExpanded && (
          <div className="flex gap-2 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSolutions}
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? "Generating..." : "See AI Solutions"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

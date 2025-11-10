import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Edit2, Save, X, CheckCircle2, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction, GenerateGapSolutionsSchema, safeValidateInput } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [solutions, setSolutions] = useState<GapSolution[]>([]);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [addedSolution, setAddedSolution] = useState<string | null>(null);

  const handleGenerateSolutions = async () => {
    setIsGenerating(true);
    
    try {
      const payload = {
        requirement,
        vault_items: vaultMatches.slice(0, 5),
        job_title: jobContext.title,
        industry: jobContext.industry,
        seniority: jobContext.seniority
      };

      const validation = safeValidateInput(GenerateGapSolutionsSchema, payload);
      if (!validation.success) {
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        'generate-gap-solutions',
        payload
      );

      if (error) {
        logger.error('Failed to generate gap solutions', error);
        setIsGenerating(false);
        return;
      }

      setSolutions(data?.solutions || []);

    } catch (error) {
      logger.error('Error generating gap solutions', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerateSolutions();
  }, [requirement]);

  const handleAddToVault = (solution: GapSolution) => {
    const contentToAdd = editingContent[solution.approach] || solution.content;
    if (onAddToVault) {
      onAddToVault(contentToAdd);
    }
    
    setAddedSolution(solution.approach);
    
    toast({
      title: "Added to vault",
      description: "This solution has been saved to your Career Vault"
    });
  };

  const handleStartEdit = (approach: string, content: string) => {
    setEditingContent({ ...editingContent, [approach]: content });
    setIsEditing({ ...isEditing, [approach]: true });
  };

  const handleSaveEdit = (approach: string) => {
    setIsEditing({ ...isEditing, [approach]: false });
    toast({
      title: "Changes saved",
      description: "Your edits have been saved"
    });
  };

  const handleCancelEdit = (approach: string, originalContent: string) => {
    setEditingContent({ ...editingContent, [approach]: originalContent });
    setIsEditing({ ...isEditing, [approach]: false });
  };

  const getApproachLabel = (approach: string) => {
    switch (approach) {
      case 'pure_ai': return 'Industry Standard';
      case 'vault_based': return 'Your Experience';
      case 'alternative': return 'Alternative Angle';
      default: return approach;
    }
  };

  return (
    <div className="space-y-4">
      {isGenerating ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating AI solutions...</p>
          </div>
        </Card>
      ) : solutions.length > 0 ? (
        <Tabs defaultValue="pure_ai" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            {solutions.map((solution) => (
              <TabsTrigger 
                key={solution.approach}
                value={solution.approach}
                className="data-[state=active]:bg-background"
              >
                {getApproachLabel(solution.approach)}
              </TabsTrigger>
            ))}
          </TabsList>

          {solutions.map((solution) => (
            <TabsContent
              key={solution.approach}
              value={solution.approach}
              className="space-y-4 mt-4"
            >
              <Card className="p-4 bg-card border">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-base font-semibold mb-1">{solution.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {getApproachLabel(solution.approach)}
                      </Badge>
                    </div>
                    {!isEditing[solution.approach] && addedSolution !== solution.approach && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartEdit(solution.approach, solution.content)}
                        className="gap-1"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {isEditing[solution.approach] ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editingContent[solution.approach] || solution.content}
                        onChange={(e) => setEditingContent({
                          ...editingContent,
                          [solution.approach]: e.target.value
                        })}
                        className="min-h-[120px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(solution.approach)}
                          className="flex-1 gap-1"
                        >
                          <Save className="h-3 w-3" />
                          Save Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelEdit(solution.approach, solution.content)}
                          className="flex-1 gap-1"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-muted/30 p-3 rounded-md border">
                        <p className="text-sm whitespace-pre-line font-mono">
                          {editingContent[solution.approach] || solution.content}
                        </p>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-md border border-primary/10">
                        <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Why this works: </span>
                          {solution.reasoning}
                        </div>
                      </div>

                      {addedSolution === solution.approach ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="w-full gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Added to Career Vault
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddToVault(solution)}
                          className="w-full gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add This to Career Vault
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
};

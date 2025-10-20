import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Edit2, Save, X, CheckCircle2 } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [solutions, setSolutions] = useState<GapSolution[]>([]);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [addedSolutions, setAddedSolutions] = useState<Record<string, boolean>>({});

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

  // Auto-generate solutions on mount
  useEffect(() => {
    handleGenerateSolutions();
  }, [requirement]);

  const handleAddToVault = (solution: GapSolution) => {
    const contentToAdd = editingContent[solution.approach] || solution.content;
    if (onAddToVault) {
      onAddToVault(contentToAdd);
    }
    
    // Mark this solution as added
    setAddedSolutions({ ...addedSolutions, [solution.approach]: true });
    
    toast({
      title: "Added to vault",
      description: "This solution has been saved to your Career Vault"
    });
  };

  const handleResetSolution = (approach: string) => {
    setAddedSolutions({ ...addedSolutions, [approach]: false });
    toast({
      title: "Ready to modify",
      description: "You can now edit and re-add this solution"
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

  return (
    <Card className="p-4 border-warning/30">
      <div className="space-y-3">
        {/* Requirement Header */}
        <div className="flex-1">
          <p className="font-medium text-sm mb-3">{requirement}</p>
        </div>

        {/* Solutions Tabs - Always visible */}
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Generating solutions...</p>
          </div>
        ) : solutions.length > 0 ? (
          <Tabs defaultValue="pure_ai" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="pure_ai" className="text-xs flex flex-col items-center py-2 px-1">
                <span className="text-base mb-1">💎</span>
                <span className="font-medium">Industry Standard</span>
                <span className="text-[10px] text-muted-foreground">AI from best practices</span>
              </TabsTrigger>
              <TabsTrigger value="vault_based" className="text-xs flex flex-col items-center py-2 px-1">
                <span className="text-base mb-1">⭐</span>
                <span className="font-medium">Your Experience</span>
                <span className="text-[10px] text-muted-foreground">AI adapts your vault</span>
              </TabsTrigger>
              <TabsTrigger value="alternative" className="text-xs flex flex-col items-center py-2 px-1">
                <span className="text-base mb-1">🎯</span>
                <span className="font-medium">Alternative Angle</span>
                <span className="text-[10px] text-muted-foreground">Working knowledge</span>
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
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {solution.approach === 'pure_ai' ? 'Industry Standard' :
                         solution.approach === 'vault_based' ? 'Your Experience' :
                         'Transferable'}
                      </Badge>
                      {!isEditing[solution.approach] && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartEdit(solution.approach, solution.content)}
                          className="h-7 px-2 gap-1"
                        >
                          <Edit2 className="h-3 w-3" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>

                  {isEditing[solution.approach] ? (
                    <div className="space-y-2">
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
                          variant="default"
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
                    <p className="text-sm mb-3 whitespace-pre-line">
                      {editingContent[solution.approach] || solution.content}
                    </p>
                  )}

                  {!isEditing[solution.approach] && (
                    <>
                      <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded">
                        <span className="font-medium">Why this works: </span>
                        {solution.reasoning}
                      </div>

                      {addedSolutions[solution.approach] ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="flex-1 gap-2"
                          >
                            <CheckCircle2 className="h-3 w-3 text-success" />
                            Already Added to Vault
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResetSolution(solution.approach)}
                            className="gap-1"
                          >
                            <Edit2 className="h-3 w-3" />
                            Choose Different
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAddToVault(solution)}
                          className="w-full gap-2"
                        >
                          <Plus className="h-3 w-3" />
                          Add This to Career Vault
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </div>
    </Card>
  );
};

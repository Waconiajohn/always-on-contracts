import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Edit2, Save, X, CheckCircle2, Lightbulb, Bookmark, BookmarkCheck, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { invokeEdgeFunction, GenerateGapSolutionsSchema, safeValidateInput } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  onUseSuggestion?: (solution: GapSolution, action: 'resume-only' | 'vault' | 'reject') => void;
}

export const GapSolutionsCard = ({
  requirement,
  vaultMatches,
  jobContext,
  onUseSuggestion
}: GapSolutionsCardProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [solutions, setSolutions] = useState<GapSolution[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [actionTaken, setActionTaken] = useState<Record<string, 'resume-only' | 'vault' | null>>({});

  const handleGenerateSolutions = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const payload = {
        requirement,
        vault_items: vaultMatches.slice(0, 5),
        job_title: jobContext.title,
        industry: jobContext.industry,
        seniority: jobContext.seniority
      };

      console.log('[GapSolutions] Generating solutions for:', requirement.substring(0, 50) + '...');

      const validation = safeValidateInput(GenerateGapSolutionsSchema, payload);
      if (!validation.success) {
        console.error('[GapSolutions] Validation failed:', validation.error);
        setError('Invalid request data. Please try again.');
        setIsGenerating(false);
        return;
      }

      const { data, error } = await invokeEdgeFunction(
        'generate-gap-solutions',
        payload
      );

      if (error) {
        console.error('[GapSolutions] Edge function error:', error);
        logger.error('Failed to generate gap solutions', error);
        setError(error.message || 'Failed to generate solutions. Please try again.');
        setIsGenerating(false);
        return;
      }

      if (!data || !data.solutions || data.solutions.length === 0) {
        console.warn('[GapSolutions] No solutions returned');
        setError('No solutions were generated. Please try again or skip this requirement.');
        setIsGenerating(false);
        return;
      }

      console.log('[GapSolutions] Generated', data.solutions.length, 'solutions');
      setSolutions(data.solutions);

    } catch (error: any) {
      console.error('[GapSolutions] Unexpected error:', error);
      logger.error('Error generating gap solutions', error);
      setError(error?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    handleGenerateSolutions();
  }, [requirement]);

  const handleUseSuggestion = (solution: GapSolution, action: 'resume-only' | 'vault' | 'reject') => {
    const contentToUse = editingContent[solution.approach] || solution.content;
    const solutionWithContent = { ...solution, content: contentToUse };
    
    if (onUseSuggestion) {
      onUseSuggestion(solutionWithContent, action);
    }
    
    if (action !== 'reject') {
      setActionTaken({ ...actionTaken, [solution.approach]: action });
    }
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
      case 'alternative': return 'Strategic Blend';
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
      ) : error ? (
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-destructive">Failed to Generate Solutions</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {error}
              </p>
            </div>
            <Button 
              onClick={handleGenerateSolutions}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Try Again
            </Button>
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
                    {!isEditing[solution.approach] && !actionTaken[solution.approach] && (
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

                      {actionTaken[solution.approach] ? (
                        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-md border border-success/20">
                          {actionTaken[solution.approach] === 'vault' ? (
                            <>
                              <BookmarkCheck className="h-4 w-4 text-success" />
                              <span className="text-sm text-success font-medium">
                                Queued for Career Vault
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-success" />
                              <span className="text-sm text-success font-medium">
                                Added to resume
                              </span>
                            </>
                          )}
                        </div>
                      ) : (
                        <TooltipProvider>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleUseSuggestion(solution, 'resume-only')}
                                    className="flex-1 gap-2"
                                  >
                                    <Plus className="h-3 w-3" />
                                    Use in resume only
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Use this for this resume without changing your Career Vault</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUseSuggestion(solution, 'vault')}
                                    className="flex-1 gap-2"
                                  >
                                    <Bookmark className="h-3 w-3" />
                                    {solution.approach === 'vault_based' ? 'Refine in Vault' : 'Add to Vault'}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {solution.approach === 'vault_based' 
                                      ? 'Refine your existing vault content with this polished version'
                                      : 'Save to Career Vault for future resumes'
                                    }
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUseSuggestion(solution, 'reject')}
                              className="w-full text-xs"
                            >
                              Not accurate
                            </Button>
                          </div>
                        </TooltipProvider>
                      )}
                    </>
                  )}
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card className="p-6 border-muted">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-muted p-3">
              <Lightbulb className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">No Solutions Available</p>
              <p className="text-sm text-muted-foreground max-w-md">
                We couldn't generate solutions for this requirement yet.
              </p>
            </div>
            <Button 
              onClick={handleGenerateSolutions}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Loader2 className="h-4 w-4" />
              Generate Solutions
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

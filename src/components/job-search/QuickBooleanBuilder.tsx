import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Sparkles, Copy } from "lucide-react";
import { validateInput, invokeEdgeFunction, GenerateBooleanSearchSchema } from "@/lib/edgeFunction";
import { logger } from "@/lib/logger";

interface QuickBooleanBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (booleanString: string) => void;
}

export const QuickBooleanBuilder = ({ open, onOpenChange, onApply }: QuickBooleanBuilderProps) => {
  const { toast } = useToast();
  const [vaultTitles, setVaultTitles] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [customTitle, setCustomTitle] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isLoadingVault, setIsLoadingVault] = useState(true);

  useEffect(() => {
    if (open) {
      loadVaultTitles();
    }
  }, [open]);

  const loadVaultTitles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vault } = await supabase
        .from('career_vault')
        .select('target_roles')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vault?.target_roles) {
        setVaultTitles(vault.target_roles);
        // Auto-select all vault titles
        setSelectedTitles(new Set(vault.target_roles));
      }
    } catch (error) {
      logger.error('Error loading vault', error);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const getAISuggestions = async () => {
    if (!customTitle.trim()) {
      toast({
        title: "Enter a job title",
        description: "Please enter a job title to get AI suggestions",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingAI(true);
    try {
      const validated = validateInput(GenerateBooleanSearchSchema, {
        jobTitle: customTitle.trim()
      });

      const { data, error } = await invokeEdgeFunction(
        'generate-boolean-search',
        validated
      );

      if (error || !data) {
        throw new Error(error?.message || 'Failed to get suggestions');
      }

      if (data.variations) {
        setAiSuggestions(data.variations);
      }
    } catch (error: any) {
      logger.error('AI suggestions failed', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const toggleTitle = (title: string) => {
    const newSelected = new Set(selectedTitles);
    if (newSelected.has(title)) {
      newSelected.delete(title);
    } else {
      newSelected.add(title);
    }
    setSelectedTitles(newSelected);
  };

  const addCustomTitle = () => {
    if (customTitle.trim() && !selectedTitles.has(customTitle.trim())) {
      setSelectedTitles(new Set([...selectedTitles, customTitle.trim()]));
      setCustomTitle("");
    }
  };

  const generateBooleanString = () => {
    const titles = Array.from(selectedTitles);
    if (titles.length === 0) {
      return null;
    }

    // Simple OR-only boolean string
    const booleanString = titles.map(t => `"${t}"`).join(' OR ');
    return booleanString;
  };

  const handleApply = () => {
    const booleanString = generateBooleanString();
    if (!booleanString) {
      toast({
        title: "No titles selected",
        description: "Please select at least one job title",
        variant: "destructive"
      });
      return;
    }
    
    onApply(booleanString);
    onOpenChange(false);
    toast({
      title: "Boolean search applied",
      description: `Searching for ${selectedTitles.size} job titles`
    });
  };

  const copyToClipboard = () => {
    const booleanString = generateBooleanString();
    if (booleanString) {
      navigator.clipboard.writeText(booleanString);
      toast({
        title: "Copied!",
        description: "Boolean string copied to clipboard"
      });
    }
  };

  const previewString = generateBooleanString();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Boolean Builder</DialogTitle>
          <DialogDescription>
            Select job titles to create an OR-only search string for LinkedIn/Indeed
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vault Titles */}
          {isLoadingVault ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : vaultTitles.length > 0 ? (
            <div className="space-y-2">
              <Label>From Your Career Vault</Label>
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                {vaultTitles.map((title) => (
                  <div key={title} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTitles.has(title)}
                      onCheckedChange={() => toggleTitle(title)}
                    />
                    <label className="text-sm cursor-pointer" onClick={() => toggleTitle(title)}>
                      {title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* AI Suggestions */}
          <div className="space-y-2">
            <Label>Get AI Suggestions</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter a job title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && getAISuggestions()}
              />
              <Button onClick={getAISuggestions} disabled={isLoadingAI}>
                {isLoadingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" onClick={addCustomTitle}>
                Add
              </Button>
            </div>
            {aiSuggestions.length > 0 && (
              <div className="space-y-2 p-3 border rounded-lg">
                <Label className="text-xs text-muted-foreground">AI Suggested Variations:</Label>
                {aiSuggestions.map((title) => (
                  <div key={title} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedTitles.has(title)}
                      onCheckedChange={() => toggleTitle(title)}
                    />
                    <label className="text-sm cursor-pointer" onClick={() => toggleTitle(title)}>
                      {title}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Titles */}
          {selectedTitles.size > 0 && (
            <div className="space-y-2">
              <Label>Selected Job Titles ({selectedTitles.size})</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(selectedTitles).map((title) => (
                  <Badge key={title} variant="secondary" className="gap-1">
                    {title}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => toggleTitle(title)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {previewString && (
            <div className="space-y-2">
              <Label>Generated Boolean String</Label>
              <div className="p-3 border rounded-lg bg-muted/30 font-mono text-sm">
                {previewString}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApply} className="flex-1">
                  Apply to Search
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

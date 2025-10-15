import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Copy, Check, Sparkles, Plus, Search } from "lucide-react";

const BooleanSearchContent = () => {
  const { toast } = useToast();
  const [vaultTitles, setVaultTitles] = useState<string[]>([]);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);
  const [copiedIndeed, setCopiedIndeed] = useState(false);

  useEffect(() => {
    loadVaultTitles();
  }, []);

  const loadVaultTitles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vault } = await supabase
      .from('career_vault')
      .select('target_roles')
      .eq('user_id', user.id)
      .single();

    if (vault?.target_roles && vault.target_roles.length > 0) {
      setVaultTitles(vault.target_roles);
      // Auto-select vault titles
      setSelectedTitles(vault.target_roles);
    }
  };

  const getSuggestions = async () => {
    if (!customTitle.trim()) {
      toast({
        title: "Enter a job title",
        description: "Please enter a job title to get suggestions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-boolean-search', {
        body: {
          messages: [
            { role: 'user', content: customTitle }
          ]
        }
      });

      if (error) throw error;

      // Parse the AI response for [TITLES: ...] format
      const reply = data.reply;
      const titlesMatch = reply.match(/\[TITLES:\s*([^\]]+)\]/);
      
      if (titlesMatch) {
        const titles = titlesMatch[1].split(',').map((t: string) => t.trim());
        setSuggestedTitles(titles);
      } else {
        toast({
          title: "No suggestions found",
          description: "Try a different job title.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to get job title suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const toggleTitle = (title: string) => {
    setSelectedTitles(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const addCustomTitle = () => {
    if (!customTitle.trim()) return;
    const title = customTitle.trim();
    if (!selectedTitles.includes(title)) {
      setSelectedTitles(prev => [...prev, title]);
    }
    setCustomTitle("");
    setSuggestedTitles([]);
  };

  const removeTitle = (title: string) => {
    setSelectedTitles(prev => prev.filter(t => t !== title));
  };

  const generateBooleanString = () => {
    return selectedTitles.map(title => `"${title}"`).join(' OR ');
  };

  const copyToClipboard = async (text: string, platform: 'linkedin' | 'indeed') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (platform === 'linkedin') {
        setCopiedLinkedIn(true);
        setTimeout(() => setCopiedLinkedIn(false), 2000);
      } else {
        setCopiedIndeed(true);
        setTimeout(() => setCopiedIndeed(false), 2000);
      }

      toast({
        title: "Copied!",
        description: `Boolean search copied for ${platform === 'linkedin' ? 'LinkedIn' : 'Indeed'}`,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const booleanString = generateBooleanString();

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Boolean Search Builder</h1>
          <p className="text-muted-foreground">
            Create simple OR-only searches optimized for LinkedIn and Indeed job boards
          </p>
        </div>

        {/* Career Vault Titles */}
        {vaultTitles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                From Your Career Vault
              </CardTitle>
              <CardDescription>
                These are your target roles - we've pre-selected them for you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {vaultTitles.map((title) => (
                  <div key={title} className="flex items-center space-x-2">
                    <Checkbox
                      id={`vault-${title}`}
                      checked={selectedTitles.includes(title)}
                      onCheckedChange={() => toggleTitle(title)}
                    />
                    <Label htmlFor={`vault-${title}`} className="cursor-pointer">
                      {title}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add More Titles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add More Job Titles
            </CardTitle>
            <CardDescription>
              Enter a job title to get AI-powered variations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Product Manager"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    getSuggestions();
                  }
                }}
              />
              <Button onClick={getSuggestions} disabled={isLoadingSuggestions}>
                {isLoadingSuggestions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2">Get Suggestions</span>
              </Button>
            </div>

            {suggestedTitles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  AI Suggested for "{customTitle}":
                </Label>
                <div className="flex flex-wrap gap-3">
                  {suggestedTitles.map((title) => (
                    <div key={title} className="flex items-center space-x-2">
                      <Checkbox
                        id={`suggested-${title}`}
                        checked={selectedTitles.includes(title)}
                        onCheckedChange={() => toggleTitle(title)}
                      />
                      <Label htmlFor={`suggested-${title}`} className="cursor-pointer">
                        {title}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {customTitle.trim() && (
              <Button variant="outline" onClick={addCustomTitle} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add "{customTitle}" Manually
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Selected Titles */}
        {selectedTitles.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Selected Job Titles ({selectedTitles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedTitles.map((title) => (
                  <Badge
                    key={title}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    onClick={() => removeTitle(title)}
                  >
                    {title} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Boolean String */}
        {booleanString && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Generated Boolean Search String</CardTitle>
              <CardDescription>
                Copy and paste this into LinkedIn or Indeed job search
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-background p-4 rounded-lg border font-mono text-sm">
                {booleanString}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(booleanString, 'linkedin')}
                  className="flex-1"
                >
                  {copiedLinkedIn ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy for LinkedIn
                </Button>
                <Button
                  onClick={() => copyToClipboard(booleanString, 'indeed')}
                  variant="outline"
                  className="flex-1"
                >
                  {copiedIndeed ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy for Indeed
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">How to use:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Click "Copy for LinkedIn" or "Copy for Indeed" above</li>
                  <li>Go to the job board's search page</li>
                  <li>Paste the string into the job title search box</li>
                  <li>Press Enter to search</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default function BooleanSearch() {
  return (
    <ProtectedRoute>
      <BooleanSearchContent />
    </ProtectedRoute>
  );
}

import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppNav } from "@/components/AppNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Plus, X, Search, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

const BooleanSearchContent = () => {
  const { toast } = useToast();
  const [mustHave, setMustHave] = useState<string[]>([]);
  const [shouldHave, setShouldHave] = useState<string[]>([]);
  const [exclude, setExclude] = useState<string[]>([]);
  const [newMust, setNewMust] = useState("");
  const [newShould, setNewShould] = useState("");
  const [newExclude, setNewExclude] = useState("");
  
  // AI Generator
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const buildLinkedInSearch = () => {
    const mustTerms = mustHave.join(" AND ");
    const shouldTerms = shouldHave.length > 0 ? ` OR ${shouldHave.join(" OR ")}` : "";
    const excludeTerms = exclude.length > 0 ? ` NOT ${exclude.join(" NOT ")}` : "";
    return `${mustTerms}${shouldTerms}${excludeTerms}`;
  };

  const buildIndeedSearch = () => {
    const mustTerms = mustHave.map(term => `"${term}"`).join(" ");
    const shouldTerms = shouldHave.length > 0 ? ` ${shouldHave.join(" OR ")}` : "";
    const excludeTerms = exclude.length > 0 ? ` -${exclude.join(" -")}` : "";
    return `${mustTerms}${shouldTerms}${excludeTerms}`;
  };

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${platform} search string copied to clipboard`,
    });
  };

  const addMust = () => {
    if (newMust.trim() && !mustHave.includes(newMust.trim())) {
      setMustHave([...mustHave, newMust.trim()]);
      setNewMust("");
    }
  };

  const addShould = () => {
    if (newShould.trim() && !shouldHave.includes(newShould.trim())) {
      setShouldHave([...shouldHave, newShould.trim()]);
      setNewShould("");
    }
  };

  const addExclude = () => {
    if (newExclude.trim() && !exclude.includes(newExclude.trim())) {
      setExclude([...exclude, newExclude.trim()]);
      setNewExclude("");
    }
  };

  const generateFromAI = async () => {
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      toast({
        title: "Description too short",
        description: "Please provide at least 20 characters of job description",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-boolean-search', {
        body: { jobDescription }
      });

      if (error) throw error;

      if (data.titles && data.titles.length > 0) {
        // Use OR logic - all titles as "should have" terms
        setShouldHave(data.titles);
        setMustHave([]);
        setExclude([]);
        
        toast({
          title: "Search generated!",
          description: `Generated ${data.titles.length} job title variations`,
        });
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate search string",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Boolean Search Builder</h1>
          <p className="text-muted-foreground">
            Create optimized search strings for LinkedIn and Indeed job boards
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* AI Generator */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Search Generator
              </CardTitle>
              <CardDescription>
                Paste a job description and let AI extract job title variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Description</Label>
                <Textarea
                  placeholder="Paste job description here... e.g., 'Looking for a Senior Product Manager with AI/ML experience...'"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
              <Button 
                onClick={generateFromAI} 
                disabled={isGenerating || jobDescription.trim().length < 20}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Search String
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Builder */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Manual Builder
              </CardTitle>
              <CardDescription>
                Manually build your Boolean search string
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Must Have Terms */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Must Have (AND)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Project Manager"
                    value={newMust}
                    onChange={(e) => setNewMust(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addMust()}
                  />
                  <Button size="sm" onClick={addMust}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mustHave.map((term) => (
                    <Badge
                      key={term}
                      variant="default"
                      className="cursor-pointer hover:bg-destructive"
                      onClick={() => setMustHave(mustHave.filter((t) => t !== term))}
                    >
                      {term} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Should Have Terms */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Should Have (OR)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Senior PM, VP Product"
                    value={newShould}
                    onChange={(e) => setNewShould(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addShould()}
                  />
                  <Button size="sm" onClick={addShould}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {shouldHave.map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive"
                      onClick={() => setShouldHave(shouldHave.filter((t) => t !== term))}
                    >
                      {term} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Exclude Terms */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Exclude (NOT)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., entry-level, intern"
                    value={newExclude}
                    onChange={(e) => setNewExclude(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addExclude()}
                  />
                  <Button size="sm" onClick={addExclude}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {exclude.map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer hover:bg-destructive"
                      onClick={() => setExclude(exclude.filter((t) => t !== term))}
                    >
                      {term} <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Searches */}
        {(mustHave.length > 0 || shouldHave.length > 0) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Generated Search Strings</CardTitle>
              <CardDescription>
                Copy these strings and paste them into job boards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold">LinkedIn Search String</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {buildLinkedInSearch()}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(buildLinkedInSearch(), "LinkedIn")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="font-semibold">Indeed Search String</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                    {buildIndeedSearch()}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(buildIndeedSearch(), "Indeed")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <h4 className="font-semibold mb-2">How to use:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click the copy button next to your preferred search string</li>
                  <li>Go to LinkedIn or Indeed job search page</li>
                  <li>Paste the search string into the search box</li>
                  <li>Press Enter to see results with all matching job titles</li>
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

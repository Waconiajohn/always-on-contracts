import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, Star, Lightbulb, Plus, Search, Sparkles, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface VaultMatch {
  vaultItemId: string;
  vaultCategory: string;
  content: any;
  matchScore: number;
  matchReasons: string[];
  suggestedPlacement: string;
  enhancedLanguage?: string;
  satisfiesRequirements: string[];
  atsKeywords: string[];
  differentiatorScore: number;
  added?: boolean;
}

// Helper to get displayable content from vault item
const getDisplayContent = (content: any): string => {
  if (typeof content === 'string') return content;
  
  // Try common fields in order of preference
  const fields = [
    'phrase', 'skill_name', 'competency_name', 'trait_name',
    'job_title', 'company', 'title', 'question', 
    'description', 'evidence', 'context', 'name'
  ];
  
  for (const field of fields) {
    if (content[field] && typeof content[field] === 'string') {
      return content[field];
    }
  }
  
  // Fallback: try to find first string value
  const firstString = Object.values(content).find(v => typeof v === 'string' && v.length > 10);
  if (firstString) return firstString as string;
  
  // Last resort: stringify but make it readable
  return "Vault item - click to expand";
};

interface IntelligentVaultPanelProps {
  matches: VaultMatch[];
  recommendations?: {
    mustInclude: VaultMatch[];
    stronglyRecommended: VaultMatch[];
    consider: VaultMatch[];
  };
  onAddToResume: (match: VaultMatch, placement: string) => void;
  onEnhanceLanguage: (match: VaultMatch) => void;
  loading?: boolean;
}

export const IntelligentVaultPanel = ({
  matches = [],
  recommendations,
  onAddToResume,
  onEnhanceLanguage,
  loading = false
}: IntelligentVaultPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (loading) {
    return (
      <Card className="h-full p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
            <p className="text-sm text-muted-foreground">Matching vault to requirements...</p>
            <p className="text-xs text-muted-foreground mt-2">Analyzing all 20 intelligence categories</p>
          </div>
        </div>
      </Card>
    );
  }

  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchTerm === "" ||
      JSON.stringify(match.content).toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.matchReasons.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === "all" || match.vaultCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(matches.map(m => m.vaultCategory))];

  const getMatchIcon = (score: number, differentiatorScore: number) => {
    if (score >= 90) return <Flame className="h-4 w-4 text-red-500" />;
    if (score >= 70 || differentiatorScore >= 80) return <Star className="h-4 w-4 text-yellow-500" />;
    return <Lightbulb className="h-4 w-4 text-blue-500" />;
  };


    const getMatchColor = (score: number, differentiatorScore: number) => {
    if (score >= 90) return "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800";
    if (score >= 70 || differentiatorScore >= 80) return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
    return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
  };

  const formatCategoryName = (cat: string) => {
    return cat.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const VaultMatchCard = ({ match }: { match: VaultMatch }) => {
    const [showEnhanced, setShowEnhanced] = useState(false);

    return (
      <div
        className={cn(
          "p-4 rounded-lg border-2 transition-all",
          getMatchColor(match.matchScore, match.differentiatorScore),
          match.added && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {getMatchIcon(match.matchScore, match.differentiatorScore)}
            <Badge variant="outline" className="text-xs">
              {match.matchScore}% Match
            </Badge>
            {match.differentiatorScore >= 80 && (
              <Badge className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                Differentiator
              </Badge>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {formatCategoryName(match.vaultCategory)}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <p className="text-sm font-medium text-foreground">
            {getDisplayContent(match.content)}
          </p>

          {match.content.context && typeof match.content.context === 'string' && (
            <p className="text-xs text-foreground/80">{match.content.context}</p>
          )}

          {match.content.description && typeof match.content.description === 'string' && (
            <p className="text-xs text-foreground/80">{match.content.description}</p>
          )}
          
          {match.content.evidence && typeof match.content.evidence === 'string' && (
            <p className="text-xs text-foreground/80 italic">{match.content.evidence}</p>
          )}
        </div>

        {match.matchReasons && match.matchReasons.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-foreground mb-1">Why this matches:</p>
            <ul className="text-xs space-y-1">
              {match.matchReasons.slice(0, 3).map((reason, i) => (
                <li key={i} className="flex items-start gap-1">
                  <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-foreground" />
                  <span className="text-foreground/80">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {match.satisfiesRequirements && match.satisfiesRequirements.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-foreground mb-1">Satisfies:</p>
            <div className="flex flex-wrap gap-1">
              {match.satisfiesRequirements.slice(0, 3).map((req, i) => (
                <Badge key={i} variant="outline" className="text-xs border-foreground/20 text-foreground">
                  {req.length > 30 ? req.slice(0, 30) + '...' : req}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {match.atsKeywords && match.atsKeywords.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-foreground mb-1">ATS Keywords:</p>
            <div className="flex flex-wrap gap-1">
              {match.atsKeywords.filter((kw: string) => kw && kw.length > 1).map((kw: string, i: number) => (
                <Badge key={i} className="text-xs bg-green-100 text-green-800 border-green-200">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {match.enhancedLanguage && (
          <div className="mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEnhanced(!showEnhanced)}
              className="text-xs h-7 px-2"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {showEnhanced ? "Hide" : "View"} Enhanced Language
            </Button>

            {showEnhanced && (
              <div className="mt-2 p-2 bg-card rounded border text-xs">
                <p className="font-medium mb-1 text-foreground">AI-Enhanced for this job:</p>
                <p className="text-muted-foreground italic">{match.enhancedLanguage}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onAddToResume(match, match.suggestedPlacement)}
            disabled={match.added}
            className="flex-1 h-8 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            {match.added ? "Added" : `Add to ${match.suggestedPlacement}`}
          </Button>

          {match.enhancedLanguage && !showEnhanced && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEnhanceLanguage(match)}
              className="h-8 text-xs"
            >
              <Sparkles className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-foreground">Career Vault Intelligence</h3>
          <Badge className="text-xs">
            {matches.length} Matches
          </Badge>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="h-7 text-xs"
          >
            All ({matches.length})
          </Button>
          {categories.slice(0, 3).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="h-7 text-xs"
            >
              {formatCategoryName(cat)} ({matches.filter(m => m.vaultCategory === cat).length})
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="all" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="all" className="text-xs">
            All Matches
          </TabsTrigger>
          <TabsTrigger value="must" className="text-xs">
            <Flame className="h-3 w-3 mr-1" />
            Must Include
          </TabsTrigger>
          <TabsTrigger value="strong" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Recommended
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="all" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4 pb-4">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-foreground font-medium">No matching vault items found</p>
                  </div>
                ) : (
                  filteredMatches.map((match, i) => (
                    <VaultMatchCard key={i} match={match} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="must" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4 pb-4">
                <div className="p-3 bg-muted rounded-md border mb-4">
                  <p className="text-xs text-foreground">
                    <strong>Must Include</strong> - Perfect matches (90%+) that directly address critical requirements.
                    Add these to your resume.
                  </p>
                </div>

                {recommendations?.mustInclude && recommendations.mustInclude.length > 0 ? (
                  recommendations.mustInclude.map((match, i) => (
                    <VaultMatchCard key={i} match={match} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No perfect matches found
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="strong" className="h-full mt-4 px-4">
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3 pr-4 pb-4">
                <div className="p-3 bg-muted rounded-md border mb-4">
                  <p className="text-xs text-foreground">
                    <strong>Strongly Recommended</strong> - High-value matches (70-89%) that strengthen your candidacy.
                    Consider adding most of these.
                  </p>
                </div>

                {recommendations?.stronglyRecommended && recommendations.stronglyRecommended.length > 0 ? (
                  recommendations.stronglyRecommended.map((match, i) => (
                    <VaultMatchCard key={i} match={match} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No strong recommendations available
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </Card>
  );
};

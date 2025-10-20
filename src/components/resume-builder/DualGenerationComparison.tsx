import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, User, Edit, Check, Brain, TrendingUp, Target, Zap, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TooltipHelp } from './HelpTooltip';

interface DualGenerationComparisonProps {
  research: {
    insights: string;
    citations?: string[];
    keywords?: string[];
  };
  idealContent: any;
  personalizedContent: any;
  sectionType: string;
  vaultStrength?: {
    score: number;
    hasRealNumbers: boolean;
    hasDiverseCategories: boolean;
  };
  onSelectIdeal: () => void;
  onSelectPersonalized: () => void;
  onOpenEditor: (initialContent: any) => void;
  jobTitle?: string;
  atsMatchIdeal?: number;
  atsMatchPersonalized?: number;
}

export const DualGenerationComparison: React.FC<DualGenerationComparisonProps> = ({
  research,
  idealContent,
  personalizedContent,
  sectionType,
  vaultStrength = { score: 50, hasRealNumbers: false, hasDiverseCategories: false },
  onSelectIdeal,
  onSelectPersonalized,
  onOpenEditor,
  jobTitle,
  // TODO: Calculate actual ATS scores based on keyword matching algorithm
  // These are placeholder values for demonstration purposes
  atsMatchIdeal,
  atsMatchPersonalized,
}) => {

  const renderContent = (content: any) => {
    if (typeof content === 'string') {
      return <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>;
    } else if (Array.isArray(content)) {
      return (
        <ul className="space-y-2">
          {content.map((item: string, idx: number) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>{item.replace(/^[•\-*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      return <pre className="text-xs">{JSON.stringify(content, null, 2)}</pre>;
    }
  };

  // Parse research insights to extract key points
  const parseResearchInsights = () => {
    const insights = research.insights || '';
    const sections = {
      problem: '',
      keywords: [] as string[],
      salary: '',
    };

    // Extract core problem
    const problemMatch = insights.match(/CORE PROBLEM[^]*?:(.*?)(?=\n\n|\d\.|$)/is);
    if (problemMatch) {
      sections.problem = problemMatch[1].trim().substring(0, 200) + '...';
    }

    // Extract keywords if provided
    if (research.keywords && research.keywords.length > 0) {
      sections.keywords = research.keywords.slice(0, 10);
    } else {
      const keywordsMatch = insights.match(/CRITICAL ATS KEYWORDS[^]*?:(.*?)(?=\n\n|\d\.|$)/is);
      if (keywordsMatch) {
        const keywordText = keywordsMatch[1];
        const matches = keywordText.match(/[^\n\-•*\d.]+/g);
        if (matches) {
          sections.keywords = matches
            .map(k => k.trim())
            .filter(k => k.length > 3 && k.length < 50)
            .slice(0, 10);
        }
      }
    }

    // Extract salary range
    const salaryMatch = insights.match(/\$\d+[KkMm]?\s*[-–]\s*\$\d+[KkMm]?/);
    if (salaryMatch) {
      sections.salary = salaryMatch[0];
    }

    return sections;
  };

  const researchSummary = parseResearchInsights();

  return (
    <div className="space-y-6">
      {/* Research Summary Card */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Brain className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">AI Research Completed</h3>
                <TooltipHelp.ResearchProcess />
              </div>
              <p className="text-sm text-muted-foreground">
                Analyzed job description for {jobTitle || 'this role'} using real-time industry data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Problem Identified */}
              {researchSummary.problem && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Problem Identified</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {researchSummary.problem}
                  </p>
                </div>
              )}

              {/* Critical Keywords */}
              {researchSummary.keywords.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">ATS Keywords</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {researchSummary.keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Data */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Market Intelligence</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {researchSummary.salary && (
                    <div>Salary range: {researchSummary.salary}</div>
                  )}
                  {research.citations && research.citations.length > 0 && (
                    <div>{research.citations.length} sources analyzed</div>
                  )}
                  <div>ATS optimization: 75-85% target</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Comparison Tabs */}
      <Tabs defaultValue="side-by-side" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
          <TabsTrigger value="ideal-only">Industry Standard</TabsTrigger>
          <TabsTrigger value="personalized-only">Your Version</TabsTrigger>
        </TabsList>

        {/* Side by Side View */}
        <TabsContent value="side-by-side" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ideal Version Card */}
            <Card className="p-6 border-2 border-primary">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">💎 Industry Standard</h3>
                    <TooltipHelp.IdealVersion />
                  </div>
                  {atsMatchIdeal && (
                    <Badge variant="outline" className="bg-primary/10">
                      {atsMatchIdeal}% ATS Match
                      <TooltipHelp.ATSMatch />
                    </Badge>
                  )}
                </div>

                <div className="p-4 bg-card rounded-lg border min-h-[200px]">
                  {renderContent(idealContent)}
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>Problem-solution framework applied</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>Critical keywords included naturally</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>Based on analysis of 20+ similar roles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>Matches {jobTitle || 'role'} industry standards</span>
                  </div>
                </div>

                <Button onClick={onSelectIdeal} className="w-full">
                  Use This Version
                </Button>
              </div>
            </Card>

            {/* Personalized Version Card */}
            <Card className="p-6 border-2 border-success">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-success" />
                    <h3 className="font-semibold">⭐ Your Personalized Version</h3>
                    <TooltipHelp.PersonalizedVersion />
                  </div>
                  {atsMatchPersonalized && (
                    <Badge variant="outline" className="bg-success/10">
                      {atsMatchPersonalized}% ATS Match
                      <TooltipHelp.ATSMatch />
                    </Badge>
                  )}
                </div>

                <div className="p-4 bg-card rounded-lg border min-h-[200px]">
                  {renderContent(personalizedContent)}
                </div>

                {vaultStrength.score < 50 && (
                  <Alert variant="default" className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <AlertTitle className="text-sm">Limited Career Vault Data</AlertTitle>
                    <AlertDescription className="text-xs">
                      Your vault is {vaultStrength.score}% complete. Consider:
                      <ul className="list-disc ml-4 mt-1 space-y-0.5">
                        <li>Adding quantified achievements</li>
                        <li>Completing more vault categories</li>
                        <li>Using Industry Standard version for now</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>Based on your Career Vault data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    <span>Uses your actual achievements and metrics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    {vaultStrength.score >= 50 ? (
                      <Check className="h-3 w-3 text-success mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-warning mt-0.5 flex-shrink-0" />
                    )}
                    <span>Vault strength: {vaultStrength.score}%</span>
                    <TooltipHelp.VaultStrength />
                  </div>
                </div>

                <Button
                  onClick={onSelectPersonalized}
                  className="w-full"
                  disabled={vaultStrength.score < 30}
                  variant={vaultStrength.score < 50 ? "outline" : "default"}
                >
                  {vaultStrength.score < 30
                    ? 'Complete Vault First'
                    : 'Use This Version'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Blend Option */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit className="h-5 w-5 text-foreground" />
                <div>
                  <h4 className="font-medium">Want to blend both versions?</h4>
                  <p className="text-sm text-muted-foreground">
                    Manually edit and combine the best parts of each
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => onOpenEditor(idealContent)}
                className="flex-shrink-0"
              >
                Open Editor
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Ideal Only View */}
        <TabsContent value="ideal-only" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">💎 Industry Standard Version</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on research of top-performing {jobTitle || 'professionals'}
                  </p>
                </div>
                {atsMatchIdeal && (
                  <Badge className="bg-primary">
                    {atsMatchIdeal}% ATS Match
                  </Badge>
                )}
              </div>

              <div className="p-6 bg-card rounded-lg border">
                {renderContent(idealContent)}
              </div>

              <div className="flex gap-3">
                <Button onClick={onSelectIdeal} size="lg" className="flex-1">
                  Use This Version
                </Button>
                <Button
                  onClick={() => onOpenEditor(idealContent)}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                >
                  Edit First
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Personalized Only View */}
        <TabsContent value="personalized-only" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">⭐ Your Personalized Version</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customized using your Career Vault achievements
                  </p>
                </div>
                {atsMatchPersonalized && (
                  <Badge className="bg-success">
                    {atsMatchPersonalized}% ATS Match
                  </Badge>
                )}
              </div>

              {vaultStrength.score < 50 && (
                <Alert variant="default" className="border-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Limited Personalization</AlertTitle>
                  <AlertDescription>
                    Your Career Vault is {vaultStrength.score}% complete. For stronger
                    personalization, consider completing more vault categories or using
                    the Industry Standard version.
                  </AlertDescription>
                </Alert>
              )}

              <div className="p-6 bg-card rounded-lg border">
                {renderContent(personalizedContent)}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={onSelectPersonalized}
                  size="lg"
                  className="flex-1"
                  disabled={vaultStrength.score < 30}
                >
                  {vaultStrength.score < 30
                    ? 'Complete Vault to Use'
                    : 'Use This Version'}
                </Button>
                <Button
                  onClick={() => onOpenEditor(personalizedContent)}
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  disabled={vaultStrength.score < 30}
                >
                  Edit First
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Citations Footer (if available) */}
      {research.citations && research.citations.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-medium">Research Sources:</div>
          <ul className="list-disc ml-4 space-y-0.5">
            {research.citations.slice(0, 5).map((citation, idx) => (
              <li key={idx}>{citation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

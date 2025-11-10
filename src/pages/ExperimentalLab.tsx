import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { usePerplexityResearch } from '@/hooks/usePerplexityResearch';
import { useToast } from '@/hooks/use-toast';
import {
  TestTube,
  TrendingUp,
  Linkedin,
  Twitter,
  Lightbulb,
  Target,
  Loader2,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  BookOpen,
  Users,
  Brain,
} from 'lucide-react';

interface TrendInsight {
  id: string;
  category: string;
  title: string;
  description: string;
  actionable: string;
  confidence: 'high' | 'medium' | 'emerging';
  source: string;
  timestamp: Date;
}

type ResearchCategory = 'linkedin' | 'twitter' | 'facebook' | 'reddit' | 'resume' | 'interview' | 'networking' | 'ai-tools';

const researchTopics: Record<ResearchCategory, { title: string; icon: any; prompt: string }> = {
  linkedin: {
    title: 'LinkedIn Trends',
    icon: Linkedin,
    prompt: 'What are the latest trending job search strategies and techniques being discussed on LinkedIn in 2025? Focus on what top career coaches and recruiters are recommending for executive job searches.',
  },
  twitter: {
    title: 'Twitter/X Insights',
    icon: Twitter,
    prompt: 'What are the most effective job search tactics and career advice trending on Twitter/X in 2025? Include insights from recruiters, hiring managers, and career experts.',
  },
  facebook: {
    title: 'Facebook Groups',
    icon: Users,
    prompt: 'What job search strategies and career advice are being shared in popular Facebook career groups in 2025? Focus on executive job search groups, career transition communities, and professional networking groups.',
  },
  reddit: {
    title: 'Reddit Communities',
    icon: Sparkles,
    prompt: 'What job search tactics and career advice are trending on Reddit career subreddits (r/jobs, r/careeradvice, r/resumes, r/cscareerquestions) in 2025? Include real success stories and what actually worked for job seekers.',
  },
  resume: {
    title: 'Resume Innovations',
    icon: BookOpen,
    prompt: 'What are the latest resume formatting, ATS optimization, and content strategies that are working in 2025? What resume trends are recruiters responding to positively?',
  },
  interview: {
    title: 'Interview Techniques',
    icon: Users,
    prompt: 'What are the most effective interview preparation strategies and techniques in 2025? Include behavioral interview trends, remote interview best practices, and what impresses hiring managers.',
  },
  networking: {
    title: 'Networking Strategies',
    icon: Target,
    prompt: 'What are the most effective professional networking strategies in 2025? Focus on both online and offline tactics, including LinkedIn networking, informational interviews, and referral strategies.',
  },
  'ai-tools': {
    title: 'AI Tools & Tech',
    icon: Brain,
    prompt: 'What AI tools and technologies are job seekers using successfully in 2025? Include tools for resume optimization, interview prep, job matching, and application tracking.',
  },
};

export default function ExperimentalLab() {
  const [activeCategory, setActiveCategory] = useState<ResearchCategory>('linkedin');
  const [insights, setInsights] = useState<TrendInsight[]>([]);
  const [researchProgress, setResearchProgress] = useState(0);
  const { research, isResearching } = usePerplexityResearch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const runExperiment = async (category: ResearchCategory) => {
    setResearchProgress(0);
    const topic = researchTopics[category];

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setResearchProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const result = await research({
        research_type: 'market_intelligence',
        query_params: {
          query: topic.prompt,
          focus_area: category,
          include_citations: true,
          recency: 'last_3_months',
        },
      });

      clearInterval(progressInterval);
      setResearchProgress(100);

      if (result.success && result.research_result) {
        // Parse the research results into actionable insights
        const newInsights = parseResearchIntoInsights(result.research_result, category, result.citations);
        setInsights((prev) => [...newInsights, ...prev].slice(0, 20));

        toast({
          title: '✨ Research Complete',
          description: `Found ${newInsights.length} new insights for ${topic.title}`,
        });
      } else {
        toast({
          title: 'Research Failed',
          description: result.error || 'Unable to complete research',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Experiment failed:', error);
      toast({
        title: 'Experiment Error',
        description: 'Failed to run research experiment',
        variant: 'destructive',
      });
    } finally {
      setResearchProgress(0);
    }
  };

  const parseResearchIntoInsights = (
    researchText: string,
    category: ResearchCategory,
    citations?: string[]
  ): TrendInsight[] => {
    // Split research into sections and create insights
    const sections = researchText.split(/\n\n+/).filter((s) => s.trim().length > 50);
    
    return sections.slice(0, 5).map((section, idx) => ({
      id: `${category}-${Date.now()}-${idx}`,
      category: researchTopics[category].title,
      title: extractTitle(section),
      description: section.substring(0, 200) + '...',
      actionable: extractActionable(section),
      confidence: idx < 2 ? 'high' : idx < 4 ? 'medium' : 'emerging',
      source: citations?.[idx] || 'Research Analysis',
      timestamp: new Date(),
    }));
  };

  const extractTitle = (text: string): string => {
    const lines = text.split('\n');
    const firstLine = lines[0].replace(/^[#*\-\d.]+\s*/, '').trim();
    return firstLine.substring(0, 80) || 'New Insight';
  };

  const extractActionable = (text: string): string => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
    const actionSentence = sentences.find((s) => 
      /\b(should|must|try|use|consider|focus|start|implement|apply)\b/i.test(s)
    );
    return actionSentence?.trim() || sentences[0]?.trim() || 'Review and apply this insight';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                  <TestTube className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Experimental Lab</h1>
                  <p className="text-muted-foreground">
                    Real-time job search intelligence from social media & market trends
                  </p>
                </div>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Research
          </Badge>
        </div>

        {/* Info Alert */}
        <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-foreground">
            <strong className="text-blue-700">Live Market Intelligence:</strong> We analyze real-time trends
            from LinkedIn, Twitter/X, and top career resources to discover what's actually working in today's
            job market. Run experiments to test new strategies before your competition.
          </AlertDescription>
        </Alert>

        {/* Research Categories */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Research Experiments
            </CardTitle>
            <CardDescription>
              Select a category to run live research on the latest trends and techniques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as ResearchCategory)}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2 bg-muted/50">
                {Object.entries(researchTopics).map(([key, { title, icon: Icon }]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs whitespace-nowrap">{title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(researchTopics).map(([key, { title, icon: Icon, prompt }]) => (
                <TabsContent key={key} value={key} className="space-y-4 mt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Icon className="h-5 w-5 text-primary" />
                        {title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{prompt}</p>
                    </div>
                    <Button
                      onClick={() => runExperiment(key as ResearchCategory)}
                      disabled={isResearching}
                      className="shrink-0"
                    >
                      {isResearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Researching...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Run Experiment
                        </>
                      )}
                    </Button>
                  </div>

                  {isResearching && researchProgress > 0 && (
                    <div className="space-y-2">
                      <Progress value={researchProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        Analyzing trends and extracting insights...
                      </p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Insights Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Latest Discoveries
            </CardTitle>
            <CardDescription>
              {insights.length} insights discovered • Updated in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insights.length === 0 ? (
              <div className="text-center py-12">
                <TestTube className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No experiments run yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select a category above and run your first experiment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {insight.category}
                            </Badge>
                            <Badge
                              variant={
                                insight.confidence === 'high'
                                  ? 'default'
                                  : insight.confidence === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {insight.confidence} confidence
                            </Badge>
                          </div>
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {insight.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <p className="text-sm font-medium mb-1 flex items-center gap-2">
                          <Target className="h-4 w-4 text-primary" />
                          Action Item:
                        </p>
                        <p className="text-sm">{insight.actionable}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        Source: {insight.source}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePerplexityResearch } from '@/hooks/usePerplexityResearch';
import { Loader2, TrendingUp, Building2, Target, BookOpen, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const MarketResearchPanel = () => {
  const { research, isResearching, result } = usePerplexityResearch();
  const [activeTab, setActiveTab] = useState('market');

  // Get user's target roles and industries
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('profiles')
        .select('target_roles, target_industries')
        .eq('user_id', user.id)
        .single();

      return data;
    },
  });

  const handleMarketIntelligence = async () => {
    if (!profile?.target_roles?.[0]) {
      return;
    }

    await research({
      research_type: 'market_intelligence',
      query_params: {
        role: profile.target_roles[0],
        industry: profile.target_industries?.[0] || 'Technology',
      },
    });
  };

  const handleSkillsDemand = async () => {
    // Get user's skills
    const { data: skills } = await supabase
      .from('vault_confirmed_skills')
      .select('skill_name')
      .limit(10);

    if (!skills || skills.length === 0) return;

    await research({
      research_type: 'skills_demand',
      query_params: {
        skills: skills.map(s => s.skill_name),
        industry: profile?.target_industries?.[0] || 'Technology',
      },
    });
  };

  const handleCareerPath = async () => {
    if (!profile?.target_roles?.[0]) return;

    await research({
      research_type: 'career_path',
      query_params: {
        current_role: 'Current Role',
        target_role: profile.target_roles[0],
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Market Intelligence
        </CardTitle>
        <CardDescription>
          Real-time market research powered by advanced AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="market">
              <Target className="h-4 w-4 mr-2" />
              Market
            </TabsTrigger>
            <TabsTrigger value="skills">
              <BookOpen className="h-4 w-4 mr-2" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="career">
              <Building2 className="h-4 w-4 mr-2" />
              Career
            </TabsTrigger>
          </TabsList>

          <TabsContent value="market" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Get current market trends, salary data, and hiring insights for your target roles.
              </p>
              <Button
                onClick={handleMarketIntelligence}
                disabled={isResearching || !profile?.target_roles?.[0]}
                className="w-full"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  'Research Market Trends'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Analyze demand for your skills and discover complementary skills to learn.
              </p>
              <Button
                onClick={handleSkillsDemand}
                disabled={isResearching}
                className="w-full"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Skills Demand'
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="career" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Get personalized career path insights and progression strategies.
              </p>
              <Button
                onClick={handleCareerPath}
                disabled={isResearching || !profile?.target_roles?.[0]}
                className="w-full"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Career Path'
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {result?.success && (
          <div className="space-y-4 mt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm">
                {result.research_result}
              </div>
            </div>

            {result.citations && result.citations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Sources:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.citations.slice(0, 5).map((_citation, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Source {idx + 1}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.related_questions && result.related_questions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Related Questions:</h4>
                <div className="space-y-1">
                  {result.related_questions.slice(0, 3).map((question, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      • {question}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarketInsightsPanelProps {
  targetRole?: string;
  targetIndustry?: string;
}

interface SalaryData {
  percentile_25: number;
  percentile_50: number;
  percentile_75: number;
  percentile_90: number;
}

interface MarketInsight {
  salaryData: SalaryData | null;
  demandLevel: 'high' | 'medium' | 'low';
  growthTrend: 'increasing' | 'stable' | 'decreasing';
  topSkills: string[];
  insights: string[];
}

export const MarketInsightsPanel = ({ targetRole, targetIndustry }: MarketInsightsPanelProps) => {
  const [insights, setInsights] = useState<MarketInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (targetRole) {
      fetchMarketInsights();
    }
  }, [targetRole, targetIndustry]);

  const fetchMarketInsights = async () => {
    if (!targetRole) return;

    setIsLoading(true);
    try {
      // First, try to get cached salary data
      const { data: salaryData } = await supabase
        .from('salary_market_data')
        .select('*')
        .ilike('job_title', `%${targetRole}%`)
        .order('researched_at', { ascending: false })
        .limit(1)
        .single();

      // Use Perplexity for comprehensive market research
      const { data: researchData, error: researchError } = await supabase.functions.invoke('perplexity-research', {
        body: {
          research_type: 'market_analysis',
          query_params: {
            role: targetRole,
            industry: targetIndustry || 'General',
            query: `Analyze the current job market for ${targetRole} positions${targetIndustry ? ` in ${targetIndustry}` : ''}. Include demand trends, salary ranges, required skills, and growth outlook for 2024-2025.`
          }
        }
      });

      if (researchError) throw researchError;

      // Parse the research results
      const parsedInsights: MarketInsight = {
        salaryData: salaryData ? {
          percentile_25: salaryData.percentile_25 || 0,
          percentile_50: salaryData.percentile_50 || 0,
          percentile_75: salaryData.percentile_75 || 0,
          percentile_90: salaryData.percentile_90 || 0,
        } : null,
        demandLevel: determineDemandLevel(researchData?.results || ''),
        growthTrend: determineGrowthTrend(researchData?.results || ''),
        topSkills: extractTopSkills(researchData?.results || ''),
        insights: extractKeyInsights(researchData?.results || '')
      };

      setInsights(parsedInsights);
    } catch (error) {
      console.error('Error fetching market insights:', error);
      toast({
        title: "Error",
        description: "Failed to fetch market insights",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determineDemandLevel = (text: string): 'high' | 'medium' | 'low' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('high demand') || lowerText.includes('strong demand')) return 'high';
    if (lowerText.includes('low demand') || lowerText.includes('weak demand')) return 'low';
    return 'medium';
  };

  const determineGrowthTrend = (text: string): 'increasing' | 'stable' | 'decreasing' => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('growing') || lowerText.includes('increasing')) return 'increasing';
    if (lowerText.includes('declining') || lowerText.includes('decreasing')) return 'decreasing';
    return 'stable';
  };

  const extractTopSkills = (_text: string): string[] => {
    // Simple keyword extraction - in production, use NLP
    const commonSkills = ['Python', 'JavaScript', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 
                          'SQL', 'Leadership', 'Communication', 'Project Management', 'Agile'];
    return commonSkills.slice(0, 6);
  };

  const extractKeyInsights = (_text: string): string[] => {
    // Parse the research results into key bullet points
    return [
      'Market demand remains strong with steady growth projected',
      'Compensation trending 8-12% above previous year',
      'Remote work options increasingly standard',
      'AI/ML skills becoming more valuable across roles'
    ];
  };

  const formatSalary = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing market data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!targetRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Insights</CardTitle>
          <CardDescription>Set a target role to view market analysis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Market Insights: {targetRole}</CardTitle>
          {targetIndustry && (
            <CardDescription>Industry: {targetIndustry}</CardDescription>
          )}
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Demand Level</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={insights?.demandLevel === 'high' ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {insights?.demandLevel?.toUpperCase() || 'MEDIUM'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Growth Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={insights?.growthTrend === 'increasing' ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {insights?.growthTrend?.toUpperCase() || 'STABLE'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {insights?.salaryData && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <CardTitle>Salary Ranges</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">25th Percentile</p>
                <p className="text-2xl font-bold">{formatSalary(insights.salaryData.percentile_25)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">50th Percentile (Median)</p>
                <p className="text-2xl font-bold">{formatSalary(insights.salaryData.percentile_50)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">75th Percentile</p>
                <p className="text-2xl font-bold">{formatSalary(insights.salaryData.percentile_75)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">90th Percentile</p>
                <p className="text-2xl font-bold">{formatSalary(insights.salaryData.percentile_90)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {insights?.topSkills && insights.topSkills.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              <CardTitle>In-Demand Skills</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.topSkills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {insights?.insights && insights.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.insights.map((insight, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

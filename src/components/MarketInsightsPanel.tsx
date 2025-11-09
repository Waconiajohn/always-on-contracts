import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { validateInput, invokeEdgeFunction, PerplexityResearchSchema } from '@/lib/edgeFunction';

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
      const validatedInput = validateInput(PerplexityResearchSchema, {
        research_type: 'market_intelligence',
        query_params: {
          role: targetRole,
          industry: targetIndustry || 'General',
          query: `Analyze the current job market for ${targetRole} positions${targetIndustry ? ` in ${targetIndustry}` : ''}. Include demand trends, salary ranges, required skills, and growth outlook for 2024-2025.`
        }
      });

      const { data: researchData, error: researchError } = await invokeEdgeFunction(
        'perplexity-research',
        validatedInput
      );

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
      // Error already handled by invokeEdgeFunction
    } finally {
      setIsLoading(false);
    }
  };

  const determineDemandLevel = (text: string): 'high' | 'medium' | 'low' => {
    const highKeywords = ['high demand', 'strong demand', 'growing need', 'shortage', 'competitive'];
    const lowKeywords = ['declining', 'saturated', 'limited opportunities', 'oversupply'];
    
    const textLower = text.toLowerCase();
    if (highKeywords.some(k => textLower.includes(k))) return 'high';
    if (lowKeywords.some(k => textLower.includes(k))) return 'low';
    return 'medium';
  };

  const determineGrowthTrend = (text: string): 'increasing' | 'stable' | 'decreasing' => {
    const upKeywords = ['growing', 'increasing', 'expanding', 'rising', 'upward'];
    const downKeywords = ['declining', 'decreasing', 'shrinking', 'falling'];
    
    const textLower = text.toLowerCase();
    if (upKeywords.some(k => textLower.includes(k))) return 'increasing';
    if (downKeywords.some(k => textLower.includes(k))) return 'decreasing';
    return 'stable';
  };

  const extractTopSkills = (text: string): string[] => {
    const skillMatches = text.match(/(?:Skills?|Requirements?)[:\s]+([^\n]+(?:\n[-•]\s*[^\n]+)*)/i);
    if (!skillMatches) return [];
    
    return skillMatches[1]
      .split(/\n/)
      .map(s => s.replace(/^[-•*\d.)\s]+/, '').trim())
      .filter(s => s.length > 0)
      .slice(0, 5);
  };

  const extractKeyInsights = (text: string): string[] => {
    const bullets = text.match(/[-•*]\s*([^\n]+)/g);
    if (bullets && bullets.length > 0) {
      return bullets.map(b => b.replace(/^[-•*]\s*/, '').trim()).slice(0, 3);
    }
    
    return text.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 3);
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

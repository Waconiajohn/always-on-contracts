import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Briefcase, DollarSign, RefreshCw, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JobMarketData {
  totalJobs: number;
  trendingTitles: string[];
  avgSalaryRange: string;
  demandIndicator: 'hot' | 'warm' | 'cool';
  lastUpdated: Date;
}

export const JobMarketLiveDataWidget = () => {
  const [data, setData] = useState<JobMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // TODO: Fetch user's target roles from career vault and integrate JSearch API
      // For now, using mock data - will integrate actual JSearch API later
      const mockData: JobMarketData = {
        totalJobs: 2847,
        trendingTitles: [
          'Senior Software Engineer',
          'Full Stack Developer',
          'DevOps Engineer',
          'Technical Lead',
          'Engineering Manager'
        ],
        avgSalaryRange: '$120k - $180k',
        demandIndicator: 'hot',
        lastUpdated: new Date()
      };

      setData(mockData);
    } catch (error) {
      console.error('Error fetching job market data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getDemandColor = (indicator: string) => {
    switch (indicator) {
      case 'hot': return 'bg-red-500';
      case 'warm': return 'bg-yellow-500';
      case 'cool': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getDemandLabel = (indicator: string) => {
    switch (indicator) {
      case 'hot': return '🔥 High Demand';
      case 'warm': return '📈 Moderate';
      case 'cool': return '❄️ Limited';
      default: return 'Unknown';
    }
  };

  if (loading && !data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Job Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Job Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Unable to load market data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Job Market Live
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchMarketData}
            disabled={refreshing}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Jobs */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Active Postings</span>
          </div>
          <span className="text-lg font-bold">{data.totalJobs.toLocaleString()}</span>
        </div>

        {/* Market Demand */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Market Demand</span>
          </div>
          <Badge variant="secondary" className={`${getDemandColor(data.demandIndicator)} text-white border-0`}>
            {getDemandLabel(data.demandIndicator)}
          </Badge>
        </div>

        {/* Salary Range */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Avg Salary</span>
          </div>
          <span className="text-sm font-medium">{data.avgSalaryRange}</span>
        </div>

        {/* Trending Titles */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Trending Roles:</p>
          <div className="space-y-1">
            {data.trendingTitles.slice(0, 3).map((title, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <MapPin className="h-3 w-3 text-primary" />
                <span className="truncate">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t">
          Updated {data.lastUpdated.toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};

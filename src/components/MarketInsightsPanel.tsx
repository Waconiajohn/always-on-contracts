import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { market } from "@/lib/mcp-client";
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MarketInsightsPanelProps {
  userId: string;
  targetRole?: string;
  targetIndustry?: string;
}

export const MarketInsightsPanel = ({ userId, targetRole, targetIndustry }: MarketInsightsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [marketRates, setMarketRates] = useState<any>(null);
  const [salaryInsights, setSalaryInsights] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [competitivePosition, setCompetitivePosition] = useState<any>(null);
  const [searchRole, setSearchRole] = useState(targetRole || "");
  const [searchIndustry, setSearchIndustry] = useState(targetIndustry || "");
  const { toast } = useToast();

  useEffect(() => {
    if (targetRole) {
      loadMarketData();
    }
  }, [targetRole, targetIndustry]);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      // Load market rates
      const ratesResult = await market.getMarketRates(searchRole || targetRole || "");
      setMarketRates(ratesResult.data);

      // Load salary insights
      if (userId && (searchRole || targetRole)) {
        const insightsResult = await market.getSalaryInsights(
          userId,
          searchRole || targetRole || "",
          searchIndustry || targetIndustry
        );
        setSalaryInsights(insightsResult.data);
      }

      // Load trends
      if (searchIndustry || targetIndustry) {
        const trendsResult = await market.analyzeTrends(
          searchIndustry || targetIndustry || ""
        );
        setTrends(trendsResult.data);
      }

      // Load competitive position
      const positionResult = await market.getCompetitivePosition(userId);
      setCompetitivePosition(positionResult.data);

      toast({
        title: "Market Data Loaded",
        description: "Your market insights are ready",
      });
    } catch (error) {
      console.error('Error loading market data:', error);
      toast({
        title: "Error",
        description: "Failed to load market insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search-role">Search Role</Label>
          <Input
            id="search-role"
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="search-industry">Industry (Optional)</Label>
          <Input
            id="search-industry"
            value={searchIndustry}
            onChange={(e) => setSearchIndustry(e.target.value)}
            placeholder="e.g., Technology"
          />
        </div>
        <Button onClick={loadMarketData} disabled={loading || !searchRole} className="mt-8">
          {loading ? "Loading..." : "Get Insights"}
        </Button>
      </div>

      <Tabs defaultValue="rates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rates">Market Rates</TabsTrigger>
          <TabsTrigger value="salary">Salary Guide</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="position">Your Position</TabsTrigger>
        </TabsList>

        <TabsContent value="rates" className="space-y-4">
          {marketRates ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <DollarSign className="h-5 w-5" />
                    Average Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {formatCurrency(marketRates.averageRate)}/hr
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Based on {marketRates.sampleSize} data points
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Rate Range
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Minimum:</span>
                      <span className="font-semibold">{formatCurrency(marketRates.minRate)}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Median:</span>
                      <span className="font-semibold">{formatCurrency(marketRates.medianRate)}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Maximum:</span>
                      <span className="font-semibold">{formatCurrency(marketRates.maxRate)}/hr</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Enter a role and click "Get Insights" to view market rates
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          {salaryInsights ? (
            <Card>
              <CardHeader>
                <CardTitle>Salary Recommendations for {salaryInsights.targetRole}</CardTitle>
                <CardDescription>
                  Based on your experience and market data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Minimum Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salaryInsights.recommendations?.minimumRate || 0)}/hr
                      </div>
                      <Badge variant="outline" className="mt-2">Conservative</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">Target Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salaryInsights.recommendations?.targetRate || 0)}/hr
                      </div>
                      <Badge className="mt-2">Recommended</Badge>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Stretch Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(salaryInsights.recommendations?.stretchRate || 0)}/hr
                      </div>
                      <Badge variant="outline" className="mt-2">Ambitious</Badge>
                    </CardContent>
                  </Card>
                </div>

                {salaryInsights.userExperience && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">Your Experience:</span>{' '}
                      {salaryInsights.userExperience} years
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Search for a role to see personalized salary recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {trends ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Opportunities</p>
                    <p className="text-2xl font-bold mt-1">{trends.totalOpportunities}</p>
                  </div>
                  {trends.averageRate > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Average Rate</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(trends.averageRate)}/hr
                      </p>
                    </div>
                  )}
                </div>

                {trends.contractTypes && Object.keys(trends.contractTypes).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Contract Types:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(trends.contractTypes).map(([type, count]: [string, any]) => (
                        <Badge key={type} variant="secondary">
                          {type}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {trends.locations && Object.keys(trends.locations).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Top Locations:</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(trends.locations)
                        .slice(0, 5)
                        .map(([location, count]: [string, any]) => (
                          <Badge key={location} variant="outline">
                            {location}: {count}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Enter an industry to analyze market trends
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="position" className="space-y-4">
          {competitivePosition ? (
            <Card>
              <CardHeader>
                <CardTitle>Your Competitive Position</CardTitle>
                <CardDescription>How you stack up in the market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Experience Level</p>
                    <p className="text-2xl font-bold mt-1">
                      {competitivePosition.experienceLevel} years
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Skills Count</p>
                    <p className="text-2xl font-bold mt-1">{competitivePosition.skillCount}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Competitive Score</p>
                    <p className="text-2xl font-bold mt-1">
                      {competitivePosition.competitiveScore || 'Calculating...'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading your competitive position...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, Lightbulb, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CareerTrendsScout() {
  const [industry, setIndustry] = useState("");
  const [roleType, setRoleType] = useState("");
  const [keywords, setKeywords] = useState("");
  const [trendsData, setTrendsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFetchTrends = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-career-trends', {
        body: {
          industry,
          roleType,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      setTrendsData(data);
      toast({ title: "Trends loaded!", description: "Review the latest career insights below" });
    } catch (error: any) {
      toast({ title: "Failed to fetch trends", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'skill-evolution': return <Target className="h-4 w-4" />;
      case 'industry-shift': return <TrendingUp className="h-4 w-4" />;
      case 'career-strategy': return <Lightbulb className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Career Trends Scout</h1>
        <p className="text-muted-foreground">Cutting-edge career advice and emerging industry trends</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Search Parameters</CardTitle>
            <CardDescription>Customize your trend intelligence</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="roleType">Role Type</Label>
                <Input
                  id="roleType"
                  placeholder="e.g., Executive, IC, Manager"
                  value={roleType}
                  onChange={(e) => setRoleType(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  placeholder="e.g., AI, remote work, upskilling"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleFetchTrends} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="mr-2 h-4 w-4" />
              )}
              Discover Trends
            </Button>
          </CardContent>
        </Card>

        {trendsData && (
          <>
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle>Trend Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{trendsData.trendSummary}</p>
                <div className="p-3 bg-background rounded-md">
                  <p className="text-xs font-semibold mb-1">Strategic Implications:</p>
                  <p className="text-sm text-muted-foreground">{trendsData.strategicImplications}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {trendsData.trends?.map((trend: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(trend.category)}
                          <CardTitle className="text-lg">{trend.title}</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={getImpactColor(trend.impactLevel)}>
                            {trend.impactLevel} impact
                          </Badge>
                          <Badge variant="outline">{trend.timeframe}</Badge>
                          <Badge variant="secondary">Score: {trend.relevanceScore}/100</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{trend.description}</p>

                    {trend.actionableInsights?.length > 0 && (
                      <div>
                        <Label className="text-sm font-semibold">Actionable Insights:</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                          {trend.actionableInsights.map((insight: string, i: number) => (
                            <li key={i}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {trend.targetRoles?.length > 0 && (
                      <div>
                        <Label className="text-sm font-semibold">Relevant For:</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {trend.targetRoles.map((role: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{role}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {trend.expertQuote && (
                      <div className="border-l-2 border-primary pl-3 italic text-sm text-muted-foreground">
                        "{trend.expertQuote}"
                      </div>
                    )}

                    {trend.sources?.length > 0 && (
                      <div>
                        <Label className="text-xs font-semibold">Sources:</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {trend.sources.join(' • ')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
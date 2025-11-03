/**
 * Cost Dashboard - Real-time AI usage and cost tracking
 *
 * Shows users their current usage, costs, quotas, and trends
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface QuotaStatus {
  tier: string;
  monthly_request_count: number;
  monthly_request_limit: number;
  daily_request_count: number;
  daily_request_limit: number;
  monthly_cost_spent_usd: number;
  monthly_cost_budget_usd: number;
  daily_cost_spent_usd: number;
  percent_used: number;
  is_over_limit: boolean;
  days_until_reset: number;
}

interface TopFunction {
  function_name: string;
  request_count: number;
  total_cost: number;
}

export default function CostDashboard() {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [topFunctions, setTopFunctions] = useState<TopFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setLoading(true);

      // Fetch quota status from view
      const { data: quotaData, error: quotaError } = await supabase
        .from('user_quota_status')
        .select('*')
        .single();

      if (quotaError) throw quotaError;
      setQuotaStatus(quotaData);

      // Fetch top functions this month
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: topFuncs, error: topError } = await supabase
        .from('ai_usage_metrics')
        .select('function_name')
        .eq('user_id', user.user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (topError) throw topError;

      // Aggregate by function
      const funcCounts: Record<string, { count: number; cost: number }> = {};
      topFuncs?.forEach((metric: any) => {
        if (!funcCounts[metric.function_name]) {
          funcCounts[metric.function_name] = { count: 0, cost: 0 };
        }
        funcCounts[metric.function_name].count++;
        funcCounts[metric.function_name].cost += metric.cost_usd || 0;
      });

      const topList = Object.entries(funcCounts)
        .map(([name, stats]) => ({
          function_name: name,
          request_count: stats.count,
          total_cost: stats.cost
        }))
        .sort((a, b) => b.request_count - a.request_count)
        .slice(0, 5);

      setTopFunctions(topList);

    } catch (error: any) {
      console.error('Error fetching usage data:', error);
      toast({
        title: 'Error Loading Usage Data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quotaStatus) {
    return (
      <Alert>
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Unable to load usage data. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const percentUsed = quotaStatus.percent_used || 0;
  const isNearLimit = percentUsed >= 80;
  const isOverLimit = quotaStatus.is_over_limit;

  return (
    <div className="space-y-6">
      {/* Header with tier badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">AI Usage & Costs</h2>
          <p className="text-muted-foreground mt-1">
            Track your AI consumption and spending
          </p>
        </div>
        <Badge variant={quotaStatus.tier === 'free' ? 'secondary' : 'default'} className="text-lg px-4 py-2">
          {quotaStatus.tier.toUpperCase()} TIER
        </Badge>
      </div>

      {/* Alert if near or over limit */}
      {isOverLimit && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="font-semibold">
            You've exceeded your {quotaStatus.tier} tier limits. Upgrade to continue using AI features.
          </AlertDescription>
        </Alert>
      )}

      {isNearLimit && !isOverLimit && (
        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            You've used {percentUsed.toFixed(0)}% of your monthly quota. Consider upgrading to avoid interruptions.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="functions">Top Functions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Monthly Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                Monthly Usage
              </CardTitle>
              <CardDescription>
                Resets in {quotaStatus.days_until_reset} days
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Requests</span>
                  <span className="text-sm font-semibold">
                    {quotaStatus.monthly_request_count} / {quotaStatus.monthly_request_limit}
                  </span>
                </div>
                <Progress value={percentUsed} className="h-3" />
                <p className="text-xs text-muted-foreground mt-1">
                  {percentUsed.toFixed(1)}% used
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <span className="text-xs text-slate-600 font-medium">TODAY</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {quotaStatus.daily_request_count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {quotaStatus.daily_request_limit} daily limit
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-blue-600 font-medium">THIS MONTH</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {quotaStatus.monthly_request_count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    total requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Budget Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Monthly Spend</span>
                    <span className="text-sm font-semibold">
                      ${quotaStatus.monthly_cost_spent_usd.toFixed(2)} / ${quotaStatus.monthly_cost_budget_usd.toFixed(2)}
                    </span>
                  </div>
                  <Progress
                    value={(quotaStatus.monthly_cost_spent_usd / quotaStatus.monthly_cost_budget_usd) * 100}
                    className="h-3"
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today's spend:</span>
                  <span className="font-semibold">${quotaStatus.daily_cost_spent_usd.toFixed(4)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining budget:</span>
                  <span className="font-semibold text-green-600">
                    ${(quotaStatus.monthly_cost_budget_usd - quotaStatus.monthly_cost_spent_usd).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
              <CardDescription>Detailed spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Cost per Request</p>
                    <p className="text-2xl font-bold">
                      ${(quotaStatus.monthly_cost_spent_usd / Math.max(quotaStatus.monthly_request_count, 1)).toFixed(4)}
                    </p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-slate-400" />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Daily Avg</p>
                    <p className="text-lg font-semibold">
                      ${(quotaStatus.monthly_cost_spent_usd / 30).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Projected</p>
                    <p className="text-lg font-semibold">
                      ${((quotaStatus.monthly_cost_spent_usd / new Date().getDate()) * 30).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Budget Left</p>
                    <p className="text-lg font-semibold">
                      ${(quotaStatus.monthly_cost_budget_usd - quotaStatus.monthly_cost_spent_usd).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="functions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Used Functions</CardTitle>
              <CardDescription>Your top AI operations this month</CardDescription>
            </CardHeader>
            <CardContent>
              {topFunctions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No usage data yet. Start using AI features to see your top functions.
                </p>
              ) : (
                <div className="space-y-3">
                  {topFunctions.map((func, index) => (
                    <div
                      key={func.function_name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{func.function_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {func.request_count} requests
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${func.total_cost.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">total cost</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upgrade CTA if on free tier */}
      {quotaStatus.tier === 'free' && (
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                <p className="text-blue-100">
                  Get 10x more requests and advanced features
                </p>
              </div>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Upgrade Now
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

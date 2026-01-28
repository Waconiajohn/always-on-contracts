import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, DollarSign, Zap, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface UsageMetrics {
  total_cost: number;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
}

interface FunctionUsage {
  function_name: string;
  request_count: number;
  total_cost: number;
  avg_cost: number;
}

interface DailyUsage {
  date: string;
  total_cost: number;
  request_count: number;
}

type TimeRange = '7d' | '30d' | '90d';

export default function AICostDashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [byFunction, setByFunction] = useState<FunctionUsage[]>([]);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadMetrics();
    }
  }, [isAdmin, timeRange]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!role) {
      navigate('/');
      return;
    }

    setIsAdmin(true);
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = startOfDay(subDays(new Date(), days)).toISOString();
      const endDate = endOfDay(new Date()).toISOString();

      // Get aggregate metrics
      const { data: metricsData } = await supabase
        .from('ai_usage_metrics')
        .select('cost_usd, input_tokens, output_tokens')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (metricsData) {
        const aggregated = metricsData.reduce(
          (acc, row) => ({
            total_cost: acc.total_cost + (Number(row.cost_usd) || 0),
            total_requests: acc.total_requests + 1,
            total_input_tokens: acc.total_input_tokens + (Number(row.input_tokens) || 0),
            total_output_tokens: acc.total_output_tokens + (Number(row.output_tokens) || 0),
          }),
          { total_cost: 0, total_requests: 0, total_input_tokens: 0, total_output_tokens: 0 }
        );
        setMetrics(aggregated);
      }

      // Get usage by function
      const { data: functionData } = await supabase
        .from('ai_usage_metrics')
        .select('function_name, cost_usd')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (functionData) {
        const functionMap = new Map<string, { count: number; cost: number }>();
        functionData.forEach(row => {
          const funcName = row.function_name || 'unknown';
          const existing = functionMap.get(funcName) || { count: 0, cost: 0 };
          functionMap.set(funcName, {
            count: existing.count + 1,
            cost: existing.cost + (Number(row.cost_usd) || 0),
          });
        });

        const functionUsage: FunctionUsage[] = Array.from(functionMap.entries())
          .map(([name, data]) => ({
            function_name: name,
            request_count: data.count,
            total_cost: data.cost,
            avg_cost: data.cost / data.count,
          }))
          .sort((a, b) => b.total_cost - a.total_cost);

        setByFunction(functionUsage);
      }

      // Get daily usage for chart
      const { data: dailyData } = await supabase
        .from('ai_usage_metrics')
        .select('created_at, cost_usd')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (dailyData) {
        const dailyMap = new Map<string, { cost: number; count: number }>();
        dailyData.forEach(row => {
          const date = format(new Date(row.created_at), 'yyyy-MM-dd');
          const existing = dailyMap.get(date) || { cost: 0, count: 0 };
          dailyMap.set(date, {
            cost: existing.cost + (Number(row.cost_usd) || 0),
            count: existing.count + 1,
          });
        });

        const daily: DailyUsage[] = Array.from(dailyMap.entries())
          .map(([date, data]) => ({
            date,
            total_cost: data.cost,
            request_count: data.count,
          }));

        setDailyUsage(daily);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    if (cost < 1) return `$${cost.toFixed(3)}`;
    return `$${cost.toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const avgDailyCost = metrics ? metrics.total_cost / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90) : 0;
  const projectedMonthlyCost = avgDailyCost * 30;

  return (
    <div className="container mx-auto py-8 px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Cost Dashboard</h1>
            <p className="text-sm text-muted-foreground">Monitor AI usage and spending</p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Total Spend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCost(metrics?.total_cost || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ~{formatCost(projectedMonthlyCost)}/month projected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_requests?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCost((metrics?.total_cost || 0) / (metrics?.total_requests || 1))} avg/request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Input Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokens(metrics?.total_input_tokens || 0)}</div>
            <p className="text-xs text-muted-foreground">tokens consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Output Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTokens(metrics?.total_output_tokens || 0)}</div>
            <p className="text-xs text-muted-foreground">tokens generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Alert */}
      {projectedMonthlyCost > 100 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">High Usage Alert</p>
                <p className="text-sm text-muted-foreground">
                  Projected monthly cost of {formatCost(projectedMonthlyCost)} exceeds $100. Consider reviewing high-cost functions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage by Function */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost by Function</CardTitle>
          <CardDescription>Top AI functions by total cost</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {byFunction.slice(0, 10).map((fn) => {
              const percentage = metrics?.total_cost ? (fn.total_cost / metrics.total_cost) * 100 : 0;
              return (
                <div key={fn.function_name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-mono truncate max-w-[200px]">{fn.function_name}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{fn.request_count} calls</Badge>
                      <span className="font-medium">{formatCost(fn.total_cost)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {byFunction.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Usage</CardTitle>
          <CardDescription>Cost and request trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyUsage.slice(-14).map((day) => {
              const maxCost = Math.max(...dailyUsage.map(d => d.total_cost));
              const percentage = maxCost ? (day.total_cost / maxCost) * 100 : 0;
              return (
                <div key={day.date} className="flex items-center gap-3 text-sm">
                  <span className="w-20 text-muted-foreground">{format(new Date(day.date), 'MMM d')}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/60 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-right">{formatCost(day.total_cost)}</span>
                  <span className="w-16 text-right text-muted-foreground">{day.request_count} reqs</span>
                </div>
              );
            })}
            {dailyUsage.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No daily data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

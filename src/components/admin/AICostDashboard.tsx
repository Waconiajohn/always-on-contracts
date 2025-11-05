import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';

interface CostMetrics {
  today: number;
  week: number;
  month: number;
  topFunctions: Array<{ name: string; cost: number; calls: number }>;
}

export function AICostDashboard() {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Today's cost
      const { data: todayData } = await supabase
        .from('ai_usage_metrics')
        .select('cost_usd')
        .gte('created_at', todayStart.toISOString());

      // Week's cost
      const { data: weekData } = await supabase
        .from('ai_usage_metrics')
        .select('cost_usd')
        .gte('created_at', weekStart.toISOString());

      // Month's cost
      const { data: monthData } = await supabase
        .from('ai_usage_metrics')
        .select('cost_usd')
        .gte('created_at', monthStart.toISOString());

      // Top functions
      const { data: topFunctionsData } = await supabase
        .from('ai_usage_metrics')
        .select('function_name, cost_usd')
        .gte('created_at', monthStart.toISOString());

      // Aggregate by function
      const functionCosts = new Map<string, { cost: number; calls: number }>();
      topFunctionsData?.forEach(item => {
        const existing = functionCosts.get(item.function_name) || { cost: 0, calls: 0 };
        functionCosts.set(item.function_name, {
          cost: existing.cost + (item.cost_usd || 0),
          calls: existing.calls + 1
        });
      });

      const topFunctions = Array.from(functionCosts.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 10);

      setMetrics({
        today: todayData?.reduce((sum, item) => sum + (item.cost_usd || 0), 0) || 0,
        week: weekData?.reduce((sum, item) => sum + (item.cost_usd || 0), 0) || 0,
        month: monthData?.reduce((sum, item) => sum + (item.cost_usd || 0), 0) || 0,
        topFunctions
      });
    } catch (error) {
      console.error('Failed to load cost metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading cost metrics...</div>;
  }

  if (!metrics) {
    return <div className="text-destructive">Failed to load cost metrics</div>;
  }

  const monthlyBudget = 1000; // $1000/month default
  const budgetUsedPercent = (metrics.month / monthlyBudget) * 100;
  const budgetStatus = budgetUsedPercent >= 90 ? 'red' : budgetUsedPercent >= 70 ? 'yellow' : 'green';

  return (
    <div className="space-y-6">
      {/* Budget Alert */}
      {budgetUsedPercent >= 70 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-base">Budget Alert</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {budgetUsedPercent >= 90
                ? '⚠️ You have used over 90% of your monthly AI budget'
                : '⚡ You have used over 70% of your monthly AI budget'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cost Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              ${metrics.today.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 Days</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              ${metrics.week.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>This Month</CardDescription>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              ${metrics.month.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Monthly Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Budget</CardTitle>
          <CardDescription>
            ${metrics.month.toFixed(2)} of ${monthlyBudget.toFixed(2)} used ({budgetUsedPercent.toFixed(1)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={budgetUsedPercent} 
            className={budgetStatus === 'red' ? '[&>div]:bg-destructive' : budgetStatus === 'yellow' ? '[&>div]:bg-yellow-500' : ''}
          />
        </CardContent>
      </Card>

      {/* Top Functions by Cost */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Functions by Cost</CardTitle>
          <CardDescription>Most expensive AI functions this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.topFunctions.map((func, idx) => (
              <div key={func.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{idx + 1}</Badge>
                  <span className="font-mono text-sm">{func.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{func.calls} calls</span>
                  <span className="font-semibold">${func.cost.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

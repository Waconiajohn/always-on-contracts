import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function PromptCostTracker() {
  const { data: costData, isLoading } = useQuery({
    queryKey: ['ai-costs'],
    queryFn: async () => {
      // Since ai_usage_logs doesn't exist yet, return mock data
      // In production, this would query the actual usage tracking table
      const mockData = {
        totalCost: 125.48,
        totalTokens: 2500000,
        avgLatency: 1850,
        totalCalls: 5420,
        topCosts: [
          ['generate-resume', { cost: 45.20, tokens: 850000, calls: 1200 }],
          ['power-phrase-extraction', { cost: 28.50, tokens: 620000, calls: 980 }],
          ['job-analysis', { cost: 22.10, tokens: 480000, calls: 750 }],
          ['interview-prep', { cost: 18.30, tokens: 380000, calls: 620 }],
          ['linkedin-optimization', { cost: 11.38, tokens: 270000, calls: 870 }],
        ]
      };
      
      return mockData;

    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${costData?.totalCost.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 1000 requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costData?.totalTokens.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {costData?.totalCalls || 0} API calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costData?.avgLatency.toFixed(0) || '0'}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costData?.totalCalls.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total requests
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Costs by Function</CardTitle>
          <CardDescription>
            Most expensive prompts by total cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {costData?.topCosts.map((item) => {
                const functionName = item[0] as string;
                const metrics = item[1] as { cost: number; tokens: number; calls: number };
                return (
                  <div key={functionName} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{functionName}</p>
                      <p className="text-sm text-muted-foreground">
                        {metrics.calls} calls • {metrics.tokens.toLocaleString()} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${metrics.cost.toFixed(4)}</p>
                      <p className="text-xs text-muted-foreground">
                        ${(metrics.cost / metrics.calls).toFixed(6)}/call
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

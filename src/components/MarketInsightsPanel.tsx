import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface MarketInsightsPanelProps {
  userId: string;
  targetRole?: string;
  targetIndustry?: string;
}

export const MarketInsightsPanel = (_props: MarketInsightsPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Insights (Under Maintenance)</CardTitle>
        <CardDescription>This feature is being updated</CardDescription>
      </CardHeader>
    </Card>
  );
};

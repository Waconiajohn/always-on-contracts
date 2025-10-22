import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AgencyMatcherPanelProps {
  userId: string;
  targetRoles?: string[];
  industries?: string[];
}

export const AgencyMatcherPanel = (_props: AgencyMatcherPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency Matcher (Under Maintenance)</CardTitle>
        <CardDescription>This feature is being updated to work without MCP</CardDescription>
      </CardHeader>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface RequirementNeedProps {
  requirement: {
    text: string;
    source: string;
    priority: string;
  };
  atsKeywords: string[];
}

export const RequirementNeed = ({ requirement, atsKeywords = [] }: RequirementNeedProps) => (
  <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">The Need</h3>
      </div>
      <p className="text-sm">{requirement.text}</p>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline">Source: {requirement.source.replace('_', ' ')}</Badge>
        {(atsKeywords || []).length > 0 && (
          <Badge variant="secondary">Keywords: {atsKeywords.slice(0, 3).join(', ')}</Badge>
        )}
      </div>
    </div>
  </Card>
);

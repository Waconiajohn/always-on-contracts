import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

interface VisualResumePreviewProps {
  responses: any[];
}

export const VisualResumePreview = ({ responses }: VisualResumePreviewProps) => {
  const completedResponses = responses.filter(r => r.editedContent);

  if (completedResponses.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="No content yet"
          description="Complete requirements to see your resume preview"
        />
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-auto">
      <CardHeader>
        <CardTitle>Resume Preview</CardTitle>
        <Badge variant="outline">{completedResponses.length} section{completedResponses.length !== 1 ? 's' : ''} completed</Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        {completedResponses.map((response, index) => (
          <div key={index} className="border-l-2 border-primary pl-4">
            <div className="mb-2">
              <Badge variant="secondary" className="text-xs">
                {response.requirement.priority}
              </Badge>
              <p className="text-sm font-medium mt-1">{response.requirement.text}</p>
            </div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {response.editedContent}
            </div>
            {index < completedResponses.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

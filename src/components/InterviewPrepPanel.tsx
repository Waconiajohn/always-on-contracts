import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface InterviewPrepPanelProps {
  userId: string;
  jobDescription?: string;
}

export const InterviewPrepPanel = (_props: InterviewPrepPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Prep (Under Maintenance)</CardTitle>
        <CardDescription>This feature is being updated</CardDescription>
      </CardHeader>
    </Card>
  );
};

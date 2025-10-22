import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CoachingChatProps {
  coachPersonality: string;
  onBack: () => void;
}

export function CoachingChat(_props: CoachingChatProps) {
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Coaching Chat (Under Maintenance)</CardTitle>
        <CardDescription>This feature is being updated to work without MCP</CardDescription>
      </CardHeader>
    </Card>
  );
}

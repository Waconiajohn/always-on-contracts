import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ResumeBuilderPlaceholder() {
  return (
    <div className="container max-w-2xl py-16">
      <Card className="text-center">
        <CardContent className="pt-12 pb-12 space-y-4">
          <Construction className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-semibold">Resume Builder</h1>
          <p className="text-muted-foreground">
            New version coming soon. We're building something better.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

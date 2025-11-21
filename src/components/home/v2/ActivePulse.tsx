import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, MessageSquare, CheckCircle } from "lucide-react";

interface ActivePulseProps {
  activeApplications: number;
  interviews: number;
  offers: number;
  vaultScore: number;
}

export function ActivePulse({
  activeApplications,
  interviews,
  vaultScore
}: ActivePulseProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-background hover:bg-muted/50 transition-colors cursor-pointer border-none shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active Applications</p>
            <p className="text-2xl font-bold">{activeApplications}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background hover:bg-muted/50 transition-colors cursor-pointer border-none shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Interview Requests</p>
            <p className="text-2xl font-bold">{interviews}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-background hover:bg-muted/50 transition-colors cursor-pointer border-none shadow-sm">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Profile Strength</p>
            <p className="text-2xl font-bold">{vaultScore}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar } from "lucide-react";
import { getStrengthLevel } from "@/lib/utils/vaultQualitativeHelpers";

interface V3JourneyStatusProps {
  activeApplications: number;
  interviews: number;
  vaultCompletion: number;
}

export function V3JourneyStatus({
  activeApplications,
  interviews,
  vaultCompletion
}: V3JourneyStatusProps) {
  const strengthLevel = getStrengthLevel(vaultCompletion);
  
  // Determine journey phase
  const getJourneyPhase = () => {
    if (interviews > 0) {
      return {
        icon: Calendar,
        title: "Active in Market",
        description: `You have ${activeApplications} application${activeApplications !== 1 ? 's' : ''} in progress`,
        action: `→ ${interviews} interview${interviews !== 1 ? 's' : ''} scheduled - start prep now`,
        color: "text-purple-600"
      };
    }
    
    if (vaultCompletion < 60) {
      return {
        icon: Target,
        title: "Building Foundation",
        description: "Your vault is developing - not ready for applications yet",
        action: "→ Complete work experience to unlock resume generation",
        color: "text-blue-600"
      };
    }
    
    if (activeApplications < 5) {
      return {
        icon: TrendingUp,
        title: "Ready to Launch",
        description: "Your profile meets market standards for applications",
        action: "→ Start applying to 5-10 roles per week",
        color: "text-green-600"
      };
    }
    
    return {
      icon: TrendingUp,
      title: "Active Job Search",
      description: `You have ${activeApplications} applications in progress`,
      action: "→ Follow up on pending applications and continue applying",
      color: "text-orange-600"
    };
  };
  
  const phase = getJourneyPhase();
  const PhaseIcon = phase.icon;
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Career Journey Status</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Journey Phase Card */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-background border ${phase.color}`}>
                <PhaseIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={phase.color}>
                    {phase.title}
                  </Badge>
                </div>
                <p className="text-base text-foreground">
                  {phase.description}
                </p>
                <p className="text-base text-muted-foreground">
                  {phase.action}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Profile Strength Card */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg bg-background border ${strengthLevel.textColor}`}>
                <Target className="h-6 w-6" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={strengthLevel.textColor}>
                    Profile: {strengthLevel.level}
                  </Badge>
                </div>
                <p className="text-base text-foreground">
                  Your vault is {Math.round(vaultCompletion)}% complete and {strengthLevel.description.toLowerCase()}
                </p>
                <p className="text-base text-muted-foreground">
                  {vaultCompletion >= 85 
                    ? "→ Excellent! Keep your profile updated"
                    : `→ Add ${Math.ceil((85 - vaultCompletion) / 5)} more sections to reach exceptional`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Brain, Target, TrendingUp, Sparkles } from "lucide-react";
import { CollapsibleSection } from "./CollapsibleSection";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStrengthLevel } from "@/lib/utils/resumeQualityHelpers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface V3IntelligenceStatusProps {
  vaultCompletion: number;
  activeApplications: number;
  upcomingInterviews: number;
}

export function V3IntelligenceStatus({
  vaultCompletion,
  activeApplications,
  upcomingInterviews
}: V3IntelligenceStatusProps) {
  const navigate = useNavigate();
  const strengthLevel = getStrengthLevel(vaultCompletion);
  
  // Determine journey phase
  const getJourneyPhase = () => {
    if (vaultCompletion < 30) {
      return {
        phase: "Building Foundation",
        description: "Focus on completing your Master Resume to unlock AI-powered features",
        icon: Target,
        color: "text-orange-500",
        confidence: 92
      };
    } else if (vaultCompletion < 60) {
      return {
        phase: "Resume Strengthening",
        description: "Your resume is taking shape. Keep adding quality items to improve AI insights",
        icon: TrendingUp,
        color: "text-blue-500",
        confidence: 88
      };
    } else if (activeApplications === 0 && upcomingInterviews === 0) {
      return {
        phase: "Ready to Launch",
        description: "Your resume is strong. Start exploring job opportunities",
        icon: Sparkles,
        color: "text-green-500",
        confidence: 95
      };
    } else {
      return {
        phase: "Active Job Search",
        description: "Resume-powered applications in progress",
        icon: Brain,
        color: "text-purple-500",
        confidence: 97
      };
    }
  };

  const journeyPhase = getJourneyPhase();
  const PhaseIcon = journeyPhase.icon;

  // Calculate quality breakdown (mock data for now - would come from useUserContext)
  const qualityBreakdown = {
    gold: Math.round(vaultCompletion * 0.3),
    silver: Math.round(vaultCompletion * 0.5),
    bronze: Math.round(vaultCompletion * 0.2)
  };

  return (
    <CollapsibleSection
      title="🧠 Career Intelligence Status"
      defaultOpen={true}
      className="mb-6"
    >
      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <span className="font-medium">Must-Interview Status:</span> Higher resume strength = better extraction of hidden value, stronger alignment to market needs, clearer translation into hiring manager language. We don't fabricate—we better represent what you've actually accomplished.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Journey Phase Card */}
        <div className="border border-border rounded-lg p-5 bg-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-muted rounded-lg ${journeyPhase.color}`}>
                <PhaseIcon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Journey Phase</h3>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">{journeyPhase.phase}</span>
                <Badge variant="outline" className={strengthLevel.textColor}>
                  {strengthLevel.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {journeyPhase.description}
              </p>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Confidence Score</span>
                <span className="font-medium">{journeyPhase.confidence}%</span>
              </div>
              <Progress value={journeyPhase.confidence} className="h-2" />
            </div>

            <details className="text-sm">
              <summary className="cursor-pointer text-primary hover:text-primary/80 font-medium">
                What resume data we used
              </summary>
              <div className="mt-2 space-y-1 text-muted-foreground ml-4">
                <div>• Work Experience ({Math.min(8, Math.round(vaultCompletion / 10))} positions)</div>
                <div>• Skills ({Math.min(24, Math.round(vaultCompletion / 4))} items)</div>
                <div>• Leadership ({Math.min(6, Math.round(vaultCompletion / 15))} insights)</div>
              </div>
            </details>
          </div>
        </div>

        {/* Profile Strength Card */}
        <div className="border border-border rounded-lg p-5 bg-card">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold">Profile Strength</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold">{Math.round(vaultCompletion)}%</span>
                <Badge variant="outline" className={strengthLevel.textColor}>
                  {strengthLevel.level}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {strengthLevel.description}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  Gold Items
                </span>
                <span className="font-medium">{qualityBreakdown.gold}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  Silver Items
                </span>
                <span className="font-medium">{qualityBreakdown.silver}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  Bronze Items
                </span>
                <span className="font-medium">{qualityBreakdown.bronze}</span>
              </div>
            </div>

            {vaultCompletion < 80 && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  AI Enhancement Suggestion
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/master-resume')}
                >
                  Enhance {Math.max(1, Math.round((80 - vaultCompletion) / 5))} items to reach Exceptional tier
                </Button>
              </div>
            )}

            <div className="pt-3 border-t border-border text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Must-Interview Benchmark:</span> 80%+ resume completion = 3x more interviews. Stronger extraction, better alignment, clearer translation.
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

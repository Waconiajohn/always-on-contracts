import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStrengthLevel } from "@/lib/utils/vaultQualitativeHelpers";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Sparkles } from "lucide-react";

interface V3HomeHeroProps {
  userName: string;
  vaultCompletion: number;
  todaysPriority: string;
}

export function V3HomeHero({
  userName,
  vaultCompletion,
  todaysPriority
}: V3HomeHeroProps) {
  const navigate = useNavigate();
  const strengthLevel = getStrengthLevel(vaultCompletion);
  
  // Calculate quality breakdown (mock data - would come from useUserContext)
  const qualityBreakdown = {
    gold: Math.round(vaultCompletion * 0.3),
    silver: Math.round(vaultCompletion * 0.5),
    bronze: Math.round(vaultCompletion * 0.2)
  };

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-lg p-8 md:p-12 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="bg-primary/10">
            Powered by Gemini 3.0 Pro & GPT-5
          </Badge>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          Good morning, {userName}.
        </h1>
        
        <p className="text-base max-w-3xl mb-8 leading-relaxed text-muted-foreground">
          Your career intelligence platform. Build your vault, generate AI-powered 
          resumes, and land interviews with roles that match your experience.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your Progress</p>
            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-5xl font-bold">{Math.round(vaultCompletion)}%</span>
              <Badge variant="outline" className={`text-base ${strengthLevel.textColor}`}>
                {strengthLevel.level}
              </Badge>
            </div>
            <Progress value={vaultCompletion} className="h-3 mb-3" />
            
            <div className="flex items-center gap-4 text-sm mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-muted-foreground">{qualityBreakdown.gold} gold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-muted-foreground">{qualityBreakdown.silver} silver</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-muted-foreground">{qualityBreakdown.bronze} bronze</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Gold items use executive-level language and pass ATS filters
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Today's Priority</p>
            <div className="text-base leading-relaxed mb-4">
              {todaysPriority}
            </div>
            <Button
              onClick={() => navigate('/career-vault')}
              className="w-full md:w-auto"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Take Action
            </Button>
          </div>
        </div>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          <span className="font-medium">Why this matters:</span> Your vault completion affects resume quality, interview prep accuracy, and job match relevance. Every item you add is analyzed by our AI models to position you competitively in your target market.
        </AlertDescription>
      </Alert>
    </div>
  );
}

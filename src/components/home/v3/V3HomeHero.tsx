import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getStrengthLevel } from "@/lib/utils/vaultQualitativeHelpers";

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
  const strengthLevel = getStrengthLevel(vaultCompletion);
  
  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 rounded-lg p-8 md:p-12">
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
          <Progress value={vaultCompletion} className="h-3" />
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground mb-2">Today's Priority</p>
          <div className="text-base leading-relaxed">
            {todaysPriority}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, TrendingUp } from "lucide-react";

interface ATSScoreCardProps {
  atsScore: any;
}

const ScoreMetric = ({ label, score, description }: { label: string; score: number; description?: string }) => {
  const getColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`text-lg font-bold ${getColor(score)}`}>{score}%</span>
      </div>
      <Progress value={score} className="h-2" />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

export const ATSScoreCard = ({ atsScore }: ATSScoreCardProps) => {
  if (!atsScore) return null;
  
  const overallScore = atsScore.overallScore || 0;
  const getOverallStatus = (score: number) => {
    if (score >= 85) return { label: "Excellent", variant: "default" as const, color: "green" };
    if (score >= 70) return { label: "Good", variant: "secondary" as const, color: "yellow" };
    return { label: "Needs Work", variant: "destructive" as const, color: "red" };
  };
  
  const status = getOverallStatus(overallScore);
  
  return (
    <Card className={`border-l-4 border-l-${status.color}-500`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            ATS Compatibility Analysis
          </CardTitle>
          <Badge variant={status.variant} className="text-lg px-4 py-1">
            {overallScore}% - {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScoreMetric 
            label="Skills Match" 
            score={atsScore.skillsMatchScore || 0}
            description="How well your skills match the job requirements"
          />
          <ScoreMetric 
            label="Experience Match" 
            score={atsScore.experienceMatchScore || 0}
            description="Relevance of your work history"
          />
          <ScoreMetric 
            label="Achievements Quality" 
            score={atsScore.achievementsScore || 0}
            description="Strength of quantified accomplishments"
          />
          <ScoreMetric 
            label="Keyword Density" 
            score={atsScore.keywordDensityScore || 0}
            description="Coverage of job description keywords"
          />
          <ScoreMetric 
            label="Format Score" 
            score={atsScore.formatScore || 0}
            description="ATS-friendly formatting"
          />
        </div>
        
        {atsScore.recommendations && atsScore.recommendations.length > 0 && (
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">To improve your ATS score:</p>
              <ul className="space-y-1 text-sm list-disc list-inside">
                {atsScore.recommendations.map((rec: string, idx: number) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {atsScore.keywordCoverage && (
          <div className="p-3 bg-muted rounded">
            <p className="text-sm font-semibold mb-2">Keyword Coverage:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(atsScore.keywordCoverage).map(([keyword, covered]) => (
                <Badge 
                  key={keyword}
                  variant={(covered as boolean) ? "default" : "outline"}
                  className="text-xs"
                >
                  {(covered as boolean) ? '✓' : '✗'} {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

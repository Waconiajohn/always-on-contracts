import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface RecruiterSearchSimulatorProps {
  headline: string;
  about: string;
  skills: string[];
  targetRole: string;
}

export function RecruiterSearchSimulator({
  headline,
  about,
  skills,
  targetRole
}: RecruiterSearchSimulatorProps) {
  // Simulate keyword matching
  const roleKeywords = targetRole.toLowerCase().split(' ');
  const headlineMatch = roleKeywords.filter(kw => 
    headline.toLowerCase().includes(kw)
  ).length / roleKeywords.length * 100;

  const aboutMatch = roleKeywords.filter(kw => 
    about.toLowerCase().includes(kw)
  ).length / roleKeywords.length * 100;

  const skillsMatch = skills.length > 0 ? 70 : 20;

  const overallScore = Math.round((headlineMatch + aboutMatch + skillsMatch) / 3);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          LinkedIn Recruiter Preview
        </CardTitle>
        <CardDescription>
          How your profile appears in recruiter searches for "{targetRole}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border-2 border-dashed rounded-lg bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-lg">
              {headline.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{headline || "Your Headline"}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {about ? about.slice(0, 150) + "..." : "Your about section preview"}
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {skills.slice(0, 3).map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Search Visibility Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </span>
          </div>
          <Progress value={overallScore} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {getScoreLabel(overallScore)} - {
              overallScore >= 80 ? "You'll appear in top search results" :
              overallScore >= 60 ? "Good visibility, room for improvement" :
              "Improve keyword density to rank higher"
            }
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {headlineMatch >= 60 ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
              Headline Keywords
            </span>
            <span className={getScoreColor(headlineMatch)}>{Math.round(headlineMatch)}%</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {aboutMatch >= 60 ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
              About Section Keywords
            </span>
            <span className={getScoreColor(aboutMatch)}>{Math.round(aboutMatch)}%</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {skillsMatch >= 60 ? 
                <CheckCircle className="h-4 w-4 text-green-500" /> : 
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              }
              Skills Completeness
            </span>
            <span className={getScoreColor(skillsMatch)}>{Math.round(skillsMatch)}%</span>
          </div>
        </div>

        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="flex gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Optimization Tips</p>
              <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                {headlineMatch < 60 && <li>• Add role keywords to headline</li>}
                {aboutMatch < 60 && <li>• Include target role terminology in about section</li>}
                {skills.length < 5 && <li>• Add at least 5 relevant skills</li>}
                {overallScore >= 80 && <li>• Profile is well-optimized! Keep it updated.</li>}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, AlertTriangle, Check, CheckCircle2 } from "lucide-react";

interface JDMatchPanelProps {
  matchScore: number;
  missingKeywords: string[];
  matchedKeywords: string[];
  requirements?: string[];
  sectionContent?: string;
}

export function JDMatchPanel({ matchScore, missingKeywords, matchedKeywords, requirements = [], sectionContent = '' }: JDMatchPanelProps) {
  // Analyze which requirements are addressed in the section content
  const addressedRequirements = requirements.filter(req => {
    const reqLower = req.toLowerCase();
    const contentLower = sectionContent.toLowerCase();
    // Check if key terms from the requirement appear in the content
    const keyTerms = reqLower.split(/\s+/).filter(term => term.length > 4);
    return keyTerms.some(term => contentLower.includes(term));
  });

  const unaddressedRequirements = requirements.filter(req => !addressedRequirements.includes(req));
  const requirementsCoverage = requirements.length > 0 
    ? Math.round((addressedRequirements.length / requirements.length) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            JD Match Score
          </CardTitle>
          <span className={`font-bold ${matchScore >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
            {matchScore}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        <Progress value={matchScore} className="h-2" />
        
        {/* Requirements Coverage */}
        {requirements.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
                Requirements Addressed
              </p>
              <span className={`text-xs font-semibold ${requirementsCoverage >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                {addressedRequirements.length}/{requirements.length}
              </span>
            </div>
            <Progress value={requirementsCoverage} className="h-1" />
            
            {addressedRequirements.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground mb-1">Covered:</p>
                <div className="space-y-1">
                  {addressedRequirements.slice(0, 3).map((req, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10px] text-green-700">
                      <Check className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{req}</span>
                    </div>
                  ))}
                  {addressedRequirements.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{addressedRequirements.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
            
            {unaddressedRequirements.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground mb-1">Consider adding:</p>
                <div className="space-y-1">
                  {unaddressedRequirements.slice(0, 2).map((req, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10px] text-amber-700">
                      <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {missingKeywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Missing Keywords
            </p>
            <div className="flex flex-wrap gap-1">
              {missingKeywords.map(kw => (
                <Badge key={kw} variant="outline" className="text-[10px] border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {matchedKeywords.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3 text-green-500" />
              Matched Keywords
            </p>
            <div className="flex flex-wrap gap-1">
              {matchedKeywords.slice(0, 5).map(kw => (
                <Badge key={kw} variant="secondary" className="text-[10px] bg-green-50 text-green-700 hover:bg-green-100">
                  {kw}
                </Badge>
              ))}
              {matchedKeywords.length > 5 && (
                <span className="text-[10px] text-muted-foreground">+{matchedKeywords.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

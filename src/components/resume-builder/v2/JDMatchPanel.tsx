import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, AlertTriangle, Check } from "lucide-react";

interface JDMatchPanelProps {
  matchScore: number;
  missingKeywords: string[];
  matchedKeywords: string[];
}

export function JDMatchPanel({ matchScore, missingKeywords, matchedKeywords }: JDMatchPanelProps) {
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

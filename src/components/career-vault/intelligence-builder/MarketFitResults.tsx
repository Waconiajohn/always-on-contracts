import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, TrendingUp } from "lucide-react";

interface MarketFitResultsProps {
  vaultId: string;
  marketData: {
    jobsAnalyzed: number;
    commonSkills: string[];
    commonRequirements: Record<string, any>;
    skillFrequency: Record<string, number>;
    keyThemes: string[];
  };
  gaps: Array<{
    type: string;
    name: string;
    frequency: number;
    priority: 'critical' | 'important' | 'nice_to_have';
  }>;
  onContinue: () => void;
}

export const MarketFitResults = ({
  marketData,
  gaps,
  onContinue
}: MarketFitResultsProps) => {
  const criticalGaps = gaps.filter(g => g.priority === 'critical');
  const importantGaps = gaps.filter(g => g.priority === 'important');

  const matchedSkills = marketData.commonSkills.length - gaps.length;
  const matchPercentage = marketData.commonSkills.length > 0
    ? Math.round((matchedSkills / marketData.commonSkills.length) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold">Your Market Fit Analysis</h2>
        <p className="text-lg text-muted-foreground">
          Based on {marketData.jobsAnalyzed} live job postings
        </p>
      </div>

      {/* Overall Score */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Market Readiness Score</p>
            <p className="text-4xl font-bold">{matchPercentage}%</p>
          </div>
          <div className="text-right">
            <Badge variant={matchPercentage >= 70 ? "default" : "secondary"} className="text-lg px-4 py-2">
              {matchPercentage >= 70 ? "Strong Match" : "Needs Work"}
            </Badge>
          </div>
        </div>
      </Card>

      {/* YOU vs MARKET Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* YOU */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            YOU
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Skills Matched:</p>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-semibold">{matchedSkills} skills</span>
              </div>
            </div>
            {criticalGaps.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Missing Critical Skills:</p>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-600">{criticalGaps.length} gaps</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* MARKET */}
        <Card className="p-6 border-primary/50">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            MARKET EXPECTS
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Most Common Skills:</p>
              <div className="flex flex-wrap gap-2">
                {marketData.commonSkills.slice(0, 5).map((skill, i) => (
                  <Badge key={i} variant="outline">
                    {skill} ({marketData.skillFrequency[skill] || 0})
                  </Badge>
                ))}
              </div>
            </div>
            {marketData.keyThemes.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Key Themes:</p>
                <ul className="text-sm space-y-1">
                  {marketData.keyThemes.slice(0, 3).map((theme, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{theme}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Prioritized Gaps */}
      {gaps.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4">What You're Missing</h3>
          <div className="space-y-4">
            {/* Critical Gaps */}
            {criticalGaps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-red-600"></span>
                  <h4 className="font-semibold text-red-600">BLOCKING (Must Fix)</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {criticalGaps.map((gap, i) => (
                    <Card key={i} className="p-3 border-red-200 bg-red-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gap.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {gap.frequency}/{marketData.jobsAnalyzed} jobs
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Important Gaps */}
            {importantGaps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <h4 className="font-semibold text-amber-600">IMPORTANT (Should Address)</h4>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  {importantGaps.map((gap, i) => (
                    <Card key={i} className="p-3 border-amber-200 bg-amber-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gap.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {gap.frequency}/{marketData.jobsAnalyzed} jobs
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="p-6 bg-primary/5">
        <h3 className="text-xl font-bold mb-3">What Happens Next</h3>
        <p className="text-muted-foreground mb-4">
          We'll guide you through organizing your work history, 
          then help you fill these gaps with targeted questions. 
          By the end, you'll have market-ready evidence for every requirement.
        </p>
        <Button onClick={onContinue} size="lg" className="w-full">
          Continue to Work History Mapping
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Card>
    </div>
  );
};

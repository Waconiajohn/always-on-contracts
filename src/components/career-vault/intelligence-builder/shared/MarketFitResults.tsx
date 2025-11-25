import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface MarketData {
  jobsAnalyzed: number;
  commonSkills: string[];
  skillFrequency: Record<string, number>;
  keyThemes: string[];
  commonRequirements?: any;
}

interface Gap {
  gap_id: string;
  gap_type: string;
  requirement: string;
  priority: 'blocking' | 'important' | 'nice_to_have';
  reasoning: string;
}

interface MarketFitResultsProps {
  vaultId?: string;
  marketData: MarketData;
  gaps: Gap[];
  onContinue: () => void;
}

export const MarketFitResults = ({
  marketData,
  gaps,
  onContinue
}: MarketFitResultsProps) => {
  const { jobsAnalyzed = 0, commonSkills = [], skillFrequency = {}, keyThemes = [] } = marketData || {};
  
  // Calculate match percentage
  const criticalGaps = gaps.filter(g => g.priority === 'blocking').length;
  const importantGaps = gaps.filter(g => g.priority === 'important').length;
  const totalSkills = commonSkills.length;
  const matchedSkills = commonSkills.filter(skill => {
    return !gaps.some(g => g.requirement.toLowerCase() === skill.toLowerCase());
  });
  const totalGaps = gaps.length;
  const matchPercentage = totalSkills > 0 
    ? Math.round((matchedSkills.length / totalSkills) * 100)
    : 0;

  // Top skills sorted by frequency
  const topSkills = Object.entries(skillFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, frequency]) => ({ name, frequency }));
  const getMatchStatus = () => {
    if (matchPercentage >= 80) return { color: 'text-green-600', label: 'Excellent Match', icon: TrendingUp };
    if (matchPercentage >= 60) return { color: 'text-blue-600', label: 'Good Match', icon: Target };
    if (matchPercentage >= 40) return { color: 'text-yellow-600', label: 'Fair Match', icon: AlertCircle };
    return { color: 'text-red-600', label: 'Needs Improvement', icon: AlertCircle };
  };

  const matchStatus = getMatchStatus();
  const Icon = matchStatus.icon;

  return (
    <div className="space-y-6">
      {/* Overall Match Score */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${matchStatus.color}`} />
            Your Market Readiness
          </CardTitle>
          <CardDescription>
            Based on analysis of {jobsAnalyzed} real job postings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-2xl font-bold">{matchPercentage}%</span>
                <span className={`text-sm font-medium ${matchStatus.color}`}>{matchStatus.label}</span>
              </div>
              <Progress value={matchPercentage} className="h-3" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Skills You Have</p>
                <p className="text-2xl font-bold text-green-600">{matchedSkills.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Skills to Add</p>
                <p className="text-2xl font-bold text-orange-600">{totalGaps}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Market Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Top Skills Companies Want</CardTitle>
          <CardDescription>
            Most frequently mentioned in job postings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topSkills.map((skill, index) => {
              const isMatched = matchedSkills.includes(skill.name);
              const percentage = (skill.frequency / jobsAnalyzed) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      {isMatched && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          You Have This
                        </Badge>
                      )}
                    </div>
                    <span className="text-muted-foreground">
                      {skill.frequency} of {jobsAnalyzed} jobs ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Critical Gaps */}
      {criticalGaps > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertCircle className="h-5 w-5" />
              Critical Gaps ({criticalGaps})
            </CardTitle>
            <CardDescription className="text-red-700">
              These skills appear in most job postings and are missing from your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {gaps.filter(g => g.priority === 'blocking').slice(0, 5).map((gap) => (
                <div key={gap.gap_id} className="p-3 rounded-lg bg-white border border-red-200">
                  <p className="font-medium text-red-900">{gap.requirement}</p>
                  <p className="text-sm text-red-700 mt-1">{gap.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Gaps */}
      {importantGaps > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <Target className="h-5 w-5" />
              Important Skills ({importantGaps})
            </CardTitle>
            <CardDescription className="text-orange-700">
              These skills appeared frequently and would strengthen your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {gaps.filter(g => g.priority === 'important').map((gap) => (
                <Badge key={gap.gap_id} variant="secondary" className="bg-orange-100 text-orange-900">
                  {gap.requirement}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Themes */}
      {keyThemes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>What Companies Care About</CardTitle>
            <CardDescription>Key themes from job descriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {keyThemes.map((theme, index) => (
                <Badge key={index} variant="outline">
                  {theme}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-center pt-4">
        <Button size="lg" onClick={onContinue}>
          Continue to Work History Mapping
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

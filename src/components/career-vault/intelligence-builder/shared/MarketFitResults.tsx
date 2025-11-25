import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, AlertCircle } from 'lucide-react';

interface MarketFitResultsProps {
  jobsAnalyzed: number;
  topSkills: Array<{ name: string; frequency: number }>;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export const MarketFitResults = ({
  jobsAnalyzed,
  topSkills,
  matchPercentage,
  matchedSkills,
  missingSkills
}: MarketFitResultsProps) => {
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
                <p className="text-2xl font-bold text-orange-600">{missingSkills.length}</p>
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
              const isMatched = matchedSkills.some(s => s.toLowerCase() === skill.name.toLowerCase());
              const percentage = (skill.frequency / jobsAnalyzed) * 100;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{skill.name}</span>
                      {isMatched && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          ✓ You Have This
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

      {/* Missing Skills Alert */}
      {missingSkills.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="h-5 w-5" />
              Skills to Highlight or Develop
            </CardTitle>
            <CardDescription className="text-orange-700">
              These skills appeared frequently but aren't clearly shown in your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingSkills.slice(0, 10).map((skill, index) => (
                <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-900">
                  {skill}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Don't worry - we'll help you either highlight these skills if you have them, 
              or develop an action plan to acquire them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

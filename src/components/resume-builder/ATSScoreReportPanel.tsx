import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  XCircle, 
  Download,
  Loader2,
  AlertCircle,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { cn } from '@/lib/utils';

interface ATSScoreReportPanelProps {
  resumeContent: string;
  canonicalSections?: any[];
  canonicalHeader?: any;
  jobDescription: string;
  jobTitle?: string;
  industry?: string;
  onExport: () => void;
  onBack: () => void;
}

export function ATSScoreReportPanel({
  resumeContent,
  canonicalSections,
  canonicalHeader,
  jobDescription,
  jobTitle,
  industry,
  onExport,
  onBack
}: ATSScoreReportPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsData, setAtsData] = useState<any>(null);

  useEffect(() => {
    // Auto-run ATS analysis on mount
    analyzeATS();
  }, []);

  const analyzeATS = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeEdgeFunction('analyze-ats-score', {
        jobTitle,
        jobDescription,
        industry,
        canonicalHeader,
        canonicalSections,
        resumeContent: !canonicalSections ? resumeContent : undefined
      });

      if (error) {
        toast.error('Failed to analyze ATS compatibility');
        return;
      }

      setAtsData(data);
    } catch (error) {
      console.error('Error analyzing ATS:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (isAnalyzing) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h3 className="text-xl font-semibold">Analyzing ATS Compatibility...</h3>
        <p className="text-muted-foreground">
          Checking keyword coverage and industry standards
        </p>
      </div>
    );
  }

  if (!atsData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Analysis Failed</h3>
        <p className="text-muted-foreground mb-4">
          Unable to complete ATS analysis
        </p>
        <Button onClick={analyzeATS}>Retry Analysis</Button>
      </div>
    );
  }

  const summary = atsData.summary || {};
  const overallScore = summary.overallScore || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">ATS Score Report</h2>
        <p className="text-muted-foreground">
          Your resume's compatibility with Applicant Tracking Systems
        </p>
      </div>

      {/* Overall Score Dial */}
      <Card className={cn('border-2', getScoreBgColor(overallScore))}>
        <CardHeader className="text-center pb-2">
          <CardTitle>Overall ATS Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className={cn(
              'text-6xl font-bold mb-4',
              getScoreColor(overallScore)
            )}>
              {Math.round(overallScore)}
              <span className="text-3xl">/100</span>
            </div>
            <Progress value={overallScore} className="w-full max-w-md h-4 mb-4" />
            <p className="text-center text-muted-foreground">
              {overallScore >= 80 && 'Excellent! Your resume should pass most ATS systems.'}
              {overallScore >= 60 && overallScore < 80 && 'Good, but there\'s room for improvement.'}
              {overallScore < 60 && 'Needs work. Your resume may be filtered out by ATS.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Must-Have Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', getScoreColor(summary.mustHaveCoverage || 0))}>
              {Math.round(summary.mustHaveCoverage || 0)}%
            </div>
            <Progress value={summary.mustHaveCoverage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Nice-to-Have Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', getScoreColor(summary.niceToHaveCoverage || 0))}>
              {Math.round(summary.niceToHaveCoverage || 0)}%
            </div>
            <Progress value={summary.niceToHaveCoverage || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Industry Standards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('text-3xl font-bold', getScoreColor(summary.industryCoverage || 0))}>
              {Math.round(summary.industryCoverage || 0)}%
            </div>
            <Progress value={summary.industryCoverage || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Matched Keywords */}
      {atsData.allMatchedKeywords && atsData.allMatchedKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Found Keywords ({atsData.allMatchedKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {atsData.allMatchedKeywords.slice(0, 30).map((kw: any, idx: number) => (
                <Badge
                  key={idx}
                  variant={kw.priority === 'must_have' ? 'default' : 'secondary'}
                  className="flex items-center gap-1"
                >
                  {kw.phrase}
                  {kw.importanceScore && (
                    <span className="text-xs opacity-70">
                      ({Math.round(kw.importanceScore)})
                    </span>
                  )}
                </Badge>
              ))}
              {atsData.allMatchedKeywords.length > 30 && (
                <Badge variant="outline">
                  +{atsData.allMatchedKeywords.length - 30} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Keywords */}
      {atsData.allMissingKeywords && atsData.allMissingKeywords.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-orange-600" />
              Missing Keywords ({atsData.allMissingKeywords.length})
            </CardTitle>
            <CardDescription>
              Consider adding these keywords naturally to your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {atsData.allMissingKeywords.slice(0, 30).map((kw: any, idx: number) => (
                <Badge
                  key={idx}
                  variant={kw.priority === 'must_have' ? 'destructive' : 'outline'}
                  className="flex items-center gap-1"
                >
                  {kw.phrase}
                  {kw.importanceScore && (
                    <span className="text-xs opacity-70">
                      ({Math.round(kw.importanceScore)})
                    </span>
                  )}
                </Badge>
              ))}
              {atsData.allMissingKeywords.length > 30 && (
                <Badge variant="outline">
                  +{atsData.allMissingKeywords.length - 30} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Section Breakdown */}
      {atsData.perSection && atsData.perSection.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section-by-Section Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {atsData.perSection.map((section: any, idx: number) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{section.sectionHeading}</span>
                  <Badge variant={section.coverageScore >= 70 ? 'default' : 'secondary'}>
                    {Math.round(section.coverageScore)}%
                  </Badge>
                </div>
                <Progress value={section.coverageScore} />
                {section.missingKeywords && section.missingKeywords.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Missing: {section.missingKeywords.slice(0, 5).map((kw: any) => kw.phrase).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Narrative Summary */}
      {atsData.narrative && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{atsData.narrative}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack}>
          Go Back & Optimize
        </Button>
        <Button 
          onClick={onExport} 
          className="flex-1"
          disabled={overallScore < 60}
        >
          <Download className="mr-2 h-4 w-4" />
          {overallScore >= 60 ? 'Export Resume' : 'Improve Score to Export'}
        </Button>
      </div>

      {overallScore < 60 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-orange-900 mb-1">
                  Recommendation: Improve Your Score
                </h4>
                <p className="text-sm text-orange-800">
                  Your ATS score is below the recommended threshold of 60%. Consider adding the missing
                  must-have keywords and optimizing your resume sections before exporting.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

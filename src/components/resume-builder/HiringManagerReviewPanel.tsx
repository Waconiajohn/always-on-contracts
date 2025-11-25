import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ExternalLink,
  Loader2,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';
import { invokeEdgeFunction } from '@/lib/edgeFunction';

interface HiringManagerReviewProps {
  resumeContent: string;
  jobDescription: string;
  jobTitle?: string;
  industry?: string;
  onContinue: () => void;
  onBack: () => void;
}

export function HiringManagerReviewPanel({
  resumeContent,
  jobDescription,
  jobTitle,
  industry,
  onContinue,
  onBack
}: HiringManagerReviewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [citations, setCitations] = useState<string[]>([]);

  const analyzeResume = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await invokeEdgeFunction('hiring-manager-review', {
        resumeContent,
        jobDescription,
        jobTitle,
        industry
      });

      if (error) {
        toast.error('Failed to analyze resume');
        return;
      }

      setReview(data.review);
      setCitations(data.citations || []);
      toast.success('Review complete!');
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'deal_breaker':
        return 'destructive';
      case 'concerning':
        return 'default';
      case 'minor':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Hiring Manager Review</h2>
        <p className="text-muted-foreground">
          Get an honest, real-world perspective from the hiring manager's point of view
        </p>
      </div>

      {!review && (
        <Card>
          <CardHeader>
            <CardTitle>Ready for Review</CardTitle>
            <CardDescription>
              This analysis uses real-time market data to simulate how an actual hiring manager
              would evaluate your resume during the critical 6-second scan and deeper review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={analyzeResume}
              disabled={isAnalyzing}
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                'Start Hiring Manager Review'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {review && (
        <>
          {/* Interview Decision */}
          <Alert className={review.would_interview ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
            <div className="flex items-center gap-3">
              {review.would_interview ? (
                <ThumbsUp className="h-6 w-6 text-green-600" />
              ) : (
                <ThumbsDown className="h-6 w-6 text-red-600" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {review.would_interview ? 'Would Interview' : 'Would Not Interview'}
                </h3>
                <p className="text-sm mt-1">{review.overall_impression}</p>
                <Badge variant="outline" className="mt-2">
                  Confidence: {review.confidence_level}
                </Badge>
              </div>
            </div>
          </Alert>

          {/* Strengths */}
          {review.strengths && review.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.strengths.map((strength: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium">{strength.point}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {strength.hiring_manager_perspective}
                        </p>
                      </div>
                      <Badge variant={strength.impact_level === 'critical' ? 'default' : 'secondary'}>
                        {strength.impact_level}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Critical Gaps */}
          {review.critical_gaps && review.critical_gaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Critical Gaps to Address
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.critical_gaps.map((gap: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-orange-900">{gap.gap}</p>
                      <Badge variant={getSeverityColor(gap.severity)}>
                        {gap.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Why it matters:</strong> {gap.why_matters}
                    </p>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-sm">
                        <strong className="text-blue-900">Recommendation:</strong>{' '}
                        {gap.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Improvement Suggestions */}
          {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Specific Improvements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.improvement_suggestions.map((suggestion: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline">{suggestion.section}</Badge>
                      <Badge variant={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority} priority
                      </Badge>
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="bg-red-50 p-3 rounded border border-red-200">
                        <p className="text-xs font-medium text-red-900 mb-1">CURRENT:</p>
                        <p className="text-sm text-red-800">{suggestion.current}</p>
                      </div>
                      
                      <div className="bg-green-50 p-3 rounded border border-green-200">
                        <p className="text-xs font-medium text-green-900 mb-1">SUGGESTED:</p>
                        <p className="text-sm text-green-800">{suggestion.suggested_improvement}</p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground italic">
                      {suggestion.rationale}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Market Intelligence */}
          {review.market_intelligence && (
            <Card>
              <CardHeader>
                <CardTitle>Market Intelligence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {review.market_intelligence.typical_requirements && (
                  <div>
                    <h4 className="font-medium mb-2">Typical Requirements</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {review.market_intelligence.typical_requirements.map((req: string, idx: number) => (
                        <li key={idx} className="text-sm">{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.market_intelligence.competitive_differentiators && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-900">Competitive Differentiators</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {review.market_intelligence.competitive_differentiators.map((diff: string, idx: number) => (
                        <li key={idx} className="text-sm text-green-800">{diff}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {review.market_intelligence.red_flags_to_avoid && (
                  <div>
                    <h4 className="font-medium mb-2 text-red-900">Red Flags to Avoid</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {review.market_intelligence.red_flags_to_avoid.map((flag: string, idx: number) => (
                        <li key={idx} className="text-sm text-red-800">{flag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Citations */}
          {citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sources & Citations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {citations.map((citation, idx) => (
                    <a
                      key={idx}
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {citation}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={onBack}>
              Go Back & Improve
            </Button>
            <Button onClick={onContinue} className="flex-1">
              Continue to ATS Analysis
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

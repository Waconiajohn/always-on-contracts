import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOptimizerStore } from '@/stores/optimizerStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RefreshCw,
  Download,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExportDialog, ExportFormat } from '../components/ExportDialog';
import { exportResume } from '../utils/exportHandler';

const RECOMMENDATION_CONFIG: Record<string, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  'strong-yes': {
    label: 'Strong Yes',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    icon: <ThumbsUp className="h-5 w-5 fill-emerald-600 text-emerald-600" />
  },
  'yes': {
    label: 'Yes',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: <CheckCircle2 className="h-5 w-5 text-green-600" />
  },
  'maybe': {
    label: 'Maybe',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    icon: <HelpCircle className="h-5 w-5 text-amber-600" />
  },
  'no': {
    label: 'No',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: <XCircle className="h-5 w-5 text-red-600" />
  }
};

export function Step6HiringManager() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Zustand store - use benchmarkResume instead of resumeVersions
  const benchmarkResume = useOptimizerStore(state => state.benchmarkResume);
  const jobDescription = useOptimizerStore(state => state.jobDescription);
  const jobTitle = useOptimizerStore(state => state.jobTitle);
  const selectedTemplate = useOptimizerStore(state => state.selectedTemplate);
  const hiringManagerReview = useOptimizerStore(state => state.hiringManagerReview);
  const setHMReview = useOptimizerStore(state => state.setHMReview);
  const setProcessing = useOptimizerStore(state => state.setProcessing);
  const goToPrevStep = useOptimizerStore(state => state.goToPrevStep);
  const addVersionHistory = useOptimizerStore(state => state.addVersionHistory);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  useEffect(() => {
    if (!hiringManagerReview) {
      runReview();
    }
  }, []);
  
  const runReview = async () => {
    setIsLoading(true);
    setError(null);
    setProcessing(true, 'Getting hiring manager perspective...');
    
    try {
      const { data, error: apiError } = await supabase.functions.invoke('hiring-manager-review', {
        body: {
          resumeContent: benchmarkResume?.sections || [],
          jobDescription,
          jobTitle
        }
      });
      
      if (apiError) {
        // Handle rate limit and payment errors
        if (apiError.message?.includes('429') || apiError.message?.includes('rate limit')) {
          setError('You\'ve reached your usage limit. Please try again later.');
          toast({
            title: 'Rate Limit Reached',
            description: 'Please wait a moment before trying again.',
            variant: 'destructive'
          });
          return;
        }
        if (apiError.message?.includes('402') || apiError.message?.includes('payment')) {
          setError('This feature requires an active subscription.');
          toast({
            title: 'Subscription Required',
            description: 'Please upgrade to access this feature.',
            variant: 'destructive'
          });
          return;
        }
        throw apiError;
      }
      
      // Map edge function response to expected format
      const review = data?.review || data;
      const recommendation = review.would_interview ? 'yes' : 'maybe';
      const mappedReview = {
        recommendation: recommendation as 'strong-yes' | 'yes' | 'maybe' | 'no',
        overallImpression: review.overall_impression || review.overallImpression || '',
        strengthsIdentified: review.strengths?.map((s: any) => s.point || s) || review.strengthsIdentified || [],
        specificConcerns: review.critical_gaps?.map((g: any) => ({
          area: g.gap || g.area,
          concern: g.why_matters || g.concern,
          suggestion: g.recommendation || g.suggestion,
          severity: (g.severity === 'deal_breaker' ? 'critical' : g.severity === 'concerning' ? 'moderate' : 'minor') as 'critical' | 'moderate' | 'minor'
        })) || review.specificConcerns || [],
        areasForImprovement: review.improvement_suggestions?.map((s: any) => s.suggested_improvement || s) || review.areasForImprovement || [],
        suggestedQuestions: review.market_intelligence?.typical_requirements || review.suggestedQuestions || []
      };
      setHMReview(mappedReview);
      
      // Save version history
      addVersionHistory({
        stepCompleted: 'hiring-manager',
        resumeSnapshot: benchmarkResume?.resumeText || '',
        changeDescription: `Hiring manager review complete: ${mappedReview.recommendation}`
      });
    } catch (err: any) {
      console.error('HM review error:', err);
      setError(err.message || 'Could not get hiring manager review');
      toast({
        title: 'Review Failed',
        description: err.message || 'Could not get hiring manager review',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setProcessing(false);
    }
  };
  
  const handleExport = async (format: ExportFormat) => {
    if (!benchmarkResume) {
      toast({
        title: 'No resume available',
        description: 'Please generate a benchmark resume first',
        variant: 'destructive'
      });
      return;
    }

    try {
      // BenchmarkResume can now be passed directly to exportResume
      await exportResume(
        format,
        benchmarkResume,
        null,
        jobTitle,
        selectedTemplate?.id
      );
      toast({
        title: 'Export successful',
        description: `Your resume has been downloaded as ${format.toUpperCase()}`
      });
    } catch (err: any) {
      console.error('Export error:', err);
      toast({
        title: 'Export failed',
        description: err.message || 'Could not export resume',
        variant: 'destructive'
      });
    }
  };
  
  const handleFinish = () => {
    toast({
      title: 'Resume Optimization Complete!',
      description: 'Your optimized resume is ready.'
    });
    navigate('/my-resumes');
  };
  
  if (isLoading || (!hiringManagerReview && !error)) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Getting hiring manager perspective...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={goToPrevStep} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={runReview}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const review = hiringManagerReview!;
  const recConfig = RECOMMENDATION_CONFIG[review.recommendation] || RECOMMENDATION_CONFIG['maybe'];
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Recommendation Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hiring Manager Review</CardTitle>
              <CardDescription>
                How a hiring manager would likely perceive your resume
              </CardDescription>
            </div>
            <div className={cn('flex items-center gap-2 px-4 py-2 rounded-full', recConfig.bgColor)}>
              {recConfig.icon}
              <span className={cn('font-semibold', recConfig.color)}>{recConfig.label}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{review.overallImpression}</p>
        </CardContent>
      </Card>
      
      {/* Strengths */}
      {review.strengthsIdentified?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Strengths Identified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {review.strengthsIdentified.map((strength, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <ThumbsUp className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Concerns */}
      {review.specificConcerns?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Specific Concerns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {review.specificConcerns.map((concern, idx) => (
              <div key={idx} className="rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{concern.area}</span>
                  <Badge 
                    variant="outline"
                    className={cn(
                      concern.severity === 'critical' && 'border-red-300 text-red-700 bg-red-50',
                      concern.severity === 'moderate' && 'border-amber-300 text-amber-700 bg-amber-50',
                      concern.severity === 'minor' && 'border-gray-300 text-gray-700 bg-gray-50'
                    )}
                  >
                    {concern.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{concern.concern}</p>
                <p className="text-sm">
                  <span className="font-medium">Suggestion: </span>
                  {concern.suggestion}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Areas for Improvement */}
      {review.areasForImprovement?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {review.areasForImprovement.map((area, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Likely Interview Questions */}
      {review.suggestedQuestions?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              Likely Interview Questions
            </CardTitle>
            <CardDescription className="text-xs">
              Questions a hiring manager might ask based on your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 list-decimal list-inside">
              {review.suggestedQuestions.map((question, idx) => (
                <li key={idx} className="text-sm">{question}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
      
      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={goToPrevStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={runReview} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Re-run Review
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExportDialog(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleFinish} className="gap-2">
            <FileText className="h-4 w-4" />
            Finish & Save
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        resumeName="Benchmark Resume"
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, TrendingUp, Briefcase, ArrowRight, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseClient } from '@/hooks/useAuth';

interface MarketResearchStepProps {
  onComplete: (data: {
    researchId: string;
    marketData: any;
  }) => void;
  vaultId: string;
  targetRoles: string[];
  targetIndustries: string[];
  resumeText: string;
}

export default function MarketResearchStep({
  onComplete,
  vaultId,
  targetRoles,
  targetIndustries,
  resumeText
}: MarketResearchStepProps) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'analyzing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [jobsFound, setJobsFound] = useState(0);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    startAnalysis();
  }, []);

  const startAnalysis = async () => {
    setStatus('searching');
    setProgress(10);
    setError(null);

    try {
      // Use the primary target role
      const primaryRole = targetRoles[0];
      const primaryIndustry = targetIndustries[0];

      // Step 1: Search live jobs (via analyze-market-fit function)
      // The function handles searching + AI extraction in one go
      setStatus('analyzing');
      
      // Simulated progress for better UX while waiting
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 1000);

      const { data, error: functionError } = await supabase.functions.invoke('analyze-market-fit', {
        body: {
          vaultId,
          targetRole: primaryRole,
          targetIndustry: primaryIndustry,
          resumeText,
          numJobs: 15 // Request 15 jobs for robust analysis
        }
      });

      clearInterval(progressInterval);

      if (functionError || !data) {
        throw new Error(functionError?.message || 'Market analysis failed');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setJobsFound(data.marketData?.jobsAnalyzed || 0);
      setAnalysisData(data);
      setProgress(100);
      setStatus('complete');

      toast({
        title: 'Market Analysis Complete',
        description: `Analyzed ${data.marketData?.jobsAnalyzed || 0} job postings for ${primaryRole}`,
      });

    } catch (err: any) {
      console.error('Market research error:', err);
      setError(err.message || 'Failed to analyze market data');
      setStatus('error');
    }
  };

  if (status === 'error') {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-red-200 shadow-xl">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-600">{error}</p>
          <Button onClick={startAnalysis} variant="outline">
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'complete' && analysisData) {
    const { marketData, gaps } = analysisData;
    const commonSkills = marketData.commonSkills || [];
    const matchScore = 100 - (gaps.length * 5); // Rough estimate for visual

    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Market Analysis Results
          </CardTitle>
          <CardDescription>
            We compared your profile against {jobsFound} live job postings for <strong>{targetRoles[0]}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{jobsFound}</div>
              <div className="text-sm text-slate-600">Jobs Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{commonSkills.length}</div>
              <div className="text-sm text-slate-600">Key Skills Identified</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${matchScore > 70 ? 'text-green-600' : 'text-amber-600'}`}>
                {Math.max(0, matchScore)}%
              </div>
              <div className="text-sm text-slate-600">Initial Match Score</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-500" />
              Top Required Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {commonSkills.slice(0, 8).map((skill: string, i: number) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
              {commonSkills.length > 8 && (
                <Badge variant="outline">+{commonSkills.length - 8} more</Badge>
              )}
            </div>
          </div>

          {gaps.length > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                We identified <strong>{gaps.length} potential gaps</strong> between your resume and market expectations.
                In the next step, we'll help you bridge these gaps.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={() => onComplete({ researchId: analysisData.researchId, marketData })} 
            className="w-full" 
            size="lg"
          >
            Continue to Gap Analysis
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          Analyzing Job Market
        </CardTitle>
        <CardDescription>
          Searching live job postings for <strong>{targetRoles[0]}</strong>...
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Searching major job boards...</span>
          </div>
          <div className={`flex items-center gap-3 text-sm text-slate-700 ${progress < 30 ? 'opacity-50' : ''}`}>
            <CheckCircle2 className={`w-4 h-4 ${progress >= 30 ? 'text-green-500' : 'text-slate-300'}`} />
            <span>Extracting requirements from job descriptions...</span>
          </div>
          <div className={`flex items-center gap-3 text-sm text-slate-700 ${progress < 60 ? 'opacity-50' : ''}`}>
            <CheckCircle2 className={`w-4 h-4 ${progress >= 60 ? 'text-green-500' : 'text-slate-300'}`} />
            <span>Comparing your resume to market standards...</span>
          </div>
          <div className={`flex items-center gap-3 text-sm text-slate-700 ${progress < 80 ? 'opacity-50' : ''}`}>
            <CheckCircle2 className={`w-4 h-4 ${progress >= 80 ? 'text-green-500' : 'text-slate-300'}`} />
            <span>Identifying competitive gaps...</span>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900 text-sm">
            <strong>Did you know?</strong> We analyze 15+ live job descriptions to ensure your 
            career strategy matches <em>current</em> hiring trends, not outdated advice.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

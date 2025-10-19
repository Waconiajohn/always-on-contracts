import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Brain, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutoPopulateStepProps {
  vaultId: string;
  resumeText: string;
  targetRoles?: string[];
  targetIndustries?: string[];
  onComplete: (extractedData: any) => void;
}

/**
 * AUTO-POPULATE STEP
 *
 * This component triggers the AI to auto-populate the career vault
 * from the resume, then shows progress and results.
 */
export const AutoPopulateStep = ({
  vaultId,
  resumeText,
  targetRoles = [],
  targetIndustries = [],
  onComplete
}: AutoPopulateStepProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<'ready' | 'processing' | 'success' | 'error'>('ready');
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');

  useEffect(() => {
    // Auto-start population after a brief delay
    const timer = setTimeout(() => {
      handleAutoPopulate();
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAutoPopulate = async () => {
    setStatus('processing');
    setProgress(10);

    try {
      const messages = [
        '🧠 AI is analyzing your achievements...',
        '💡 Discovering hidden competencies...',
        '✨ Extracting leadership insights...',
        '🎯 Identifying transferable skills...',
        '🔍 Finding power phrases with metrics...'
      ];

      let messageIndex = 0;

      // Progress updates - stop at 85%
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const next = Math.min(prev + 5, 85);
          if (next >= 85) {
            clearInterval(progressInterval);
            // Switch to deep analysis mode
            setDeepAnalysis(true);
            setAnalysisMessage(messages[0]);

            // Rotate messages during deep analysis
            const messageInterval = setInterval(() => {
              messageIndex = (messageIndex + 1) % messages.length;
              setAnalysisMessage(messages[messageIndex]);
            }, 4000);

            // Store interval ID to clear later
            (progressInterval as any).messageInterval = messageInterval;
          }
          return next;
        });
      }, 600);

      toast({
        title: 'AI Analysis Started',
        description: 'Extracting comprehensive career intelligence from your resume...'
      });

      // Call the auto-populate function
      const { data, error } = await supabase.functions.invoke('auto-populate-vault', {
        body: {
          vaultId,
          resumeText,
          targetRoles,
          targetIndustries
        }
      });

      clearInterval(progressInterval);
      if ((progressInterval as any).messageInterval) {
        clearInterval((progressInterval as any).messageInterval);
      }
      setDeepAnalysis(false);

      console.log('[AUTO-POPULATE] Full response:', { data, error });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Auto-population failed');
      }

      console.log('[AUTO-POPULATE] Success! Extracted data:', {
        totalExtracted: data.totalExtracted,
        categories: data.categories,
        extractedData: data.extractedData
      });

      setProgress(100);
      setExtractedData(data);
      setStatus('success');

      toast({
        title: 'Vault Auto-Populated!',
        description: `Successfully extracted ${data.totalExtracted} intelligence items across ${data.categories.length} categories`
      });
    } catch (error: any) {
      console.error('[AUTO-POPULATE] Error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to auto-populate vault');

      toast({
        title: 'Auto-Population Failed',
        description: error.message || 'Please try again or use the manual interview',
        variant: 'destructive'
      });
    }
  };

  const handleRetry = () => {
    setStatus('ready');
    setProgress(0);
    setErrorMessage('');
    handleAutoPopulate();
  };

  const handleContinue = () => {
    if (extractedData) {
      onComplete(extractedData);
    }
  };

  if (status === 'ready' || status === 'processing') {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
            <Brain className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <CardTitle className="text-2xl">AI Intelligence Extraction</CardTitle>
          <CardDescription>
            Our AI is analyzing your resume across 20 intelligence categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!deepAnalysis ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="font-medium">AI Deep Analysis in Progress...</span>
              </div>
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <p className="text-sm font-medium text-primary animate-pulse">{analysisMessage}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Typically takes 30-60 seconds - AI is being thorough!
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <Sparkles className="h-5 w-5 mx-auto mb-1 text-purple-600" />
              <p className="text-xs font-medium">Power Phrases</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Zap className="h-5 w-5 mx-auto mb-1 text-blue-600" />
              <p className="text-xs font-medium">Skills</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <Brain className="h-5 w-5 mx-auto mb-1 text-amber-600" />
              <p className="text-xs font-medium">Competencies</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-xs font-medium">Leadership</p>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border text-sm space-y-2">
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              What AI is extracting:
            </p>
            <ul className="space-y-1 text-muted-foreground ml-6">
              <li>• Quantified achievements with metrics</li>
              <li>• Transferable skills across industries</li>
              <li>• Hidden competencies not obvious from titles</li>
              <li>• Leadership philosophy and executive presence</li>
              <li>• Personality traits and work style</li>
              <li>• Core values and behavioral patterns</li>
            </ul>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This usually takes 30-60 seconds. AI is being thorough!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error') {
    return (
      <Card className="w-full border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-4 bg-destructive/10 rounded-full w-fit">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Auto-Population Failed</CardTitle>
          <CardDescription>{errorMessage}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">What happened?</p>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRetry}
              variant="outline"
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              onClick={() => onComplete({ useManualInterview: true })}
              className="flex-1"
            >
              Use Manual Interview Instead
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  return (
    <Card className="w-full border-green-200 dark:border-green-800">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-full w-fit">
          <CheckCircle2 className="h-12 w-12 text-green-600 animate-bounce" />
        </div>
        <CardTitle className="text-2xl">Vault Auto-Populated!</CardTitle>
        <CardDescription>
          AI successfully extracted comprehensive career intelligence
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg border">
            <p className="text-3xl font-bold text-primary">
              {extractedData?.totalExtracted || 0}
            </p>
            <p className="text-sm text-muted-foreground">Items Extracted</p>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg border">
            <p className="text-3xl font-bold text-primary">
              {extractedData?.categories?.length || 0}
            </p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </div>
          <div className="text-center p-4 bg-primary/5 rounded-lg border">
            <p className="text-3xl font-bold text-primary">
              {extractedData?.vaultCompletion || 85}%
            </p>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
        </div>

        {/* Categories Populated */}
        {extractedData?.summary && (
          <div className="space-y-3">
            <p className="font-medium text-sm">Top Strength Areas:</p>
            <div className="flex flex-wrap gap-2">
              {extractedData.summary.strengthAreas?.map((area: string, idx: number) => (
                <Badge key={idx} variant="secondary">{area}</Badge>
              ))}
            </div>

            {extractedData.summary.uniqueDifferentiators && (
              <>
                <p className="font-medium text-sm mt-4">What Makes You Stand Out:</p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800 text-sm">
                  <ul className="space-y-1">
                    {extractedData.summary.uniqueDifferentiators.map((diff: string, idx: number) => (
                      <li key={idx}>• {diff}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className="p-4 bg-muted/50 rounded-lg border text-sm">
          <p className="font-medium mb-2">Next Step:</p>
          <p className="text-muted-foreground">
            Quick review: Approve, edit, or skip each extracted item. Takes just 5-10 minutes!
          </p>
        </div>

        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full"
        >
          Review Extracted Intelligence
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You can skip review and start using your vault at 85% power
        </p>
      </CardContent>
    </Card>
  );
};

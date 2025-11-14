import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Sparkles, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNotifications, NotificationCenter } from '@/components/ui/notification-center';
import { 
  AutoPopulateVaultSchema,
  validateInput,
  invokeEdgeFunction 
} from '@/lib/edgeFunction';
import { AIBrainAnimation } from './AIBrainAnimation';
import { ExtractionRecoveryCard } from './ExtractionRecoveryCard';
import { useExtractionProgress } from '@/hooks/useExtractionProgress';

interface AutoPopulateStepProps {
  vaultId: string;
  resumeText: string;
  targetRoles?: string[];
  targetIndustries?: string[];
  onComplete: (extractedData: any) => void;
}

export const AutoPopulateStep = ({
  vaultId,
  resumeText,
  targetRoles = [],
  targetIndustries = [],
  onComplete
}: AutoPopulateStepProps) => {
  const { notifications, showNotification, dismissNotification } = useNotifications();
  const [status, setStatus] = useState<'ready' | 'processing' | 'success' | 'error'>('ready');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  
  // Use real-time progress tracking from edge function
  const { progress, currentMessage, isComplete } = useExtractionProgress(vaultId);
  
  const recoveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleAutoPopulate();
    }, 1500);

    // Show recovery options after 90 seconds if still processing
    recoveryTimeoutRef.current = setTimeout(() => {
      if (status === 'processing' && !isComplete) {
        setShowRecovery(true);
      }
    }, 90000);

    return () => {
      clearTimeout(timer);
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current);
      }
    };
  }, []);

  // React to real-time completion
  useEffect(() => {
    if (isComplete && status === 'processing') {
      handleCompletionCheck();
    }
  }, [isComplete, status]);

  const handleCompletionCheck = async () => {
    try {
      const { data: vaultData, error: vaultError } = await supabase
        .from('career_vault')
        .select('extraction_item_count, auto_populated')
        .eq('id', vaultId)
        .single();

      if (vaultError) {
        console.error('[AUTO-POPULATE] Error checking completion:', vaultError);
        return;
      }

      if (vaultData?.auto_populated && (vaultData.extraction_item_count || 0) > 0) {
        setStatus('success');
        setExtractedData({
          totalItems: vaultData.extraction_item_count,
          success: true
        });
        
        showNotification({
          type: 'success',
          title: '✅ Vault Population Complete',
          description: `Successfully extracted ${vaultData.extraction_item_count} career intelligence items!`,
          duration: 5000
        });
      }
    } catch (error) {
      console.error('[AUTO-POPULATE] Completion check error:', error);
    }
  };

  const handleAutoPopulate = async () => {
    setStatus('processing');

    try {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('[AUTO-POPULATE] Session refresh warning:', refreshError);
      }

      showNotification({
        type: 'ai-insight',
        title: '🧠 AI Analysis Started',
        description: 'Extracting comprehensive career intelligence from your resume...',
        duration: 8000
      });

      const validated = validateInput(AutoPopulateVaultSchema, {
        vaultId,
        resumeText,
        targetRoles,
        targetIndustries
      });

      const { data, error } = await invokeEdgeFunction(
        'auto-populate-vault-v3',
        validated
      );

      if (error) {
        console.error('[AUTO-POPULATE] Edge function error:', error);
        setErrorMessage(error.message || 'Extraction failed');
        setStatus('error');
        setShowRecovery(true);
        
        showNotification({
          type: 'error',
          title: 'Extraction Error',
          description: error.message || 'Failed to populate vault',
          duration: 10000
        });
        return;
      }

      if (data?.success) {
        setStatus('success');
        setExtractedData(data.data);
        
        showNotification({
          type: 'success',
          title: '✅ Extraction Complete!',
          description: `Successfully extracted ${data.data?.extracted?.total || 0} items`,
          duration: 5000
        });
      } else {
        await handleCompletionCheck();
      }

    } catch (error: any) {
      console.error('[AUTO-POPULATE] Exception:', error);
      setErrorMessage(error.message || 'Unexpected error during extraction');
      setStatus('error');
      setShowRecovery(true);
      
      showNotification({
        type: 'error',
        title: 'Extraction Failed',
        description: error.message || 'An unexpected error occurred',
        duration: 10000
      });
    }
  };

  const handleRetry = () => {
    setShowRecovery(false);
    setErrorMessage('');
    setStatus('ready');
    setTimeout(() => handleAutoPopulate(), 500);
  };

  const handleSkip = () => {
    onComplete({ skipped: true, totalItems: 0 });
  };

  const handleContinue = () => {
    onComplete(extractedData);
  };

  // PROCESSING STATE
  if (status === 'processing') {
    return (
      <div className="space-y-6">
        <Card className="p-8">
          <div className="space-y-6">
            <AIBrainAnimation progress={progress} />
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                {currentMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          </div>
        </Card>

        {showRecovery && (
          <ExtractionRecoveryCard
            onRetry={handleRetry}
            onSkip={handleSkip}
            errorMessage={errorMessage}
          />
        )}

        <NotificationCenter 
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </div>
    );
  }

  // ERROR STATE
  if (status === 'error') {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 bg-destructive/10 rounded-full w-fit">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center text-2xl">Auto-Population Failed</CardTitle>
            <CardDescription className="text-center">
              {errorMessage || 'An error occurred during extraction'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 justify-center">
              <Button onClick={handleRetry} variant="default">
                Try Again
              </Button>
              <Button onClick={() => onComplete({ skipped: true })} variant="outline">
                Use Manual Interview Instead
              </Button>
            </div>
          </CardContent>
        </Card>

        <NotificationCenter 
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </div>
    );
  }

  // SUCCESS STATE
  if (status === 'success' && extractedData) {
    const stats = extractedData.extracted || {};
    const total = stats.total || extractedData.totalItems || 0;

    return (
      <div className="space-y-6">
        <Card className="border-success/50 bg-success/5">
          <CardHeader>
            <div className="mx-auto mb-4 p-4 bg-success/10 rounded-full w-fit animate-scale-in">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <CardTitle className="text-center text-2xl">
              Career Intelligence Extracted!
            </CardTitle>
            <CardDescription className="text-center">
              Your vault has been populated with {total} insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(stats.powerPhrasesCount || 0) > 0 && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Award className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.powerPhrasesCount}</div>
                  <div className="text-xs text-muted-foreground">Power Phrases</div>
                </div>
              )}
              {(stats.skillsCount || 0) > 0 && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.skillsCount}</div>
                  <div className="text-xs text-muted-foreground">Skills</div>
                </div>
              )}
              {(stats.competenciesCount || 0) > 0 && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.competenciesCount}</div>
                  <div className="text-xs text-muted-foreground">Competencies</div>
                </div>
              )}
              {(stats.softSkillsCount || 0) > 0 && (
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{stats.softSkillsCount}</div>
                  <div className="text-xs text-muted-foreground">Soft Skills</div>
                </div>
              )}
            </div>

            {/* Quality Breakdown */}
            {extractedData.qualityBreakdown && (
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-semibold mb-3 text-sm">Quality Distribution</h4>
                <div className="flex gap-2 flex-wrap">
                  {(extractedData.qualityBreakdown.verified || 0) > 0 && (
                    <Badge variant="default">
                      {extractedData.qualityBreakdown.verified} Verified
                    </Badge>
                  )}
                  {(extractedData.qualityBreakdown.needsReview || 0) > 0 && (
                    <Badge variant="secondary">
                      {extractedData.qualityBreakdown.needsReview} Needs Review
                    </Badge>
                  )}
                  {(extractedData.qualityBreakdown.draft || 0) > 0 && (
                    <Badge variant="outline">
                      {extractedData.qualityBreakdown.draft} Draft
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Next Steps:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                  <span>Review and enhance extracted intelligence</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                  <span>Answer strategic questions to fill gaps</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" />
                  <span>Use your vault to build targeted resumes</span>
                </li>
              </ul>
            </div>

            <Button 
              onClick={handleContinue}
              size="lg"
              className="w-full"
            >
              Review Extracted Intelligence
            </Button>
          </CardContent>
        </Card>

        <NotificationCenter 
          notifications={notifications}
          onDismiss={dismissNotification}
        />
      </div>
    );
  }

  return null;
};

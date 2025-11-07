import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MigrationResult {
  cleanup?: {
    deleted: {
      powerPhrases: number;
      transferableSkills: number;
      hiddenCompetencies: number;
      softSkills: number;
      leadershipPhilosophy: number;
      executivePresence: number;
      other: number;
      total: number;
    };
  };
  extraction?: {
    powerPhrasesCount: number;
    skillsCount: number;
    competenciesCount: number;
    softSkillsCount: number;
    total: number;
  };
  validation?: {
    overallConfidence: number;
  };
}

interface VaultMigrationToolProps {
  vaultId: string;
  resumeText?: string;
  onComplete?: () => void;
  onDataChange?: () => void;
}

export function VaultMigrationTool({ vaultId, resumeText, onComplete, onDataChange }: VaultMigrationToolProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'idle' | 'cleanup' | 'extraction' | 'complete'>('idle');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    if (!resumeText) {
      toast({
        title: "Resume Required",
        description: "Please upload a resume before running vault migration.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      // Step 1: Cleanup with retry logic
      setCurrentStep('cleanup');
      
      let cleanupData = null;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        const { data, error: cleanupError } = await supabase.functions.invoke('vault-cleanup', {
          body: {
            vaultId,
            confirmation: 'DELETE_ALL_DATA',
            preserveVaultRecord: true,
          },
        });

        if (!cleanupError) {
          cleanupData = data;
          break;
        }

        // If function not deployed yet, wait and retry
        if (cleanupError.message.includes('Failed to send a request') && retries < maxRetries - 1) {
          retries++;
          toast({
            title: "Function Deploying...",
            description: `Waiting for function deployment (attempt ${retries}/${maxRetries})`,
          });
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
          continue;
        }

        throw new Error(`Cleanup failed: ${cleanupError.message}`);
      }

      if (!cleanupData) {
        throw new Error('Cleanup failed after retries. The function may still be deploying. Please try again in 1-2 minutes.');
      }

      // Step 2: Re-extraction with v3
      setCurrentStep('extraction');
      const { data: extractionData, error: extractionError } = await supabase.functions.invoke('auto-populate-vault-v3', {
        body: {
          resumeText,
          vaultId,
          mode: 'full',
        },
      });

      if (extractionError) {
        console.error('Extraction error details:', extractionError);
        throw new Error(`Extraction failed: ${extractionError.message}. ${extractionData?.error || ''}`);
      }

      if (!extractionData?.success) {
        console.error('Extraction failed:', extractionData);
        throw new Error(`Extraction failed: ${extractionData?.error || 'Unknown error'}`);
      }

      setResult({
        cleanup: cleanupData,
        extraction: extractionData?.data?.extracted,
        validation: extractionData?.data?.validation,
      });

      setCurrentStep('complete');
      
      toast({
        title: "Migration Complete! ✅",
        description: `Cleaned ${cleanupData?.deleted?.total || 0} items and extracted ${extractionData?.data?.extracted?.total || 0} new items.`,
      });

      // Refresh dashboard data to show correct counts
      onDataChange?.();
      onComplete?.();

    } catch (err: any) {
      setError(err.message || 'Migration failed');
      setCurrentStep('idle');
      toast({
        title: "Migration Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Vault Migration Tool
        </CardTitle>
        <CardDescription>
          Clean up duplicate items and re-extract your vault with the latest V3 extraction engine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will delete all existing vault items and re-extract from your resume. This process cannot be undone.
          </AlertDescription>
        </Alert>

        {!resumeText && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No resume found. Please upload a resume to Career Vault before running migration.
            </AlertDescription>
          </Alert>
        )}

        {currentStep !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {currentStep === 'cleanup' && <Loader2 className="h-4 w-4 animate-spin" />}
              {currentStep !== 'cleanup' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              <span className={currentStep === 'cleanup' ? 'font-medium' : 'text-muted-foreground'}>
                Step 1: Cleaning existing items
              </span>
            </div>
            <div className="flex items-center gap-2">
              {currentStep === 'extraction' && <Loader2 className="h-4 w-4 animate-spin" />}
              {currentStep === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {currentStep !== 'extraction' && currentStep !== 'complete' && <div className="h-4 w-4" />}
              <span className={currentStep === 'extraction' ? 'font-medium' : 'text-muted-foreground'}>
                Step 2: Re-extracting with V3 engine
              </span>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <h4 className="font-semibold text-sm">Migration Results:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Items Deleted:</p>
                <p className="text-2xl font-bold">{result.cleanup?.deleted?.total || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Items Extracted:</p>
                <p className="text-2xl font-bold">{result.extraction?.total || 0}</p>
              </div>
            </div>
            {result.validation && (
              <p className="text-xs text-muted-foreground">
                Extraction Confidence: {result.validation.overallConfidence || 0}%
              </p>
            )}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleMigration}
          disabled={isProcessing || !resumeText}
          className="w-full"
          variant={currentStep === 'complete' ? 'outline' : 'default'}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {currentStep === 'cleanup' ? 'Cleaning...' : 'Extracting...'}
            </>
          ) : currentStep === 'complete' ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Migration Complete
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Run Vault Migration
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

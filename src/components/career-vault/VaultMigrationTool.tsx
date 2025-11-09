import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { validateInput, invokeEdgeFunction, VaultCleanupSchema, AutoPopulateVaultSchema } from '@/lib/edgeFunction';

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
  const queryClient = useQueryClient();

  const handleMigration = async () => {
    if (!resumeText) {
      toast({
        title: "Resume Required",
        description: "Please upload a resume before re-analyzing your vault.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    // Clear ALL React Query cache before starting
    console.log('💣 Clearing all cache before migration...');
    queryClient.clear();

    try {
      // Step 1: Cleanup with retry logic
      setCurrentStep('cleanup');
      
      let cleanupData = null;
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        const validatedInput = validateInput(VaultCleanupSchema, {
          vaultId,
          aggressive: true
        });

        const { data, error: cleanupError } = await invokeEdgeFunction(
          supabase,
          'vault-cleanup',
          validatedInput,
          { suppressErrorToast: true }
        );

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
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }

        throw new Error(`Cleanup failed: ${cleanupError.message}`);
      }

      if (!cleanupData) {
        throw new Error('Cleanup failed after retries. The function may still be deploying. Please try again in 1-2 minutes.');
      }

      // Step 2: Re-extraction with v3
      setCurrentStep('extraction');
      const validatedExtractionInput = validateInput(AutoPopulateVaultSchema, {
        vaultId,
        resumeText
      });

      const { data: extractionData, error: extractionError } = await invokeEdgeFunction(
        supabase,
        'auto-populate-vault-v3',
        validatedExtractionInput,
        { suppressErrorToast: true }
      );

      if (extractionError) {
        throw new Error(`Extraction failed: ${extractionError.message}`);
      }

      if (!extractionData?.success) {
        throw new Error(`Extraction failed: ${extractionData?.error || 'Unknown error'}`);
      }

      setResult({
        cleanup: cleanupData,
        extraction: extractionData?.data?.extracted,
        validation: extractionData?.data?.validation,
      });

      setCurrentStep('complete');
      
      const totalDeleted = cleanupData?.deleted?.total || 0;
      const totalExtracted = extractionData?.data?.extracted?.total || 0;
      
      console.log('✅ Migration complete - verifying database...');
      console.log(`Items deleted: ${totalDeleted}`);
      console.log(`Items extracted: ${totalExtracted}`);

      // Verify actual database counts
      console.log('🔍 Verifying actual database counts...');
      const { data: powerPhrases } = await supabase
        .from('vault_power_phrases')
        .select('id', { count: 'exact' })
        .eq('vault_id', vaultId);
      
      const { data: skills } = await supabase
        .from('vault_transferable_skills')
        .select('id', { count: 'exact' })
        .eq('vault_id', vaultId);
      
      const { data: competencies } = await supabase
        .from('vault_hidden_competencies')
        .select('id', { count: 'exact' })
        .eq('vault_id', vaultId);
      
      const { data: softSkills } = await supabase
        .from('vault_soft_skills')
        .select('id', { count: 'exact' })
        .eq('vault_id', vaultId);

      const actualTotal = (powerPhrases?.length || 0) + (skills?.length || 0) + 
                          (competencies?.length || 0) + (softSkills?.length || 0);
      
      console.log(`✅ Database verification: ${actualTotal} items saved`);
      console.log(`   - Power phrases: ${powerPhrases?.length || 0}`);
      console.log(`   - Skills: ${skills?.length || 0}`);
      console.log(`   - Competencies: ${competencies?.length || 0}`);
      console.log(`   - Soft skills: ${softSkills?.length || 0}`);
      
      toast({
        title: "Re-Analysis Complete! ✅",
        description: `Cleaned ${totalDeleted} items and extracted ${actualTotal} new items (verified in database).`,
      });

      // Nuclear cache clear and refetch
      console.log('💣 Clearing all cache and forcing refetch...');
      await queryClient.resetQueries({ queryKey: ['vault-data'] });
      await queryClient.invalidateQueries({ queryKey: ['vault-data'] });
      queryClient.clear();

      // Call callbacks
      console.log('🔄 Calling onDataChange callback...');
      onDataChange?.();
      
      console.log('🔄 Calling onComplete callback...');
      onComplete?.();

      // Force page reload to show fresh data (after a short delay to show success message)
      console.log('🔄 Reloading page to show fresh data...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      setError(err.message || 'Re-analysis failed');
      setCurrentStep('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Vault Re-Analysis Tool
        </CardTitle>
        <CardDescription>
          Clean your vault and re-extract career data using the latest AI extraction engine
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will delete all existing vault items and re-extract fresh data from your resume. This action cannot be undone.
          </AlertDescription>
        </Alert>

        {!resumeText && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No resume found. Please upload a resume to Career Vault before running re-analysis.
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
            <h4 className="font-semibold text-sm">Re-Analysis Results:</h4>
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
              Re-Analysis Complete
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Re-Analyze Vault
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

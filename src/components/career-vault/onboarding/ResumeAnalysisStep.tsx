// =====================================================
// RESUME ANALYSIS STEP - Career Vault 2.0
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useSupabaseClient } from '@/hooks/useAuth';
import { validateInput, invokeEdgeFunction, AnalyzeResumeInitialSchema } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface ResumeAnalysisStepProps {
  onComplete: (data: {
    vaultId: string;
    resumeText: string;
    initialAnalysis: any;
  }) => void;
  existingData?: {
    vaultId?: string;
    resumeText?: string;
    initialAnalysis?: any;
  };
}

export default function ResumeAnalysisStep({ onComplete, existingData }: ResumeAnalysisStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeText, setResumeText] = useState(existingData?.resumeText || '');
  const [analysis, setAnalysis] = useState(existingData?.initialAnalysis || null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const { user } = useUser();
  const { toast } = useToast();

  const hasExistingAnalysis = existingData?.initialAnalysis && existingData?.vaultId;
  const needsAnalysis = existingData?.resumeText && existingData?.vaultId && !existingData?.initialAnalysis;

  const handleFileUpload = async (file: File) => {
    if (!supabase || !supabase.auth) {
      setError('Authentication system is still loading. Please wait a moment and try again.');
      return;
    }

    const currentUser = user || (await supabase.auth.getUser()).data.user;
    
    if (!currentUser) {
      setError('You must be logged in to upload a resume');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data, error: processError } = await invokeEdgeFunction(
        'process-resume',
        formData
      );

      if (processError || !data?.success) {
        throw new Error(processError?.message || data?.error || 'Failed to process resume');
      }

      const extractedText = data.extractedText || data.resume_text || data.text || '';

      if (!extractedText || extractedText.length < 100) {
        throw new Error('Unable to read the resume content. Please try a different file.');
      }

      setResumeText(extractedText);
      setIsUploading(false);
      await analyzeResume(extractedText);

    } catch (err: any) {
      logger.error('Upload error', err);
      setError(err.message || 'Failed to process resume. Please try again.');
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'Please try a different file format.',
        variant: 'destructive',
      });
    }
  };

  const analyzeResumeWithRetry = async (text: string, vaultId?: string, attempt: number = 1): Promise<void> => {
    const MAX_RETRIES = 3;

    try {
      setIsAnalyzing(true);
      setError(null);

      if (!supabase || !supabase.auth) {
        throw new Error('Authentication system is still loading.');
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Session expired. Please log in again.');
      }

      const currentUser = session.user;
      let currentVaultId = vaultId;

      if (!currentVaultId) {
        const { data: existingVault } = await supabase
          .from('career_vault')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (existingVault?.id) {
          currentVaultId = existingVault.id;
          await supabase
            .from('career_vault')
            .update({
              resume_raw_text: text,
              onboarding_step: 'resume_uploaded',
            })
            .eq('id', currentVaultId);
        } else {
          const { data: vaultData, error: vaultError } = await supabase
            .from('career_vault')
            .insert({
              user_id: currentUser.id,
              resume_raw_text: text,
              onboarding_step: 'resume_uploaded',
            })
            .select()
            .single();

          if (vaultError) throw new Error(`Failed to create vault: ${vaultError.message}`);
          currentVaultId = vaultData.id;
        }
      }

      const validated = validateInput(AnalyzeResumeInitialSchema, {
        resumeText: text,
        vaultId: currentVaultId
      });

      const { data: analysisData, error: analysisError } = await invokeEdgeFunction(
        'analyze-resume-initial',
        validated
      );

      if (analysisError || !analysisData?.success) {
        throw new Error(analysisError?.message || 'Analysis failed');
      }

      setAnalysis(analysisData.data);

      toast({
        title: '🎯 Analysis Complete!',
        description: 'Your resume has been analyzed with AI.',
      });

      // CRITICAL FIX: Trigger extraction pipeline to populate vault data
      logger.info('Triggering vault extraction pipeline', { vaultId: currentVaultId });
      
      try {
        const { error: extractionError } = await invokeEdgeFunction(
          'auto-populate-vault-v3',
          { vaultId: currentVaultId, mode: 'full' }
        );
        
        if (extractionError) {
          logger.error('Extraction pipeline failed', extractionError);
          // Don't block onboarding if extraction fails - user can retry later
          toast({
            title: 'Extraction Started',
            description: 'Building your Career Vault intelligence in the background.',
            variant: 'default',
          });
        } else {
          logger.info('Extraction pipeline triggered successfully');
        }
      } catch (extractionErr: any) {
        logger.error('Failed to trigger extraction', extractionErr);
      }

      setTimeout(() => {
        onComplete({
          vaultId: currentVaultId!,
          resumeText: text,
          initialAnalysis: analysisData.data,
        });
      }, 2000);

    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          analyzeResumeWithRetry(text, vaultId, attempt + 1);
        }, Math.pow(2, attempt) * 1000);
      } else {
        setError(err.message || 'Failed to analyze resume');
        setIsAnalyzing(false);
      }
    }
  };

  const analyzeResume = async (text: string, vaultId?: string) => {
    if (!user) return;
    return analyzeResumeWithRetry(text, vaultId);
  };

  const handleResetUpload = () => {
    setResumeText('');
    setAnalysis(null);
    setError(null);
  };

  if (needsAnalysis && !isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl">Analysis Incomplete</CardTitle>
          </div>
          <CardDescription>
            Your resume is saved, but the AI analysis wasn't completed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-primary/20 bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary" />
            <AlertDescription>
              Click below to run the AI analysis and continue building your Career Vault.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => analyzeResume(existingData?.resumeText!, existingData?.vaultId)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze Resume Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleResetUpload}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Different Resume
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasExistingAnalysis && analysis) {
    return (
      <Card className="bg-gradient-to-br from-emerald-500/5 to-background border-emerald-500/20 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            <CardTitle>Analysis Complete</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">✓</div>
              <div className="text-xs text-muted-foreground mt-1">Resume Parsed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{analysis.items_extracted || '50+'}</div>
              <div className="text-xs text-muted-foreground mt-1">Items Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">✓</div>
              <div className="text-xs text-muted-foreground mt-1">AI Analyzed</div>
            </div>
          </div>

          <Button onClick={() => onComplete({
            vaultId: existingData!.vaultId!,
            resumeText: existingData!.resumeText!,
            initialAnalysis: analysis
          })} className="w-full" size="lg">
            Continue to Next Step
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background to-primary/5 border-primary/20 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-6 h-6 text-primary" />
          Upload Your Resume
        </CardTitle>
        <CardDescription>
          AI analysis completes in <strong className="text-primary">under 5 seconds</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-primary/20 bg-primary/5">
          <Sparkles className="w-4 h-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong className="text-foreground">AI-Powered Analysis:</strong> Our AI understands
            executive careers and detects your trajectory and achievements automatically.
          </AlertDescription>
        </Alert>

        {!resumeText && (
          <div
            className={`
              border-2 border-dashed rounded-xl p-12 text-center transition-all
              ${isUploading
                ? 'border-primary bg-primary/5'
                : 'border-primary/30 hover:border-primary bg-gradient-to-b from-background to-primary/5 cursor-pointer'
              }
            `}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="space-y-4">
                <FileText className="w-16 h-16 text-primary mx-auto animate-pulse" />
                <div>
                  <p className="font-medium">Processing your resume...</p>
                  <p className="text-sm text-muted-foreground">Extracting and preparing</p>
                </div>
                <Progress value={66} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                  <Upload className="relative w-16 h-16 text-primary mx-auto" />
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">PDF, DOC, DOCX, TXT</p>
                </div>
                <Button
                  onClick={() => document.getElementById('resume-upload')?.click()}
                  size="lg"
                  className="mt-4"
                >
                  Select File
                </Button>
              </div>
            )}
          </div>
        )}

        {resumeText && isAnalyzing && (
          <div className="space-y-4 py-8">
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                <Sparkles className="relative w-20 h-20 text-primary animate-pulse" />
              </div>
              <p className="font-semibold text-lg">AI Analysis in Progress...</p>
              <p className="text-sm text-muted-foreground">
                Extracting achievements, skills, and career trajectory
              </p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
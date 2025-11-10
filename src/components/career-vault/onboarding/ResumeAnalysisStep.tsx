// =====================================================
// RESUME ANALYSIS STEP - Career Vault 2.0
// =====================================================
// INSTANT AI ANALYSIS
//
// Upload → Extract text → AI analyzes in <5 seconds
//
// MARKETING MESSAGE:
// "While other tools just parse your resume, we UNDERSTAND it.
// Our AI detects your career trajectory, seniority level, and
// top achievements automatically."
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Sparkles, TrendingUp, Award, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [retryCount, setRetryCount] = useState(0);

  const supabase = useSupabaseClient();
  const { user } = useUser();
  const { toast } = useToast();

  // If we already have analysis, show it
  const hasExistingAnalysis = existingData?.initialAnalysis && existingData?.vaultId;
  
  // SMART DETECTION: Check if we have resume text but need analysis
  const needsAnalysis = existingData?.resumeText && existingData?.vaultId && !existingData?.initialAnalysis;

  const handleFileUpload = async (file: File) => {
    // Check if supabase client is initialized
    if (!supabase || !supabase.auth) {
      setError('Authentication system is still loading. Please wait a moment and try again.');
      toast({
        title: 'Please Wait',
        description: 'The authentication system is initializing. Try again in a moment.',
        variant: 'destructive',
      });
      return;
    }

    // Wait a moment for auth to load if needed
    const currentUser = user || (await supabase.auth.getUser()).data.user;
    
    if (!currentUser) {
      setError('You must be logged in to upload a resume');
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Extract text from file
      const formData = new FormData();
      formData.append('file', file);

      // Use the existing process-resume function
      const { data, error: processError } = await invokeEdgeFunction(
        'process-resume',
        formData
      );

      logger.debug('Process resume response', { data, processError });

      // Phase 5.3: Enhanced error tracking
      if (processError) {
        logger.error('Process error', processError, {
          status: processError.status,
          details: processError.details,
          timestamp: new Date().toISOString()
        });
        
        // Track error in analytics (if window.gtag exists)
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'resume_upload_error', {
            error_type: processError.status || 'unknown',
            file_type: file.type,
            file_size: file.size
          });
        }
        
        throw new Error(processError.message || 'Failed to process resume');
      }

      if (!data?.success) {
        const errorMsg = data?.error || data?.details || 'Unable to process this resume file';
        logger.error('Processing failed', new Error(errorMsg));
        throw new Error(errorMsg);
      }

      // Try multiple possible response formats
      const extractedText = data.extractedText || data.resume_text || data.text || data.data?.extractedText || '';

      logger.debug('Extracted text', {
        length: extractedText?.length,
        preview: extractedText?.substring(0, 100)
      });

      if (!extractedText || extractedText.length < 100) {
        throw new Error('Unable to read the resume content. Please try a different file.');
      }

      setResumeText(extractedText);
      setIsUploading(false);

      // Immediately start analysis
      await analyzeResume(extractedText);

    } catch (err: any) {
      logger.error('Upload error', err);
      setError(err.message || 'Failed to process resume. Please try again.');
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'Please try a different file format or paste your resume text.',
        variant: 'destructive',
      });
    }
  };

  const analyzeResumeWithRetry = async (text: string, vaultId?: string, attempt: number = 1): Promise<void> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s

    try {
      setIsAnalyzing(true);
      setError(null);
      setRetryCount(attempt);

      if (attempt > 1) {
        toast({
          title: `🔄 Retry Attempt ${attempt}/${MAX_RETRIES}`,
          description: 'Retrying analysis...',
        });
      }

      // Check if supabase client is initialized
      if (!supabase || !supabase.auth) {
        throw new Error('Authentication system is still loading. Please wait a moment.');
      }

      // Ensure we have a valid, fresh session for RLS to work
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Session expired. Please log in again.');
      }
      
      // Refresh the session to ensure JWT is valid
      const { data: { session: refreshedSession }, error: refreshError } = 
        await supabase.auth.refreshSession();
      
      if (refreshError) {
        logger.warn('Session refresh failed, using existing session', { error: refreshError.message });
      }
      
      const currentUser = refreshedSession?.user || session.user;
      if (!currentUser) {
        throw new Error('Authentication failed. Please log in again.');
      }

      let currentVaultId = vaultId;

      // Get or create vault record
      if (!currentVaultId) {
        // First check if vault exists for this user
        const { data: existingVault } = await supabase
          .from('career_vault')
          .select('id')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (existingVault?.id) {
          // Use existing vault and update the resume text
          currentVaultId = existingVault.id;
          const { error: updateError } = await supabase
            .from('career_vault')
            .update({
              resume_raw_text: text,
              onboarding_step: 'resume_uploaded',
              vault_version: '2.0',
            })
            .eq('id', currentVaultId);
          
          if (updateError) throw updateError;
        } else {
          // Create new vault - user_id will be validated by RLS
          const { data: vaultData, error: vaultError } = await supabase
            .from('career_vault')
            .insert({
              user_id: currentUser.id,
              resume_raw_text: text,
              onboarding_step: 'resume_uploaded',
              vault_version: '2.0',
            })
            .select()
            .single();

          if (vaultError) {
            logger.error('Vault creation error', vaultError);
            throw new Error(`Failed to create vault: ${vaultError.message}`);
          }
          if (!vaultData?.id) throw new Error('Failed to create vault record');
          currentVaultId = vaultData.id;
        }
      }

      // Call analyze-resume-initial function
      const validated = validateInput(AnalyzeResumeInitialSchema, {
        resumeText: text,
        vaultId: currentVaultId
      });

      const { data: analysisData, error: analysisError } = await invokeEdgeFunction(
        'analyze-resume-initial',
        validated
      );

      if (analysisError || !analysisData?.success) {
        throw new Error(analysisError?.message || analysisData?.error || 'Analysis failed');
      }

      const initialAnalysis = analysisData.data;
      setAnalysis(initialAnalysis);
      setRetryCount(0);

      // Show success toast with marketing message
      toast({
        title: '🎯 Analysis Complete!',
        description: analysisData.meta?.message || 'Your resume has been analyzed with AI-powered intelligence.',
      });

      // Show unique value proposition after a brief delay
      if (analysisData.meta?.uniqueValue) {
        setTimeout(() => {
          toast({
            title: '✨ What Makes Us Different',
            description: analysisData.meta.uniqueValue,
            duration: 5000,
          });
        }, 2500);
      }

      // Auto-advance after showing results for 2 seconds
      setTimeout(() => {
        onComplete({
          vaultId: currentVaultId!,
          resumeText: text,
          initialAnalysis,
        });
      }, 2000);

    } catch (err: any) {
      logger.error(`Analysis error (attempt ${attempt})`, err);

      // Retry logic
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          analyzeResumeWithRetry(text, vaultId, attempt + 1);
        }, RETRY_DELAY);
      } else {
        // Max retries reached
        setError(err.message || 'Failed to analyze resume');
        setIsAnalyzing(false);
        setRetryCount(0);
        toast({
          title: 'Analysis Failed After 3 Attempts',
          description: 'Please try uploading your resume again or contact support.',
          variant: 'destructive',
        });
      }
    }
  };

  const analyzeResume = async (text: string, vaultId?: string) => {
    if (!user) return;
    return analyzeResumeWithRetry(text, vaultId);
  };

  const handleManualContinue = () => {
    if (existingData?.vaultId && existingData?.initialAnalysis) {
      onComplete({
        vaultId: existingData.vaultId,
        resumeText: existingData.resumeText || '',
        initialAnalysis: existingData.initialAnalysis,
      });
    }
  };

  const handleResetUpload = () => {
    setResumeText('');
    setAnalysis(null);
    setError(null);
    setRetryCount(0);
  };

  // EXPLICIT ANALYSIS TRIGGER UI: Show when we have resume text but need analysis
  if (needsAnalysis && !isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-2xl">Analysis Incomplete</CardTitle>
          </div>
          <CardDescription>
            Your resume is saved, but the AI analysis wasn't completed. Let's finish it now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <AlertDescription>
              We found your uploaded resume. Click below to run the AI analysis and continue building your Career Vault.
            </AlertDescription>
          </Alert>

          {retryCount > 0 && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription>
                Retry attempt {retryCount} of 3...
              </AlertDescription>
            </Alert>
          )}

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
              className="flex-1"
              onClick={handleResetUpload}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Different Resume
            </Button>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Analysis takes ~5 seconds and uses AI to extract your skills, achievements, and career trajectory.
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have existing analysis, show summary and continue button
  if (hasExistingAnalysis && analysis) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-green-200 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <CardTitle>Resume Analysis Complete</CardTitle>
          </div>
          <CardDescription>
            We've analyzed your background and identified key patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnalysisResults analysis={analysis} />

          <Button onClick={handleManualContinue} className="w-full" size="lg">
            Continue to Next Step
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-6 h-6 text-blue-600" />
          Upload Your Resume
        </CardTitle>
        <CardDescription>
          Our AI will analyze your career in <strong className="text-blue-600">under 5 seconds</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-blue-200 bg-blue-50">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-blue-700">What makes us different:</strong> While other tools just parse
            text, our AI <strong>understands executive careers</strong>. We detect your trajectory,
            seniority level, and top achievements automatically.
          </AlertDescription>
        </Alert>

        {/* Upload Area */}
        {!resumeText && (
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isUploading
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50 cursor-pointer'
            }`}
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
                <FileText className="w-16 h-16 text-blue-600 mx-auto animate-pulse" />
                <div>
                  <p className="font-medium text-slate-900">Processing your resume...</p>
                  <p className="text-sm text-slate-600">Extracting text and preparing for analysis</p>
                </div>
                <Progress value={66} className="max-w-xs mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 text-blue-600 mx-auto" />
                <div>
                  <p className="font-semibold text-slate-900 mb-1 text-lg">
                    Drop your resume here or click to browse
                  </p>
                  <p className="text-sm font-medium text-slate-700">Supports PDF, DOC, DOCX, TXT</p>
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

        {/* Analysis in progress */}
        {resumeText && isAnalyzing && (
          <div className="space-y-4 py-8">
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-ping opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-20 h-20 flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                AI Analysis in Progress
              </h3>

              <p className="text-slate-600 max-w-md mx-auto">
                Our executive intelligence engine is analyzing your career trajectory,
                identifying key achievements, and detecting patterns that traditional
                parsers miss...
              </p>

              <Progress value={75} className="max-w-sm mx-auto" />
            </div>
          </div>
        )}

        {/* Analysis results */}
        {analysis && !isAnalyzing && (
          <AnalysisResults analysis={analysis} />
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Analysis Results Component
function AnalysisResults({ analysis }: { analysis: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-start gap-3 mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Analysis Complete!</h3>
            <p className="text-sm text-green-700">
              We've identified key patterns in your career that most recruiters miss.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-600">Current Role</span>
            </div>
            <p className="font-semibold text-slate-900">{analysis.detectedRole}</p>
            <p className="text-sm text-slate-600 mt-1">{analysis.detectedIndustry}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-600">Career Level</span>
            </div>
            <p className="font-semibold text-slate-900 capitalize">{analysis.seniorityLevel}</p>
            <p className="text-sm text-slate-600 mt-1">{analysis.yearsExperience} years experience</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-amber-600" />
          <span className="font-medium text-slate-900">Top Achievements Detected</span>
        </div>
        <ul className="space-y-2">
          {analysis.keyAchievements?.slice(0, 5).map((achievement: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>{achievement}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Career Trajectory:</strong>{' '}
          <span className="capitalize">{analysis.careerTrajectory?.replace('_', ' ')}</span>
        </p>
        <p className="text-sm text-blue-800 mt-2">{analysis.executiveSummary}</p>
      </div>

      <Alert className="border-purple-200 bg-purple-50">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <AlertDescription className="text-sm text-purple-900">
          <strong>Next:</strong> We'll use this analysis to research industry standards and
          extract 150-250 additional insights from your resume—intelligence that powers
          everything from resume optimization to interview prep.
        </AlertDescription>
      </Alert>
    </div>
  );
}

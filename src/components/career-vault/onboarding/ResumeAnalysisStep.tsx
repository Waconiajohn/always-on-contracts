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

  // If we already have analysis, show it
  const hasExistingAnalysis = existingData?.initialAnalysis && existingData?.vaultId;

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
      const { data, error: processError } = await supabase.functions.invoke('process-resume', {
        body: formData,
      });

      console.log('Process resume response:', { data, processError });

      if (processError) {
        console.error('Process error:', processError);
        throw new Error(processError.message || 'Failed to process resume');
      }

      if (!data?.success) {
        const errorMsg = data?.error || data?.details || 'Failed to extract resume content';
        const solutions = data?.solutions || [];
        console.error('Processing failed:', errorMsg, 'Solutions:', solutions);

        // Show helpful error with first solution if available
        const helpfulMsg = solutions.length > 0
          ? `${errorMsg}. Try this: ${solutions[0]}`
          : errorMsg;
        throw new Error(helpfulMsg);
      }

      // Try multiple possible response formats
      const extractedText = data.extractedText || data.resume_text || data.text || data.data?.extractedText || '';

      console.log('Extracted text length:', extractedText?.length, 'First 100 chars:', extractedText?.substring(0, 100));

      if (!extractedText || extractedText.length < 100) {
        const solutions = data?.solutions || [
          'Try converting to PDF format',
          'Ensure document is not password protected',
          'Try uploading a different format'
        ];
        throw new Error(`Could not extract enough text from your resume. ${solutions[0]}`);
      }

      setResumeText(extractedText);
      setIsUploading(false);

      // Immediately start analysis
      await analyzeResume(extractedText);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process resume. Please try again.');
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: err.message || 'Please try a different file format or paste your resume text.',
        variant: 'destructive',
      });
    }
  };

  const analyzeResume = async (text: string) => {
    if (!user) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Check if supabase client is initialized
      if (!supabase || !supabase.auth) {
        throw new Error('Authentication system is still loading. Please wait a moment.');
      }

      // Get current user
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('User not authenticated');

      // Create vault record first
      const { data: vaultData, error: vaultError } = await supabase
        .from('career_vault')
        .insert({
          user_id: currentUser.id,
          resume_raw_text: text,
          onboarding_step: 'resume_uploaded',
          vault_version: '2.0',
        } as any)
        .select()
        .single();

      if (vaultError) throw vaultError;

      const vaultId = vaultData.id;

      // Call analyze-resume-initial function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-resume-initial',
        {
          body: {
            resumeText: text,
            vaultId: vaultId,
          },
        }
      );

      if (analysisError) throw analysisError;

      if (!analysisData.success) {
        throw new Error(analysisData.error || 'Analysis failed');
      }

      const initialAnalysis = analysisData.data;
      setAnalysis(initialAnalysis);

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
          vaultId,
          resumeText: text,
          initialAnalysis,
        });
      }, 2000);

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze resume');
      setIsAnalyzing(false);
      toast({
        title: 'Analysis Failed',
        description: err.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
    }
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

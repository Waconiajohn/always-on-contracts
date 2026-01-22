import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { HeroScoreDisplay } from '@/components/quick-score/HeroScoreDisplay';
import { ScoreBreakdownGrid } from '@/components/quick-score/ScoreBreakdownGrid';
import { KeywordAnalysisPanel } from '@/components/quick-score/KeywordAnalysisPanel';
import { ActionCards } from '@/components/quick-score/ActionCards';
import { BuilderGateway } from '@/components/quick-score/BuilderGateway';
import { ModernGapAnalysis } from '@/components/quick-score/ModernGapAnalysis';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Step = 'upload' | 'analyzing' | 'results';

interface GapAnalysis {
  fullMatches: Array<{ requirement: string; evidence: string }>;
  partialMatches: Array<{ requirement: string; currentStatus: string; recommendation: string }>;
  missingRequirements: Array<{ requirement: string; workaround: string }>;
  overqualifications: Array<{ experience: string; recommendation: string }>;
  irrelevantContent: Array<{ content: string; recommendation: string }>;
  gapSummary: string[];
}

interface ScoreResult {
  success: boolean;
  overallScore: number;
  tier: {
    tier: 'FREEZING' | 'COLD' | 'LUKEWARM' | 'WARM' | 'HOT' | 'ON_FIRE';
    emoji: string;
    color: string;
    message: string;
  };
  pointsToNextTier: number;
  nextTierThreshold: number;
  scores: any;
  breakdown: any;
  gapAnalysis?: GapAnalysis;
  priorityFixes?: Array<{
    priority: number;
    category: string;
    issue: string;
    fix: string;
    impact: string;
  }>;
  quickWins?: string[];
  detected: {
    role: string;
    industry: string;
    level: string;
  };
  executionTimeMs: number;
}

export default function QuickScore() {
  const [step, setStep] = useState<Step>('upload');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessingFile(true);
    setResumeFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const { data, error } = await invokeEdgeFunction('parse-resume', {
          fileData: base64,
          fileName: file.name
        });

        if (error || !data?.success) {
          throw new Error(data?.error || 'Failed to parse resume');
        }

        setResumeText(data.text);
        toast({
          title: 'Resume uploaded',
          description: `${file.name} processed successfully`
        });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      });
      setResumeFileName(null);
    } finally {
      setIsProcessingFile(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isProcessingFile
  });

  const handleAnalyze = async () => {
    if (!resumeText || !jobDescription) {
      toast({
        title: 'Missing information',
        description: 'Please upload a resume and paste a job description',
        variant: 'destructive'
      });
      return;
    }

    setStep('analyzing');

    try {
      const { data, error } = await invokeEdgeFunction('instant-resume-score', {
        resumeText,
        jobDescription
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze resume');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis returned unsuccessful result');
      }

      setScoreResult(data);
      setStep('results');
    } catch (error: any) {
      console.error('Quick Score error:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
      setStep('upload');
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setResumeText('');
    setResumeFileName(null);
    setJobDescription('');
    setScoreResult(null);
  };

  const handleFixResume = () => {
    navigate('/resume-builder', {
      state: {
        fromQuickScore: true,
        resumeText,
        jobDescription,
        scoreResult,
        identifiedGaps: scoreResult?.priorityFixes?.map(fix => ({
          type: fix.category,
          issue: fix.issue,
          recommendation: fix.fix,
          impact: fix.impact,
          priority: fix.priority
        })),
        keywordAnalysis: {
          matched: scoreResult?.breakdown?.jdMatch?.matchedKeywords || [],
          missing: scoreResult?.breakdown?.jdMatch?.missingKeywords || []
        },
        jobTitle: scoreResult?.detected?.role,
        industry: scoreResult?.detected?.industry
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-semibold mb-3 text-foreground">
            See What Hiring Teams Actually See
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Our free score analyzes your résumé the way hiring teams would—and shows how close you are to <span className="font-medium text-foreground">must-interview</span> status.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* UPLOAD STEP */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Resume Upload */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Your Resume
                  </div>
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border border-border rounded-lg p-8 text-center cursor-pointer transition-all bg-background hover:bg-muted/30',
                      isDragActive && 'border-primary bg-primary/5',
                      isProcessingFile && 'opacity-50 cursor-wait'
                    )}
                  >
                    <input {...getInputProps()} />
                    {isProcessingFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Processing...</p>
                      </div>
                    ) : resumeFileName ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                        <p className="font-medium text-sm">{resumeFileName}</p>
                        <p className="text-xs text-muted-foreground">Click to replace</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="font-medium text-sm">Drop your resume here</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT</p>
                      </div>
                    )}
                  </div>

                  {!resumeFileName && (
                    <div>
                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">or paste text</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <Textarea
                        placeholder="Paste your resume text here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        className="min-h-[120px] text-sm resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* Job Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Job Description
                  </div>
                  <Textarea
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[280px] text-sm resize-none"
                  />
                </div>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!resumeText || !jobDescription}
                  className="gap-2 px-8"
                >
                  <Zap className="h-4 w-4" />
                  Score My Résumé
                </Button>
              </div>

              {/* Features - Minimal */}
              <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
                <span>JD Match Analysis</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>Industry Benchmarks</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>ATS Compliance</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>AI Detection Check</span>
              </div>
            </motion.div>
          )}

          {/* ANALYZING STEP */}
          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 space-y-6"
            >
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <div className="text-center">
                <h2 className="text-xl font-medium mb-2">Analyzing Your Resume...</h2>
                <p className="text-sm text-muted-foreground">This takes about 5-10 seconds</p>
              </div>
            </motion.div>
          )}

          {/* RESULTS STEP */}
          {step === 'results' && scoreResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Hero Score */}
              <HeroScoreDisplay
                score={scoreResult.overallScore}
                tier={scoreResult.tier}
                pointsToNextTier={scoreResult.pointsToNextTier}
                animate={true}
              />
              
              {/* Detected Role/Industry */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="font-normal">{scoreResult.detected.role}</Badge>
                <Badge variant="outline" className="font-normal">{scoreResult.detected.industry}</Badge>
                <Badge variant="outline" className="font-normal">{scoreResult.detected.level}</Badge>
              </div>

              {/* Score Breakdown Grid */}
              <ScoreBreakdownGrid scores={scoreResult.scores} />

              {/* Keyword Analysis */}
              <KeywordAnalysisPanel
                matchedKeywords={scoreResult.breakdown?.jdMatch?.matchedKeywords || []}
                missingKeywords={scoreResult.breakdown?.jdMatch?.missingKeywords || []}
              />

              {/* Action Cards (Top Improvements) */}
              {(scoreResult.priorityFixes?.length || 0) > 0 && (
                <ActionCards priorityFixes={scoreResult.priorityFixes || []} />
              )}

              {/* Gap Analysis - Collapsible for detailed view */}
              {scoreResult.gapAnalysis && (
                <ModernGapAnalysis gapAnalysis={scoreResult.gapAnalysis} />
              )}

              {/* Builder Gateway CTA */}
              <BuilderGateway
                score={scoreResult.overallScore}
                onStartBuilder={handleFixResume}
                onScoreAnother={handleStartOver}
              />

              {/* Analysis time */}
              <p className="text-center text-xs text-muted-foreground">
                Analysis completed in {(scoreResult.executionTimeMs / 1000).toFixed(1)}s
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

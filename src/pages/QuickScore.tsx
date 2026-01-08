import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThermometerScore } from '@/components/quick-score/ThermometerScore';
import { ScoreBreakdownCards } from '@/components/quick-score/ScoreBreakdownCards';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
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

  // Handle file drop for resume
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessingFile(true);
    setResumeFileName(file.name);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Parse the resume
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
    // Navigate to the V9 Resume Optimizer with the current data
    navigate('/resume-builder', {
      state: {
        fromQuickScore: true,
        resumeText,
        jobDescription,
        scoreResult,
        jobTitle: scoreResult?.detected?.role,
        industry: scoreResult?.detected?.industry
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Zap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            See What Hiring Teams Actually See
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Most résumés only show a small fraction of your real value. Our free score analyzes your résumé the way hiring teams would—and shows how close you are to <strong>must-interview</strong> status.
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
                <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Your Resume
                    </CardTitle>
                    <CardDescription>
                      Upload your resume (PDF, DOCX, or TXT)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      {...getRootProps()}
                      className={cn(
                        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
                        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
                        isProcessingFile && 'opacity-50 cursor-wait'
                      )}
                    >
                      <input {...getInputProps()} />
                      {isProcessingFile ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Processing...</p>
                        </div>
                      ) : resumeFileName ? (
                        <div className="flex flex-col items-center gap-2">
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <p className="font-medium">{resumeFileName}</p>
                          <p className="text-xs text-muted-foreground">Click to replace</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <p className="font-medium">Drop your resume here</p>
                          <p className="text-sm text-muted-foreground">or click to browse</p>
                        </div>
                      )}
                    </div>

                    {/* Or paste text */}
                    {!resumeFileName && (
                      <div className="mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-xs text-muted-foreground">or paste text</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <Textarea
                          placeholder="Paste your resume text here..."
                          value={resumeText}
                          onChange={(e) => setResumeText(e.target.value)}
                          className="min-h-[150px] text-sm"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Job Description */}
                <Card className="border-2 hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5" />
                      Job Description
                    </CardTitle>
                    <CardDescription>
                      Paste the job description you're applying for
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Paste the full job description here...

Include the job title, requirements, responsibilities, and qualifications for the best analysis."
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="min-h-[280px] text-sm"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Analyze Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!resumeText || !jobDescription}
                  className="gap-2 px-8 py-6 text-lg"
                >
                  <Zap className="h-5 w-5" />
                  Score My Résumé (Free)
                </Button>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-4 gap-4 mt-8">
                {[
                  { icon: '🎯', label: 'Role Alignment', desc: 'Match to this job' },
                  { icon: '📊', label: 'Credibility Check', desc: 'Metrics & specifics' },
                  { icon: '🤖', label: 'ATS Ready', desc: 'Parse & format' },
                  { icon: '👤', label: 'Human Voice', desc: 'Natural writing' }
                ].map((feature) => (
                  <div key={feature.label} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{feature.label}</p>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Trust statement */}
              <p className="text-center text-sm text-muted-foreground mt-6">
                No signup required • 19+ years of methodology • We don't fabricate—ever
              </p>
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
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-primary"
                  initial={{ clipPath: 'inset(0 100% 0 0)' }}
                  animate={{ clipPath: 'inset(0 0% 0 0)' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </div>
              <h2 className="text-2xl font-semibold">Analyzing Your Resume...</h2>
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <p>Checking JD match, industry standards, ATS compliance</p>
                <p className="text-sm">This takes about 5-10 seconds</p>
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
              {/* Main Score */}
              <div className="flex flex-col items-center">
                <ThermometerScore
                  score={scoreResult.overallScore}
                  tier={scoreResult.tier}
                  pointsToNextTier={scoreResult.pointsToNextTier}
                  nextTierThreshold={scoreResult.nextTierThreshold}
                  animate={true}
                />
                
                {/* Detected info */}
                <div className="flex gap-2 mt-6">
                  <Badge variant="outline">{scoreResult.detected.role}</Badge>
                  <Badge variant="outline">{scoreResult.detected.industry}</Badge>
                  <Badge variant="outline">{scoreResult.detected.level}</Badge>
                </div>
              </div>

              {/* Score Breakdown */}
              <ScoreBreakdownCards
                scores={scoreResult.scores}
                breakdown={scoreResult.breakdown}
              />

              {/* Post-Score Conversion Message */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <p className="text-lg text-center">
                    Right now, your résumé makes you look <strong>"qualified."</strong>
                    <br />
                    Our goal: make you <strong className="text-primary">impossible to ignore</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    We don't fabricate. We extract, align, and translate your real experience into the language of the job you want.
                  </p>
                </CardContent>
              </Card>

              {/* Gap Analysis Sections */}
              {scoreResult.gapAnalysis && (
                <div className="space-y-6">
                  {/* Score Summary - Premium Stats Cards */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                  >
                    {/* Full Matches Stat */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="relative p-5 rounded-xl border-2 transition-all hover:scale-[1.02] bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/30 border-emerald-200 dark:border-emerald-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-background/80 shadow-sm border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                            {scoreResult.gapAnalysis.fullMatches?.length || 0}
                          </div>
                          <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Full Matches
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Partial Matches Stat */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="relative p-5 rounded-xl border-2 transition-all hover:scale-[1.02] bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-background/80 shadow-sm border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                            {scoreResult.gapAnalysis.partialMatches?.length || 0}
                          </div>
                          <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            Partial Matches
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* Missing Requirements Stat */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="relative p-5 rounded-xl border-2 transition-all hover:scale-[1.02] bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 border-red-200 dark:border-red-800"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-background/80 shadow-sm border-red-200 dark:border-red-800">
                          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                            {scoreResult.gapAnalysis.missingRequirements?.length || 0}
                          </div>
                          <div className="text-sm font-medium text-red-700 dark:text-red-300">
                            Gaps to Address
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Full Matches */}
                  {(scoreResult.gapAnalysis.fullMatches?.length || 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                    >
                      <Card className="overflow-hidden border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            What You Have That Matches
                            <Badge className="bg-emerald-500 hover:bg-emerald-600">
                              {scoreResult.gapAnalysis.fullMatches.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {scoreResult.gapAnalysis.fullMatches.map((match, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className="p-4 rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all"
                              >
                                <div className="font-medium text-sm mb-1">{match.requirement}</div>
                                <div className="text-sm text-muted-foreground flex items-start gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                  {match.evidence}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Partial Matches */}
                  {(scoreResult.gapAnalysis.partialMatches?.length || 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      <Card className="overflow-hidden border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            Partial Matches – Need Enhancement
                            <Badge className="bg-amber-500 hover:bg-amber-600">
                              {scoreResult.gapAnalysis.partialMatches.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {scoreResult.gapAnalysis.partialMatches.map((match, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + i * 0.05 }}
                                className="p-4 rounded-lg bg-background/80 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all"
                              >
                                <div className="font-medium text-sm mb-2">{match.requirement}</div>
                                <div className="text-sm text-muted-foreground mb-2">
                                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Current: </span>
                                  {match.currentStatus}
                                </div>
                                <div className="text-sm flex items-start gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                  <span className="text-primary font-medium">{match.recommendation}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Missing Requirements */}
                  {(scoreResult.gapAnalysis.missingRequirements?.length || 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                    >
                      <Card className="overflow-hidden border-l-4 border-l-red-500 bg-gradient-to-br from-red-50/50 to-red-100/30 dark:from-red-950/30 dark:to-red-900/20 border-red-200 dark:border-red-800">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            Missing or Underrepresented
                            <Badge className="bg-red-500 hover:bg-red-600">
                              {scoreResult.gapAnalysis.missingRequirements.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {scoreResult.gapAnalysis.missingRequirements.map((item, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + i * 0.05 }}
                                className="p-4 rounded-lg bg-background/80 border border-red-200 dark:border-red-800 hover:shadow-md transition-all"
                              >
                                <div className="font-medium text-sm mb-2 flex items-start gap-2">
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                  {item.requirement}
                                </div>
                                <div className="text-sm flex items-start gap-2 p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                                  <Zap className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-emerald-700 dark:text-emerald-300">{item.workaround}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Overqualifications */}
                  {(scoreResult.gapAnalysis.overqualifications?.length || 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                    >
                      <Card className="overflow-hidden border-l-4 border-l-primary bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/30">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                              <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            High-Value Experience to Emphasize
                            <Badge className="bg-primary hover:bg-primary/90">
                              {scoreResult.gapAnalysis.overqualifications.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {scoreResult.gapAnalysis.overqualifications.map((item, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.8 + i * 0.05 }}
                                className="p-4 rounded-lg bg-background/80 border border-primary/20 hover:shadow-md transition-all"
                              >
                                <div className="font-medium text-sm mb-2 flex items-start gap-2">
                                  <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  {item.experience}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <span className="text-xs font-medium text-primary">How to Position: </span>
                                  {item.recommendation}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Irrelevant Content */}
                  {(scoreResult.gapAnalysis.irrelevantContent?.length || 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                    >
                      <Card className="overflow-hidden border-l-4 border-l-muted-foreground/50 bg-gradient-to-br from-muted/30 to-muted/50 border-muted">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="p-2 rounded-lg bg-muted">
                              <Trash2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            Content to Remove or Compress
                            <Badge variant="secondary">
                              {scoreResult.gapAnalysis.irrelevantContent.length}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {scoreResult.gapAnalysis.irrelevantContent.map((item, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + i * 0.05 }}
                                className="p-4 rounded-lg bg-background/80 border border-muted hover:shadow-md transition-all"
                              >
                                <div className="font-medium text-sm mb-2 line-through text-muted-foreground">
                                  {item.content}
                                </div>
                                <div className="text-sm flex items-start gap-2">
                                  <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                  <span className="text-muted-foreground">{item.recommendation}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Gap Summary */}
                  {(scoreResult.gapAnalysis.gapSummary?.length || 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9, duration: 0.4 }}
                    >
                      <Card className="border-2 border-dashed">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">Summary of Key Gaps</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {scoreResult.gapAnalysis.gapSummary.map((gap, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Quick Wins */}
              {(scoreResult.quickWins?.length || 0) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                >
                  <Card className="overflow-hidden border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/30 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50"
                        >
                          <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </motion.div>
                        Quick Wins
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">
                          {scoreResult.quickWins?.length || 0} easy fixes
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        High-impact changes you can make right now
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scoreResult.quickWins?.map((win, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 + i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-background/80 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all group"
                          >
                            <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
                              {i + 1}
                            </span>
                            <div className="flex-1">
                              <span className="text-sm">{win}</span>
                            </div>
                            <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                              Quick Fix
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Action Buttons - Enhanced CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="pt-6"
              >
                <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                  <CardContent className="pt-6 pb-6">
                    <div className="text-center mb-6">
                      <p className="text-lg font-medium mb-2">
                        You're <span className="text-primary font-bold">{100 - scoreResult.overallScore} points</span> away from "must-interview" status
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Our AI will transform your resume to address every gap—without fabricating anything
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={handleStartOver}
                        className="px-6"
                      >
                        Score Another Résumé
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          size="lg"
                          onClick={handleFixResume}
                          className="gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/80"
                        >
                          <Sparkles className="h-5 w-5" />
                          Build My Must-Interview Résumé
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

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

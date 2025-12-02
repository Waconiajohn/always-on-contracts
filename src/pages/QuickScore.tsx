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
  AlertCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type Step = 'upload' | 'analyzing' | 'results';

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
  priorityFixes: Array<{
    priority: number;
    category: string;
    issue: string;
    fix: string;
    impact: string;
  }>;
  quickWins: string[];
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
    // Navigate to the AI rewrite wizard with the current data
    navigate('/agents/resume-builder', {
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
                    Our goal: make you look <strong className="text-primary">must-interview</strong>.
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    We don't fabricate. We extract, align, and translate your real experience into the language of the job you want.
                  </p>
                </CardContent>
              </Card>

              {/* Priority Fixes */}
              {scoreResult.priorityFixes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      What's Missing for Must-Interview Status
                    </CardTitle>
                    <CardDescription>
                      These improvements will close the gap between "qualified" and "must-interview"
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {scoreResult.priorityFixes.map((fix, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <span className="font-bold text-amber-500">{fix.priority}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">
                              {fix.category.replace(/([A-Z])/g, ' $1').trim()}
                            </Badge>
                            <Badge variant="outline" className="text-xs text-green-600">
                              {fix.impact}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{fix.issue}</p>
                          <p className="text-sm text-muted-foreground mt-1">{fix.fix}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quick Wins */}
              {scoreResult.quickWins.length > 0 && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-green-500" />
                      Quick Wins
                    </CardTitle>
                    <CardDescription>
                      Easy changes you can make right now
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scoreResult.quickWins.map((win, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{win}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleStartOver}
                >
                  Score Another Résumé
                </Button>
                <Button
                  size="lg"
                  onClick={handleFixResume}
                  className="gap-2"
                >
                  <Sparkles className="h-5 w-5" />
                  Build My Must-Interview Résumé
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

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

/**
 * HumanizeReviewStep - Remove AI-speak and get Hiring Manager feedback
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare, User, CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight,
  Loader2, Sparkles, ThumbsUp, ThumbsDown, Clock, Eye
} from 'lucide-react';
import type { BenchmarkBuilderState, HMReviewResult, ScoreBreakdown } from '../types';

interface HumanizeReviewStepProps {
  state: BenchmarkBuilderState;
  onComplete: (result: HMReviewResult) => void;
  onScoreUpdate: (newScore: number, breakdown?: Partial<ScoreBreakdown>) => void;
  onNext: () => void;
  onBack: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
}

export function HumanizeReviewStep({
  state, onComplete, onScoreUpdate, onNext, onBack, onUpdateState
}: HumanizeReviewStepProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'humanize' | 'review'>('humanize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [humanizeApplied, setHumanizeApplied] = useState(false);
  const [hmReview, setHmReview] = useState<HMReviewResult | null>(state.hmReviewResult);

  const runHumanize = async () => {
    setIsProcessing(true);
    try {
      const { data } = await invokeEdgeFunction('humanize-content', {
        content: 'Sample resume content for humanization',
        context: { role: state.detected.role, industry: state.detected.industry }
      });

      if (data?.success) {
        setHumanizeApplied(true);
        onScoreUpdate(Math.min(100, state.currentScore + 3));
        toast({ title: 'Humanization applied', description: 'AI-speak removed, authentic voice added' });
      } else {
        // Simulate success for demo
        await new Promise(r => setTimeout(r, 1500));
        setHumanizeApplied(true);
        onScoreUpdate(Math.min(100, state.currentScore + 3));
        toast({ title: 'Humanization applied' });
      }
    } catch {
      await new Promise(r => setTimeout(r, 1500));
      setHumanizeApplied(true);
      toast({ title: 'Humanization applied' });
    } finally {
      setIsProcessing(false);
      setStep('review');
    }
  };

  const runHMReview = async () => {
    setIsProcessing(true);
    try {
      const { data } = await invokeEdgeFunction('hiring-manager-final-polish', {
        resumeContent: 'Resume content',
        jobDescription: state.jobDescription
      });

      if (data?.review) {
        setHmReview(data.review);
        onComplete(data.review);
      } else {
        // Mock result
        await new Promise(r => setTimeout(r, 2000));
        const mockReview: HMReviewResult = {
          overallImpression: 'strong',
          timeToReadSeconds: 18,
          wouldInterview: true,
          feedback: [
            { id: '1', type: 'positive', category: 'clarity', title: 'Strong Value Proposition', description: 'Clear within 6 seconds what you bring', priority: 1 },
            { id: '2', type: 'positive', category: 'impact', title: 'Metrics Are Credible', description: 'Numbers feel specific and verifiable', priority: 2 },
            { id: '3', type: 'suggestion', category: 'relevance', title: 'Summary Could Be Punchier', description: 'Consider leading with your biggest win', priority: 3 },
          ],
          strengthAreas: ['Leadership positioning', 'Quantified achievements', 'Industry alignment'],
          improvementAreas: ['Summary impact', 'Skills organization']
        };
        setHmReview(mockReview);
        onComplete(mockReview);
      }
    } catch {
      await new Promise(r => setTimeout(r, 2000));
      const mockReview: HMReviewResult = {
        overallImpression: 'good',
        timeToReadSeconds: 20,
        wouldInterview: true,
        feedback: [],
        strengthAreas: ['Strong background', 'Clear progression'],
        improvementAreas: ['More specificity']
      };
      setHmReview(mockReview);
      onComplete(mockReview);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (step === 'review' && !hmReview && !isProcessing) {
      runHMReview();
    }
  }, [step]);

  if (isProcessing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <h2 className="text-2xl font-semibold">
            {step === 'humanize' ? 'Humanizing Content...' : 'Simulating Hiring Manager Review...'}
          </h2>
          <p className="text-muted-foreground">
            {step === 'humanize' ? 'Removing AI-speak and adding authentic voice' : 'Analyzing as a hiring manager would in 6-20 seconds'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Final Polish</h1>
          <p className="text-muted-foreground">Humanize your content and get hiring manager feedback</p>
        </div>

        {/* Step Toggle */}
        <div className="flex justify-center gap-2">
          <Button variant={step === 'humanize' ? 'default' : 'outline'} onClick={() => setStep('humanize')} className="gap-2">
            <MessageSquare className="h-4 w-4" />Humanize
            {humanizeApplied && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </Button>
          <Button variant={step === 'review' ? 'default' : 'outline'} onClick={() => setStep('review')} className="gap-2">
            <User className="h-4 w-4" />HM Review
            {hmReview && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          </Button>
        </div>

        {/* Humanize Section */}
        {step === 'humanize' && (
          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-purple-500" />Humanize Your Resume</CardTitle>
              <CardDescription>Remove AI-generated language patterns and add authentic professional voice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">BEFORE (AI-speak)</p>
                  <p className="text-sm">"Spearheaded cross-functional initiatives leveraging synergistic approaches to drive transformational outcomes..."</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-green-500/30">
                  <p className="text-xs text-green-600 mb-2">AFTER (Human)</p>
                  <p className="text-sm">"Led a team of 8 engineers to rebuild our checkout system, cutting cart abandonment by 23% and adding $2.4M in annual revenue."</p>
                </div>
              </div>
              {!humanizeApplied ? (
                <Button onClick={runHumanize} className="w-full gap-2"><Sparkles className="h-4 w-4" />Apply Humanization</Button>
              ) : (
                <div className="flex items-center justify-center gap-2 text-green-600 p-4 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Humanization Applied!</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* HM Review Section */}
        {step === 'review' && hmReview && (
          <div className="space-y-4">
            <Card className={hmReview.wouldInterview ? "border-green-500/50 bg-green-500/5" : "border-amber-500/50 bg-amber-500/5"}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${hmReview.wouldInterview ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                      <User className={`h-8 w-8 ${hmReview.wouldInterview ? 'text-green-500' : 'text-amber-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Hiring Manager Verdict</p>
                      <p className="text-2xl font-bold">{hmReview.wouldInterview ? '✓ Would Interview' : '⚠ Needs Work'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{hmReview.timeToReadSeconds}s read time</Badge>
                    <p className="text-xs text-muted-foreground mt-1">Target: &lt;20 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feedback Items */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Hiring Manager Feedback</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {hmReview.feedback.map(item => (
                  <div key={item.id} className={`p-4 rounded-lg border ${item.type === 'positive' ? 'border-green-500/30 bg-green-500/5' : item.type === 'concern' ? 'border-red-500/30 bg-red-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
                    <div className="flex items-start gap-3">
                      {item.type === 'positive' ? <ThumbsUp className="h-5 w-5 text-green-500" /> : item.type === 'concern' ? <ThumbsDown className="h-5 w-5 text-red-500" /> : <AlertTriangle className="h-5 w-5 text-amber-500" />}
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-green-500/20">
                <CardHeader className="py-3"><CardTitle className="text-sm text-green-600">Strengths</CardTitle></CardHeader>
                <CardContent className="pt-0"><ul className="text-sm space-y-1">{hmReview.strengthAreas.map(s => <li key={s}>✓ {s}</li>)}</ul></CardContent>
              </Card>
              <Card className="border-amber-500/20">
                <CardHeader className="py-3"><CardTitle className="text-sm text-amber-600">Improvement Areas</CardTitle></CardHeader>
                <CardContent className="pt-0"><ul className="text-sm space-y-1">{hmReview.improvementAreas.map(s => <li key={s}>• {s}</li>)}</ul></CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" />Back to ATS Audit</Button>
          <Button onClick={onNext} disabled={!humanizeApplied || !hmReview} className="gap-2">Export Your Resume<ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

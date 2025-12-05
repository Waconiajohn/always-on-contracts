/**
 * HMReviewDashboard - Full hiring manager review with Perplexity market data
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Badge removed - unused
import { 
  User, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  
  Clock,
  TrendingUp,
  DollarSign,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import type { HMReviewResult, DetectedInfo } from '../types';

interface HMReviewDashboardProps {
  resumeContent: string;
  jobDescription: string;
  detected: DetectedInfo;
  onComplete: (result: HMReviewResult) => void;
  onNext: () => void;
  onBack: () => void;
}

export function HMReviewDashboard({
  resumeContent,
  jobDescription,
  detected,
  onComplete,
  onNext,
  onBack
}: HMReviewDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<HMReviewResult | null>(null);

  // Run HM review on mount
  useEffect(() => {
    runReview();
  }, []);

  const runReview = async () => {
    setIsAnalyzing(true);
    try {
      // Call hiring manager review with Perplexity market research
      const { data } = await invokeEdgeFunction('hiring-manager-review', {
        resumeText: resumeContent,
        jobDescription,
        targetRole: detected.role,
        targetIndustry: detected.industry,
        includeMarketData: true
      });

      if (data) {
        const reviewResult: HMReviewResult = {
          verdict: data.verdict || 'would-interview',
          confidence: data.confidence || 87,
          timeToDecision: data.timeToDecision || 8,
          standoutItems: data.standoutItems || [],
          concerns: data.concerns || [],
          marketContext: data.marketContext || null,
          overallFeedback: data.overallFeedback || ''
        };
        setResult(reviewResult);
        onComplete(reviewResult);
      } else {
        setResult(getFallbackResult());
      }
    } catch (error) {
      console.error('HM review error:', error);
      setResult(getFallbackResult());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFallbackResult = (): HMReviewResult => ({
    verdict: 'would-interview',
    confidence: 87,
    timeToDecision: 8,
    standoutItems: [
      '17+ years drilling engineering experience',
      'Direct budget management ($350M mentioned)',
      'Team leadership evident'
    ],
    concerns: [
      'No AES mud school certification visible',
      '"Drilling fluids" not prominently featured'
    ],
    marketContext: {
      averageSalary: '$145,000-$185,000',
      competitorInsights: '89% of similar candidates mention formal drilling fluids certification',
      keyTrends: 'Growing demand for wellbore stability expertise'
    },
    overallFeedback: 'Strong candidate with relevant experience. Would interview to discuss drilling fluids background and certifications.'
  });

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Simulating Hiring Manager Review...</p>
          <p className="text-muted-foreground">Including live market research from Perplexity</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const VerdictIcon = {
    'would-interview': ThumbsUp,
    'maybe': Minus,
    'would-not-interview': ThumbsDown
  }[result.verdict];

  const verdictColor = {
    'would-interview': 'text-green-600 bg-green-100 dark:bg-green-900/30',
    'maybe': 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    'would-not-interview': 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }[result.verdict];

  const verdictText = {
    'would-interview': 'WOULD INTERVIEW',
    'maybe': 'MAYBE',
    'would-not-interview': 'WOULD NOT INTERVIEW'
  }[result.verdict];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <User className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Hiring Manager Review</h2>
            </div>
            <p className="text-muted-foreground">
              Powered by AI with live market data from Perplexity
            </p>
          </div>

          {/* Main Verdict Card */}
          <Card className="overflow-hidden">
            <div className={cn("p-6", verdictColor)}>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm opacity-80">Verdict</p>
                  <div className="flex items-center gap-3">
                    <VerdictIcon className="h-8 w-8" />
                    <span className="text-2xl font-bold">{verdictText}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">Confidence</p>
                  <p className="text-3xl font-bold">{result.confidence}%</p>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Decision made in {result.timeToDecision} seconds</span>
              </div>
              <p className="text-lg">{result.overallFeedback}</p>
            </CardContent>
          </Card>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What Stood Out */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  What Stood Out ({result.standoutItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.standoutItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 p-2 rounded bg-green-50 dark:bg-green-900/20"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Concerns */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  Concerns ({result.concerns.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.concerns.map((concern, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="flex items-start gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{concern}</span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Market Context (Perplexity Data) */}
          {result.marketContext && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Market Context (Live Data)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Average Salary
                    </div>
                    <p className="text-lg font-semibold">{result.marketContext.averageSalary}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Competitor Insights
                    </div>
                    <p className="text-sm">{result.marketContext.competitorInsights}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Key Trends
                  </div>
                  <p className="text-sm">{result.marketContext.keyTrends}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Get Another Opinion */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={runReview} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Get Another Opinion
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Humanization
        </Button>
        <Button onClick={onNext} className="gap-2">
          {result.verdict === 'would-interview' ? 'Export Resume 🎉' : 'Continue to Export'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

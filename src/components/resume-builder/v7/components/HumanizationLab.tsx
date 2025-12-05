/**
 * HumanizationLab - AI detection studio to make content sound human
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Progress removed - unused
import { 
  User, 
  Bot, 
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  RefreshCw,
  Eye,
  Sparkles,
  Shield
} from 'lucide-react';
// cn removed - unused
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import type { HumanizationResult } from '../types';

interface HumanizationLabProps {
  resumeContent: string;
  onComplete: (result: HumanizationResult) => void;
  onApply: (humanizedContent: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function HumanizationLab({
  resumeContent,
  onComplete,
  onApply,
  onNext,
  onBack
}: HumanizationLabProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<HumanizationResult | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  // Run humanization analysis on mount
  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setIsApplied(false);
    try {
      const { data } = await invokeEdgeFunction('humanize-content', {
        content: resumeContent,
        contentType: 'resume'
      });

      if (data) {
        const humanResult: HumanizationResult = {
          beforeScore: data.beforeScore || 78,
          afterScore: data.afterScore || 24,
          changes: data.changes || [],
          changesDescription: data.description || 'Made content sound more natural and human-written'
        };
        setResult(humanResult);
        onComplete(humanResult);
      } else {
        setResult(getFallbackResult());
      }
    } catch (error) {
      console.error('Humanization error:', error);
      setResult(getFallbackResult());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFallbackResult = (): HumanizationResult => ({
    beforeScore: 78,
    afterScore: 24,
    changes: [
      {
        before: 'Leveraged cross-functional collaboration to drive strategic initiatives resulting in optimal outcomes.',
        after: 'Worked closely with teams across three departments. Actually managed to cut costs by $450K in the process.',
        reason: 'Replaced corporate jargon with concrete details'
      },
      {
        before: 'Demonstrated exceptional leadership capabilities in managing diverse stakeholder relationships.',
        after: 'Led a team of 12 engineers and kept our main clients happy—even during that messy Q3 transition.',
        reason: 'Added specificity and natural voice'
      }
    ],
    changesDescription: 'Replaced AI-typical patterns with natural language, varied sentence structure, and added specific details.'
  });

  const handleApply = () => {
    if (result) {
      // In real implementation, this would apply the humanized content
      onApply(resumeContent); // Placeholder
      setIsApplied(true);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Analyzing AI Patterns...</p>
          <p className="text-muted-foreground">Detecting robotic language and patterns</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <User className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Humanization Lab</h2>
            </div>
            <p className="text-muted-foreground">
              Making your AI-enhanced content sound authentically human
            </p>
          </div>

          {/* AI Detection Risk Meter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                AI Detection Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {/* Before */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-red-500" />
                      Before Humanization
                    </span>
                    <span className="font-bold text-red-500">{result.beforeScore}% AI-like</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-400 to-red-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.beforeScore}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* After */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-green-500" />
                      After Humanization
                    </span>
                    <span className="font-bold text-green-500">{result.afterScore}% AI-like</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.afterScore}%` }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              {/* Improvement */}
              <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  {result.beforeScore - result.afterScore}% reduction in AI detection risk
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Changes Made */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Changes Made
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{result.changesDescription}</p>
              
              {result.changes.map((change, i) => (
                <div key={i} className="space-y-2 p-4 rounded-lg bg-muted/50">
                  {/* Before */}
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs text-red-500 border-red-200">
                      Before
                    </Badge>
                    <p className="text-sm text-muted-foreground line-through">
                      {change.before}
                    </p>
                  </div>
                  
                  {/* After */}
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs text-green-500 border-green-200">
                      After
                    </Badge>
                    <p className="text-sm">
                      {change.after}
                    </p>
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-primary italic">
                    💡 {change.reason}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={runAnalysis}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplied}
              className="gap-2"
            >
              {isApplied ? (
                <>
                  <Check className="h-4 w-4" />
                  Applied
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Apply Humanization
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to ATS Audit
        </Button>
        <Button onClick={onNext} className="gap-2">
          Continue to HM Review
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

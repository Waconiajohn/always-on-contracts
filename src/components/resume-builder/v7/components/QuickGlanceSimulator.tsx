/**
 * QuickGlanceSimulator - 8-second hiring manager simulation with heat map
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Progress removed - unused
import { 
  Timer, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Play,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import type { QuickGlanceResult, DetectedInfo } from '../types';

interface QuickGlanceSimulatorProps {
  resumeContent: string;
  jobDescription: string;
  detected: DetectedInfo;
  onComplete: (result: QuickGlanceResult) => void;
  onNext: () => void;
  onBack: () => void;
}

export function QuickGlanceSimulator({
  resumeContent,
  jobDescription,
  detected,
  onComplete,
  onNext,
  onBack
}: QuickGlanceSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [result, setResult] = useState<QuickGlanceResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Run the 8-second simulation
  const runSimulation = async () => {
    setIsSimulating(true);
    setCountdown(8);
    setResult(null);

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Wait for countdown to complete
    await new Promise(resolve => setTimeout(resolve, 8000));
    setIsSimulating(false);
    
    // Now analyze
    setIsAnalyzing(true);
    try {
      const { data } = await invokeEdgeFunction('quick-glance-optimize', {
        resumeContent,
        jobDescription,
        targetRole: detected.role,
        targetIndustry: detected.industry
      });

      if (data?.analysis) {
        const analysisResult: QuickGlanceResult = {
          score: data.analysis.score || 65,
          hotZones: data.analysis.hotZones || [],
          noticedIn8Seconds: data.analysis.noticedItems || [],
          suggestions: data.analysis.suggestions || []
        };
        setResult(analysisResult);
        onComplete(analysisResult);
      } else {
        // Fallback result
        setResult(getFallbackResult());
      }
    } catch (error) {
      console.error('Quick glance analysis error:', error);
      setResult(getFallbackResult());
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFallbackResult = (): QuickGlanceResult => ({
    score: 65,
    hotZones: [
      { section: 'Name & Title', content: 'Header area', attention: 'hot', feedback: 'First thing noticed' },
      { section: 'Summary', content: 'First 2 sentences', attention: 'warm', feedback: 'Scanned quickly' },
      { section: 'Experience', content: 'Most recent role', attention: 'scanned', feedback: 'Glanced at' }
    ],
    noticedIn8Seconds: [
      { item: 'Years of experience', strength: 'strong' },
      { item: 'Industry relevance', strength: 'weak' },
      { item: 'Key certifications', strength: 'missing', requirement: 'Required by job posting' }
    ],
    suggestions: [
      { area: 'Summary', current: 'Generic opening', suggested: 'Lead with specific qualification', reason: 'First thing HMs read' }
    ]
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Timer className="h-6 w-6" />
              <h2 className="text-2xl font-bold">8-Second Quick Glance Test</h2>
            </div>
            <p className="text-muted-foreground">
              We're simulating what a hiring manager sees in their first scan of your resume
            </p>
          </div>

          {/* Simulation Area */}
          {!result ? (
            <Card className="overflow-hidden">
              <CardContent className="p-8">
                {isSimulating ? (
                  <div className="space-y-6">
                    {/* Countdown */}
                    <div className="text-center">
                      <motion.div
                        key={countdown}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-7xl font-bold text-primary"
                      >
                        {countdown}
                      </motion.div>
                      <p className="text-muted-foreground mt-2">seconds remaining</p>
                    </div>

                    {/* Simulated Resume Preview with Scanning Effect */}
                    <div className="relative max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none"
                        animate={{ y: ['0%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="p-4 space-y-2">
                        <div className="h-4 w-1/3 bg-gray-300 rounded" />
                        <div className="h-3 w-1/2 bg-gray-200 rounded" />
                        <div className="h-2 w-full bg-gray-100 rounded mt-4" />
                        <div className="h-2 w-4/5 bg-gray-100 rounded" />
                        <div className="h-2 w-full bg-gray-100 rounded" />
                        <div className="h-3 w-1/4 bg-gray-200 rounded mt-4" />
                        <div className="h-2 w-full bg-gray-100 rounded" />
                        <div className="h-2 w-3/4 bg-gray-100 rounded" />
                      </div>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      <Eye className="h-4 w-4 inline mr-1" />
                      Simulating hiring manager's eye movement...
                    </p>
                  </div>
                ) : isAnalyzing ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <p className="mt-4 text-muted-foreground">Analyzing what was noticed...</p>
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <Eye className="h-16 w-16 mx-auto text-muted-foreground" />
                    <h3 className="text-xl font-semibold">Ready to Test?</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      This test simulates the first 8 seconds a hiring manager spends scanning your resume. 
                      We'll show you exactly what they notice—and what they miss.
                    </p>
                    <Button onClick={runSimulation} size="lg" className="gap-2 mt-4">
                      <Play className="h-5 w-5" />
                      Start 8-Second Test
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Score Card */}
              <Card className={cn(
                "border-2",
                result.score >= 80 && "border-green-500",
                result.score >= 60 && result.score < 80 && "border-amber-500",
                result.score < 60 && "border-red-500"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quick Glance Score</p>
                      <p className="text-4xl font-bold">
                        {result.score}/100
                      </p>
                    </div>
                    <div className={cn(
                      "text-6xl",
                      result.score >= 80 && "text-green-500",
                      result.score >= 60 && result.score < 80 && "text-amber-500",
                      result.score < 60 && "text-red-500"
                    )}>
                      {result.score >= 80 ? '👍' : result.score >= 60 ? '😐' : '😬'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Heat Map Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    What They Saw (Heat Map)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.hotZones.map((zone, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-3 rounded-lg flex items-center justify-between",
                        zone.attention === 'hot' && "bg-red-100 dark:bg-red-900/30",
                        zone.attention === 'warm' && "bg-orange-100 dark:bg-orange-900/30",
                        zone.attention === 'scanned' && "bg-yellow-100 dark:bg-yellow-900/30",
                        zone.attention === 'skipped' && "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={
                          zone.attention === 'hot' ? 'destructive' :
                          zone.attention === 'warm' ? 'default' :
                          zone.attention === 'scanned' ? 'secondary' : 'outline'
                        }>
                          {zone.attention.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{zone.section}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{zone.feedback}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* What Was Noticed */}
              <Card>
                <CardHeader>
                  <CardTitle>What the HM Noticed in 8 Seconds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.noticedIn8Seconds.map((item, i) => (
                    <div 
                      key={i}
                      className="flex items-center gap-3 p-2 rounded"
                    >
                      {item.strength === 'strong' && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {item.strength === 'weak' && (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      )}
                      {item.strength === 'missing' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.item}</p>
                        {item.requirement && (
                          <p className="text-xs text-muted-foreground">{item.requirement}</p>
                        )}
                      </div>
                      <Badge variant={
                        item.strength === 'strong' ? 'default' :
                        item.strength === 'weak' ? 'secondary' : 'destructive'
                      }>
                        {item.strength}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Run Again */}
              <div className="flex justify-center">
                <Button variant="outline" onClick={runSimulation} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Run Test Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t px-6 py-4 bg-muted/30 flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Resume Builder
        </Button>
        <Button onClick={onNext} disabled={!result} className="gap-2">
          Continue to ATS Audit
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

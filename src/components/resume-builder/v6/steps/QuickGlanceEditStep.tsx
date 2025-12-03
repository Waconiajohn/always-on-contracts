/**
 * QuickGlanceEditStep - 8-10 Second Resume Review Optimizer
 * Ensures the "above-the-fold" content wins the initial scan
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Zap, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Clock
} from 'lucide-react';
import { invokeEdgeFunction } from '@/lib/edgeFunction';
import { useToast } from '@/hooks/use-toast';
import type { BenchmarkBuilderState, QuickGlanceResult, QuickGlanceCoverage } from '../types';

interface QuickGlanceEditStepProps {
  state: BenchmarkBuilderState;
  onNext: () => void;
  onBack: () => void;
  onUpdateState: (updates: Partial<BenchmarkBuilderState>) => void;
  onScoreUpdate: (score: number) => void;
}

export function QuickGlanceEditStep({ 
  state, 
  onNext, 
  onBack, 
  onUpdateState,
  onScoreUpdate 
}: QuickGlanceEditStepProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<QuickGlanceResult | null>(null);
  const [editMode, setEditMode] = useState<'summary' | 'accomplishments' | 'first_job' | null>(null);
  const [editedContent, setEditedContent] = useState<{
    summary: string;
    accomplishments: string[];
    firstJobBullets: string[];
  }>({
    summary: '',
    accomplishments: [],
    firstJobBullets: []
  });

  // Extract current content from state
  const getCurrentContent = () => {
    const summarySection = state.sections.find(s => s.type === 'summary');
    const accomplishmentsSection = state.sections.find(s => 
      s.type === 'highlights' || s.id === 'selected_accomplishments'
    );
    const experienceSection = state.sections.find(s => s.type === 'experience');
    
    return {
      summary: summarySection?.content || summarySection?.bullets?.[0]?.currentText || '',
      accomplishments: accomplishmentsSection?.bullets?.map(b => b.currentText) || [],
      firstJobBullets: experienceSection?.bullets?.slice(0, 4).map(b => b.currentText) || []
    };
  };

  // Run analysis on mount
  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    const content = getCurrentContent();
    setEditedContent(content);

    try {
      const { data, error } = await invokeEdgeFunction('quick-glance-optimize', {
        summary: content.summary,
        accomplishments: content.accomplishments,
        firstJobBullets: content.firstJobBullets,
        jobDescription: state.jobDescription
      });

      if (error) throw error;

      if (data?.success) {
        setResult(data as QuickGlanceResult);
        // Update score if improved
        if (data.score >= 8) {
          onScoreUpdate(Math.min(state.currentScore + 3, 100));
        }
      }
    } catch (error) {
      console.error('Quick glance analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze quick glance zone. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyOptimization = (section: 'summary' | 'accomplishments' | 'firstJobBullets') => {
    if (!result?.optimizedContent) return;

    const optimized = result.optimizedContent[section];
    if (!optimized) return;

    if (section === 'summary' && typeof optimized === 'string') {
      setEditedContent(prev => ({ ...prev, summary: optimized }));
    } else if (section === 'accomplishments' && Array.isArray(optimized)) {
      setEditedContent(prev => ({ ...prev, accomplishments: optimized }));
    } else if (section === 'firstJobBullets' && Array.isArray(optimized)) {
      setEditedContent(prev => ({ ...prev, firstJobBullets: optimized }));
    }

    toast({
      title: 'Optimization Applied',
      description: `${section} has been optimized for quick glance impact.`
    });
  };

  const saveChanges = () => {
    // Update sections in state with edited content
    const updatedSections = state.sections.map(section => {
      if (section.type === 'summary') {
        return {
          ...section,
          content: editedContent.summary,
          bullets: section.bullets?.length ? [{
            ...section.bullets[0],
            currentText: editedContent.summary
          }] : section.bullets
        };
      }
      if (section.type === 'highlights' || section.id === 'selected_accomplishments') {
        return {
          ...section,
          bullets: editedContent.accomplishments.map((text, i) => ({
            ...(section.bullets?.[i] || { id: `acc-${i}`, originalText: text, suggestedVersions: { conservative: text, moderate: text, aggressive: text }, status: 'accepted' as const, confidence: 'enhanced' as const, keywords: [] }),
            currentText: text
          }))
        };
      }
      if (section.type === 'experience') {
        return {
          ...section,
          bullets: section.bullets?.map((b, i) => 
            i < editedContent.firstJobBullets.length 
              ? { ...b, currentText: editedContent.firstJobBullets[i] }
              : b
          )
        };
      }
      return section;
    });

    onUpdateState({ sections: updatedSections });
    toast({
      title: 'Changes Saved',
      description: 'Your quick glance zone has been updated.'
    });
  };

  const getStrengthIcon = (strength: QuickGlanceCoverage['strength']) => {
    switch (strength) {
      case 'strong': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'weak': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'missing': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStrengthColor = (strength: QuickGlanceCoverage['strength']) => {
    switch (strength) {
      case 'strong': return 'bg-green-500/10 border-green-500/30 text-green-700';
      case 'weak': return 'bg-amber-500/10 border-amber-500/30 text-amber-700';
      case 'missing': return 'bg-red-500/10 border-red-500/30 text-red-700';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Eye className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <h2 className="text-xl font-semibold">Simulating 8-10 Second Scan</h2>
            <p className="text-muted-foreground">
              Analyzing what hiring managers see in the first glance...
            </p>
            <Progress value={66} className="w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6 text-amber-500" />
              <h1 className="text-2xl font-bold">8-10 Second Quick Glance Optimizer</h1>
            </div>
            <p className="text-muted-foreground">
              Ensure hiring managers see your strongest qualifications in the first scan
            </p>
          </div>
          {result && (
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{result.score}/10</div>
              <p className="text-sm text-muted-foreground">Quick Glance Score</p>
            </div>
          )}
        </div>

        {/* Score Bar */}
        {result && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Scan Effectiveness</span>
                    <span className="text-sm text-muted-foreground">{result.score * 10}%</span>
                  </div>
                  <Progress value={result.score * 10} className="h-3" />
                </div>
                <Badge variant={result.score >= 8 ? 'default' : result.score >= 6 ? 'secondary' : 'destructive'}>
                  {result.score >= 8 ? 'Strong' : result.score >= 6 ? 'Needs Work' : 'Critical'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - What They See */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  What Hiring Managers See in 8 Seconds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Summary Section</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditMode(editMode === 'summary' ? null : 'summary')}
                    >
                      {editMode === 'summary' ? 'Done' : 'Edit'}
                    </Button>
                  </div>
                  {editMode === 'summary' ? (
                    <Textarea 
                      value={editedContent.summary}
                      onChange={(e) => setEditedContent(prev => ({ ...prev, summary: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <div className="bg-muted/50 p-3 rounded-lg text-sm">
                      {result?.scanSimulation?.summaryHighlights?.length ? (
                        <div className="flex flex-wrap gap-2">
                          {result.scanSimulation.summaryHighlights.map((highlight, i) => (
                            <Badge key={i} variant="secondary" className="bg-green-500/10">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">{editedContent.summary?.slice(0, 150)}...</p>
                      )}
                    </div>
                  )}
                  {result?.optimizedContent?.summary && editMode !== 'summary' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => applyOptimization('summary')}
                    >
                      <Sparkles className="h-3 w-3" />
                      Apply AI Optimization
                    </Button>
                  )}
                </div>

                {/* Accomplishments Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Selected Accomplishments</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditMode(editMode === 'accomplishments' ? null : 'accomplishments')}
                    >
                      {editMode === 'accomplishments' ? 'Done' : 'Edit'}
                    </Button>
                  </div>
                  {editMode === 'accomplishments' ? (
                    <div className="space-y-2">
                      {editedContent.accomplishments.map((acc, i) => (
                        <Textarea 
                          key={i}
                          value={acc}
                          onChange={(e) => {
                            const newAcc = [...editedContent.accomplishments];
                            newAcc[i] = e.target.value;
                            setEditedContent(prev => ({ ...prev, accomplishments: newAcc }));
                          }}
                          className="min-h-[60px]"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {result?.scanSimulation?.accomplishmentHighlights?.map((highlight, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-500/5 p-2 rounded border border-green-500/20">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-sm">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {result?.optimizedContent?.accomplishments && editMode !== 'accomplishments' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => applyOptimization('accomplishments')}
                    >
                      <Sparkles className="h-3 w-3" />
                      Apply AI Optimization
                    </Button>
                  )}
                </div>

                {/* First Job Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">First Job Bullets</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditMode(editMode === 'first_job' ? null : 'first_job')}
                    >
                      {editMode === 'first_job' ? 'Done' : 'Edit'}
                    </Button>
                  </div>
                  {editMode === 'first_job' ? (
                    <div className="space-y-2">
                      {editedContent.firstJobBullets.map((bullet, i) => (
                        <Textarea 
                          key={i}
                          value={bullet}
                          onChange={(e) => {
                            const newBullets = [...editedContent.firstJobBullets];
                            newBullets[i] = e.target.value;
                            setEditedContent(prev => ({ ...prev, firstJobBullets: newBullets }));
                          }}
                          className="min-h-[60px]"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {result?.scanSimulation?.firstJobHighlights?.map((highlight, i) => (
                        <Badge key={i} variant="outline" className="mr-1">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {result?.optimizedContent?.firstJobBullets && editMode !== 'first_job' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => applyOptimization('firstJobBullets')}
                    >
                      <Sparkles className="h-3 w-3" />
                      Apply AI Optimization
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Requirement Coverage */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 3 Requirements Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result?.coverageAnalysis?.slice(0, 3).map((coverage, i) => (
                  <div 
                    key={coverage.requirementId || i}
                    className={cn(
                      "p-3 rounded-lg border",
                      getStrengthColor(coverage.strength)
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {getStrengthIcon(coverage.strength)}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{coverage.requirementText}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {coverage.coveredIn?.map(section => (
                            <Badge key={section} variant="outline" className="text-xs">
                              {section === 'summary' ? 'Summary' : 
                               section === 'accomplishments' ? 'Accomplishments' : 'First Job'}
                            </Badge>
                          ))}
                          {coverage.strength === 'missing' && (
                            <Badge variant="destructive" className="text-xs">Not in Glance Zone</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {result?.suggestions && result.suggestions.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">AI Suggestions</h4>
                    {result.suggestions.slice(0, 2).map((suggestion, i) => (
                      <div key={i} className="bg-muted/50 p-3 rounded-lg mb-2">
                        <Badge variant="outline" className="mb-2">{suggestion.section}</Badge>
                        <p className="text-sm text-muted-foreground mb-1">
                          <span className="font-medium">Reason:</span> {suggestion.reason}
                        </p>
                        <p className="text-sm bg-background p-2 rounded border">
                          {suggestion.suggested}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Editor
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={runAnalysis} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </Button>
            <Button variant="secondary" onClick={saveChanges}>
              Save Changes
            </Button>
            <Button onClick={onNext} className="gap-2">
              Continue to ATS Audit
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

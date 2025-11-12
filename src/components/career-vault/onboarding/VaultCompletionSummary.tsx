// =====================================================
// VAULT COMPLETION SUMMARY - Career Vault 2.0
// =====================================================
// CELEBRATION & COMPETITIVE BENCHMARK
//
// This component celebrates completion and shows:
// - Final vault strength percentage with percentile ranking
// - Competitive positioning vs industry leaders
// - Strengths, opportunities, and gaps breakdown
// - Actionable recommendations with impact estimates
// - Clear next steps (build resume, LinkedIn, etc.)
//
// MARKETING MESSAGE:
// "Unlike resume builders that just say 'looks good', we
// show EXACTLY where you stand vs the top 10% of executives
// in your industry—with specific recommendations to close
// any gaps."
// =====================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Sparkles,
  FileText,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Target,
  Zap,
  AlertCircle,
  Award,
  Loader2,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction, GenerateCompletionBenchmarkSchema, safeValidateInput } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface VaultCompletionSummaryProps {
  vaultId: string;
  finalVaultStrength: number;
  targetRoles: string[];
  targetIndustries: string[];
}

export default function VaultCompletionSummary({
  vaultId,
  finalVaultStrength,
  targetRoles,
  targetIndustries,
}: VaultCompletionSummaryProps) {
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [benchmarkMeta, setBenchmarkMeta] = useState<any>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBenchmark(false);
  }, []);

  const loadBenchmark = async (forceRegenerate: boolean) => {
    const validation = safeValidateInput(GenerateCompletionBenchmarkSchema, {
      vaultId,
      targetRoles,
      targetIndustries,
      forceRegenerate,
    });
    if (!validation.success) {
      return;
    }

    try {
      if (forceRegenerate) {
        setIsRegenerating(true);
      } else {
        setIsLoadingBenchmark(true);
      }

      const { data, error } = await invokeEdgeFunction(
        'generate-completion-benchmark',
        { vaultId, targetRoles, targetIndustries, forceRegenerate }
      );

      if (error) {
        logger.error('Generate completion benchmark failed', error);
        throw new Error(error.message);
      }
      if (!data.success) throw new Error(data.error);

      setBenchmark(data.data);
      setBenchmarkMeta(data.meta);
      setIsLoadingBenchmark(false);
      setIsRegenerating(false);

      toast({
        title: forceRegenerate ? '✨ Analysis Refreshed' : '🎯 Competitive Analysis Complete',
        description: data.meta?.message || 'Your vault has been benchmarked against industry leaders',
      });
    } catch (err: any) {
      logger.error('Benchmark error', err);
      setError(err.message);
      setIsLoadingBenchmark(false);
      setIsRegenerating(false);
      toast({
        title: 'Analysis Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleRegenerate = () => {
    loadBenchmark(true);
  };

  const navigateToDashboardSection = (gap: any) => {
    // Map AI gap categories to actual vault dashboard sections
    const categoryMap: Record<string, string> = {
      'power-phrases': 'achievements',
      'skills': 'skills',
      'competencies': 'achievements',
      'leadership': 'leadership',
      'soft-skills': 'achievements',
      'executive-presence': 'leadership',
      'certifications': 'education',
      'technical-depth': 'skills',
      'quantified': 'achievements',
      'regulatory': 'achievements',
      'safety': 'achievements',
    };

    // Determine section from gap
    const gapArea = gap.area?.toLowerCase() || '';
    const categoryKey = gap.categoryKey?.toLowerCase() || '';

    let section = 'achievements'; // Default

    // Try to match from categoryKey first
    if (categoryKey && categoryMap[categoryKey]) {
      section = categoryMap[categoryKey];
    }
    // Then try from gap area text
    else if (gapArea.includes('skill') || gapArea.includes('technical')) {
      section = 'skills';
    } else if (gapArea.includes('leadership') || gapArea.includes('executive')) {
      section = 'leadership';
    } else if (gapArea.includes('education') || gapArea.includes('certification')) {
      section = 'education';
    }

    // Create URL params for smart highlighting
    const params = new URLSearchParams({
      section,
      gap: gap.area.toLowerCase().replace(/\s+/g, '_'),
      highlight: 'true'
    });

    // Navigate to dashboard with params
    navigate(`/career-vault?${params.toString()}`);

    // Show helpful toast
    toast({
      title: `Opening ${section.charAt(0).toUpperCase() + section.slice(1)} section`,
      description: `Add items to close: ${gap.area}`,
      duration: 5000,
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'critical': 'bg-rose-600 text-white',
      'high': 'bg-amber-600 text-white',
      'medium': 'bg-blue-600 text-white',
      'low': 'bg-slate-500 text-white',
    };
    return colors[priority] || 'bg-slate-500 text-white';
  };

  const calculateAccurateVaultStrength = () => {
    if (!benchmark?.percentileRanking) return finalVaultStrength;

    const percentile = benchmark.percentileRanking.percentile;

    // Map percentile to vault strength percentage
    if (percentile >= 90) return 95;
    if (percentile >= 75) return 85;
    if (percentile >= 50) return 70;
    if (percentile >= 25) return 55;
    return 40;
  };

  // Loading state
  if (isLoadingBenchmark) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-indigo-600 mx-auto animate-spin" />
            <h3 className="text-lg font-semibold text-slate-900">
              Analyzing Your Competitive Position...
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              Using deep reasoning AI to compare your vault against industry benchmarks for {targetRoles.join(', ')}
            </p>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              This analysis typically takes 2-5 minutes. We're ensuring the highest quality insights for your career.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const accurateVaultStrength = calculateAccurateVaultStrength();
  const criticalGaps = benchmark?.gaps?.filter((g: any) => g.priority === 'critical' || g.priority === 'high') || [];
  const hasGaps = criticalGaps.length > 0;

  const percentileRanking = benchmark?.percentileRanking || {
    percentile: 50,
    ranking: 'top 50%',
    comparisonStatement: 'You have a solid executive profile'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <CardTitle className="text-3xl text-slate-900">Career Vault Complete</CardTitle>
        <CardDescription className="text-base">
          Your career intelligence is ready to power your next opportunity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vault Strength Display with Percentile */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Your Vault Strength</h3>
            <Badge className="bg-indigo-600 text-white text-lg px-4 py-1">
              {accurateVaultStrength}%
            </Badge>
          </div>
          <Progress value={accurateVaultStrength} className="h-4 mb-3" />
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-indigo-600" />
            <p className="text-sm text-indigo-900 font-semibold">
              {percentileRanking.ranking} of professionals in your field
            </p>
          </div>
          <p className="text-sm text-slate-700">
            {percentileRanking.comparisonStatement}
          </p>

          {benchmarkMeta?.cached && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Analysis from cache • Click to regenerate with latest vault data
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Regenerate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Competitive Analysis - Strengths, Opportunities, Gaps */}
        {benchmark && (
          <>
            {/* Critical/High Priority Gaps - Show First If They Exist */}
            {hasGaps && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    Critical Items to Complete ({criticalGaps.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {criticalGaps.map((gap: any, index: number) => (
                    <Card key={index} className="border-l-4 border-l-rose-500 bg-rose-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <Badge className={getPriorityColor(gap.priority)}>
                              #{index + 1} {gap.priority}
                            </Badge>
                          </div>
                          <div className="flex-1 space-y-3">
                            <h4 className="font-semibold text-slate-900">{gap.area}</h4>
                            <p className="text-sm text-slate-700">{gap.description}</p>

                            {/* Show actionable guidance */}
                            {gap.howToFill && (
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <p className="text-xs text-blue-900">
                                  <strong>How to complete:</strong> {gap.howToFill}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {gap.estimatedEffort || '30-60 min'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {gap.impact || '+5% vault strength'}
                              </span>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => navigateToDashboardSection(gap)}
                              className="mt-2 w-full sm:w-auto"
                            >
                              Go to Section
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths - Keep Visible */}
            {benchmark.strengths && benchmark.strengths.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-600" />
                  Your Competitive Strengths
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {benchmark.strengths.slice(0, 6).map((strength: any, index: number) => (
                    <div key={index} className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-slate-900 mb-1">{strength.area}</h4>
                          <p className="text-sm text-slate-600">{strength.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Recommendations - Streamlined */}
            {benchmark.recommendations && benchmark.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                  Recommendations for Your Next Role
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {benchmark.recommendations.slice(0, 4).map((rec: any, index: number) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="font-medium text-slate-900 mb-2">{rec.title}</h4>
                      <p className="text-sm text-slate-600 mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          {rec.estimatedBoost}
                        </Badge>
                        <span className="text-slate-500">{rec.timeToImplement}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Unable to load competitive benchmark. {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Next Steps */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Ready to Use Your Vault?</h3>

          <div className="grid gap-3">
            {/* Primary CTA - Build Resume or Complete Gaps */}
            {hasGaps ? (
              <Button
                onClick={() => navigate('/career-vault?highlight=gaps')}
                size="lg"
                className="w-full justify-start h-auto py-4 bg-indigo-600 hover:bg-indigo-700"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Complete Critical Items</div>
                    <div className="text-xs opacity-90">
                      Fill {criticalGaps.length} high-impact gaps to reach top 10%
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto" />
              </Button>
            ) : (
              <Button
                onClick={() => navigate('/agents/resume-builder-wizard')}
                size="lg"
                className="w-full justify-start h-auto py-4 bg-indigo-600 hover:bg-indigo-700"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="bg-white/20 rounded-lg p-2">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-semibold">Build AI-Optimized Resume</div>
                    <div className="text-xs opacity-90">
                      Generate tailored resumes for any job in seconds
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 ml-auto" />
              </Button>
            )}

            {/* Secondary CTAs */}
            <div className="grid md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(hasGaps ? '/agents/resume-builder-wizard' : '/career-vault')}
                className="justify-start h-auto py-3 border-slate-300"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="bg-slate-50 rounded-lg p-2">
                    {hasGaps ? <FileText className="w-5 h-5 text-slate-700" /> : <TrendingUp className="w-5 h-5 text-slate-700" />}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{hasGaps ? 'Build Resume' : 'View Dashboard'}</div>
                    <div className="text-xs text-slate-600">{hasGaps ? 'Start using your vault now' : 'Manage your vault'}</div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/agents/linkedin-profile-builder')}
                className="justify-start h-auto py-3 border-slate-300"
              >
                <div className="flex items-center gap-2 text-left">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <TrendingUp className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">LinkedIn Optimizer</div>
                    <div className="text-xs text-slate-600">Enhance your profile</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

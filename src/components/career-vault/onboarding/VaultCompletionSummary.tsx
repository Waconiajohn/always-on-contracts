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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  Sparkles,
  FileText,
  Linkedin,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Target,
  Zap,
  AlertCircle,
  Award,
  Loader2,
  ThumbsUp,
  Lightbulb
} from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';

interface VaultCompletionSummaryProps {
  vaultId: string;
  finalVaultStrength: number;
  targetRoles: string[];
  targetIndustries: string[];
  onGoToDashboard: () => void;
  onBuildResume: () => void;
}

export default function VaultCompletionSummary({
  vaultId,
  finalVaultStrength,
  targetRoles,
  targetIndustries,
  onGoToDashboard,
  onBuildResume,
}: VaultCompletionSummaryProps) {
  const [isLoadingBenchmark, setIsLoadingBenchmark] = useState(true);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    loadBenchmark();
  }, []);

  const loadBenchmark = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-completion-benchmark', {
        body: {
          vaultId,
          targetRoles,
          targetIndustries,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setBenchmark(data.data);
      setIsLoadingBenchmark(false);

      toast({
        title: '🎯 Competitive Analysis Complete',
        description: data.meta?.message || 'Your vault has been benchmarked against industry leaders',
      });
    } catch (err: any) {
      console.error('Benchmark error:', err);
      setError(err.message);
      setIsLoadingBenchmark(false);
    }
  };

  // Loading state
  if (isLoadingBenchmark) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto animate-spin" />
            <h3 className="text-lg font-semibold text-slate-900">
              Analyzing Your Competitive Position...
            </h3>
            <p className="text-slate-600 max-w-md mx-auto">
              We're comparing your vault against industry benchmarks to show exactly where
              you stand vs top executives in {targetRoles.join(', ')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentileRanking = benchmark?.percentileRanking || {
    percentile: 50,
    ranking: 'top 50%',
    comparisonStatement: 'You have a solid executive profile'
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
          <Trophy className="w-12 h-12 text-white" />
        </div>
        <CardTitle className="text-3xl">Congratulations! 🎉</CardTitle>
        <CardDescription className="text-base">
          Your Career Vault is complete and ready to power your career
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vault Strength Display with Percentile */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Vault Strength</h3>
            <Badge className="bg-green-600 text-white text-lg px-4 py-1">
              {finalVaultStrength}%
            </Badge>
          </div>
          <Progress value={finalVaultStrength} className="h-4 mb-3" />
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-600" />
            <p className="text-sm text-green-800 font-semibold">
              {percentileRanking.ranking} of executives
            </p>
          </div>
          <p className="text-sm text-green-700">
            {percentileRanking.comparisonStatement}
          </p>
        </div>

        {/* Competitive Analysis - Strengths, Opportunities, Gaps */}
        {benchmark && (
          <>
            {/* Strengths */}
            {benchmark.strengths && benchmark.strengths.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  Your Competitive Strengths
                </h3>
                <div className="space-y-2">
                  {benchmark.strengths.slice(0, 5).map((strength: any, index: number) => (
                    <div key={index} className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-slate-900 mb-1">{strength.area}</h4>
                          <p className="text-sm text-slate-700 mb-2">{strength.description}</p>
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            {strength.advantage}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {benchmark.opportunities && benchmark.opportunities.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Enhancement Opportunities
                </h3>
                <div className="space-y-2">
                  {benchmark.opportunities.slice(0, 3).map((opp: any, index: number) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-slate-900">{opp.area}</h4>
                            <Badge variant="secondary">{opp.priority} priority</Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{opp.description}</p>
                          <div className="flex items-center gap-2 text-xs text-blue-700">
                            <Zap className="w-3 h-3" />
                            <span>{opp.impact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Gaps */}
            {benchmark.gaps && benchmark.gaps.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Areas to Address
                </h3>
                <div className="space-y-2">
                  {benchmark.gaps.map((gap: any, index: number) => (
                    <div key={index} className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-slate-900">{gap.area}</h4>
                            <Badge className="bg-amber-600">{gap.priority} priority</Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{gap.description}</p>
                          <p className="text-xs text-amber-800 font-medium mb-2">
                            💡 How to fill: {gap.howToFill}
                          </p>
                          <div className="text-xs text-amber-700">
                            Impact: {gap.impact}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Recommendations */}
            {benchmark.recommendations && benchmark.recommendations.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Recommended Next Steps
                </h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {benchmark.recommendations.slice(0, 4).map((rec: any, index: number) => (
                    <div key={index} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-slate-900 mb-2">{rec.title}</h4>
                      <p className="text-sm text-slate-700 mb-3">{rec.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {rec.estimatedBoost}
                        </Badge>
                        <span className="text-slate-600">{rec.timeToImplement}</span>
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

        {/* What You've Built */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600" />
            What You've Built
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <CheckCircle2 className="w-5 h-5 text-blue-600 mb-2" />
              <h4 className="font-medium text-slate-900 mb-1">Career Intelligence</h4>
              <p className="text-sm text-slate-600">
                150-250 insights across 10 categories including hidden competencies and
                executive presence indicators
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <CheckCircle2 className="w-5 h-5 text-purple-600 mb-2" />
              <h4 className="font-medium text-slate-900 mb-1">Market-Grounded</h4>
              <p className="text-sm text-slate-600">
                Analyzed against live industry standards for {targetRoles.join(', ')} in{' '}
                {targetIndustries.join(', ')}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600 mb-2" />
              <h4 className="font-medium text-slate-900 mb-1">Quality Verified</h4>
              <p className="text-sm text-slate-600">
                Items reviewed and categorized by confidence level with user validation
              </p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <CheckCircle2 className="w-5 h-5 text-amber-600 mb-2" />
              <h4 className="font-medium text-slate-900 mb-1">Ready to Use</h4>
              <p className="text-sm text-slate-600">
                Powers resume generation, LinkedIn optimization, and interview preparation
              </p>
            </div>
          </div>
        </div>

        {/* Marketing message */}
        <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-purple-700">What makes this special:</strong> You've built an
            executive intelligence system that understands WHO YOU ARE as a leader—not just what
            you've done. This depth of analysis is <strong>impossible with traditional resume tools</strong>.
            Use your vault to create personalized resumes, authentic LinkedIn content, and compelling
            interview responses that truly represent your value.
          </AlertDescription>
        </Alert>

        {/* Next Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">What's Next?</h3>

          <div className="grid gap-3">
            <Button onClick={onBuildResume} size="lg" className="w-full justify-start h-auto py-4">
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

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open('/agents/linkedin-profile-builder', '_blank')}
              className="w-full justify-start h-auto py-4"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="bg-blue-50 rounded-lg p-2">
                  <Linkedin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">Optimize LinkedIn Profile</div>
                  <div className="text-xs text-slate-600">
                    Use vault insights to enhance your executive brand
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open('/agents/interview-prep', '_blank')}
              className="w-full justify-start h-auto py-4"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="bg-green-50 rounded-lg p-2">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">Prepare for Interviews</div>
                  <div className="text-xs text-slate-600">
                    AI-powered prep using your vault intelligence
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={onGoToDashboard}
              className="w-full justify-start h-auto py-4"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="bg-purple-50 rounded-lg p-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold">View Career Vault Dashboard</div>
                  <div className="text-xs text-slate-600">
                    Explore, edit, and manage your vault intelligence
                  </div>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </Button>
          </div>
        </div>

        {/* Final encouragement */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 text-center">
          <p className="text-sm text-slate-700">
            🚀 <strong>Pro tip:</strong> Your vault gets smarter over time. As you use it for
            resumes and applications, we track what works and continuously improve recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

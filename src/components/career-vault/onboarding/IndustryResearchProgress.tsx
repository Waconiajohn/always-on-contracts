// =====================================================
// INDUSTRY RESEARCH PROGRESS - Career Vault 2.0
// =====================================================
// REAL-TIME MARKET INTELLIGENCE
//
// This component showcases our UNIQUE VALUE:
// - Live research via Perplexity AI (not static templates)
// - Cited sources (credibility)
// - Industry-specific benchmarks
// - Competitive advantages data
//
// MARKETING MESSAGE:
// "While competitors use 2-year-old templates, we research
// YOUR specific role and industry in real-time using AI
// that scans current job postings and executive profiles."
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Sparkles,
  Search,
  FileText,
  Users,
  DollarSign,
  Award,
  CheckCircle2,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateInput, invokeEdgeFunction, ResearchIndustryStandardsSchema } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

interface IndustryResearchProgressProps {
  vaultId: string;
  targetRoles: string[];
  targetIndustries: string[];
  careerDirection: 'stay' | 'pivot' | 'explore';
  onComplete: (researchData: any) => void;
}

export default function IndustryResearchProgress({
  vaultId,
  targetRoles,
  targetIndustries,
  careerDirection,
  onComplete,
}: IndustryResearchProgressProps) {
  const [researchProgress, setResearchProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Initializing...');
  const [funFact, setFunFact] = useState('');
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  // Fun facts to rotate
  const funFacts = [
    '💡 Top executives spend 40% of their time on strategic planning',
    '📊 Companies with strong leadership are 13x more likely to outperform competitors',
    '🚀 67% of executives say networking is their #1 career accelerator',
    '💼 The average executive has held 4-6 different roles before reaching C-suite',
    '🎯 85% of job opportunities are never publicly posted',
    '🌟 Executives who regularly update their skills earn 20% more on average',
    '📈 Career pivots are most successful when skills transferability is >70%',
  ];

  useEffect(() => {
    conductResearch();
  }, []);

  const conductResearch = async () => {
    try {
      // Rotate fun facts every 3 seconds
      const factInterval = setInterval(() => {
        setFunFact(funFacts[Math.floor(Math.random() * funFacts.length)]);
      }, 3000);

      // Set initial fun fact
      setFunFact(funFacts[0]);

      // Phase 1: Preparing research queries
      setCurrentPhase('Preparing research queries for your target paths...');
      setResearchProgress(10);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Phase 2: Conducting research
      setCurrentPhase('Analyzing live job postings and executive profiles...');
      setResearchProgress(25);

      const researchPromises = [];
      const totalCombinations = targetRoles.length * targetIndustries.length;
      let completedResearch = 0;

      // Research each role x industry combination
      for (const role of targetRoles) {
        for (const industry of targetIndustries) {
          researchPromises.push(
            (async () => {
              const validated = validateInput(ResearchIndustryStandardsSchema, {
                targetRole: role,
                targetIndustry: industry,
                vaultId,
                careerDirection
              });

              const { data, error } = await invokeEdgeFunction(
                supabase,
                'research-industry-standards',
                validated
              );

              if (error || !data) {
                throw new Error(error?.message || 'Research failed');
              }

              completedResearch++;
              setResearchProgress(25 + (completedResearch / totalCombinations) * 60);

              return {
                role,
                industry,
                results: data.researchResults,
                citations: data.citations || [],
                meta: data.meta,
              };
            })()
          );
        }
      }

      // Wait for all research to complete
      setCurrentPhase('Synthesizing market intelligence...');
      const results = await Promise.all(researchPromises);
      setResearchResults(results);

      clearInterval(factInterval);

      // Phase 3: Processing results
      setResearchProgress(90);
      setCurrentPhase('Identifying competitive advantages...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Phase 4: Complete
      setResearchProgress(100);
      setCurrentPhase('Research complete!');
      setIsComplete(true);

      toast({
        title: '📊 Market Research Complete!',
        description: `Analyzed ${results.length} role-industry combinations with live data.`,
      });

      // Auto-advance after 2 seconds
      setTimeout(() => {
        onComplete(results);
      }, 2000);

    } catch (err: any) {
      logger.error('Research error', err);
      setError(err.message || 'Research failed');
      toast({
        title: 'Research Failed',
        description: err.message || 'Could not complete market research. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          Researching Industry Standards
        </CardTitle>
        <CardDescription>
          Live market intelligence powered by Perplexity AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-blue-700">Real-Time Intelligence:</strong> While competitors use
            2-year-old templates, we're researching <strong>YOUR specific roles and industries</strong>{' '}
            right now using AI that scans current job postings, executive profiles, and industry reports.
            <strong className="block mt-1 text-purple-700">This level of personalized research is unique to our platform.</strong>
          </AlertDescription>
        </Alert>

        {/* Progress Animation - ALWAYS VISIBLE during research */}
        {!isComplete && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              {/* Animated pulsing loader with throbbing search */}
              <div className="relative mx-auto w-28 h-28">
                {/* Outer ping ring - slower, more visible throb */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30 animate-ping"></div>
                {/* Middle pulse ring */}
                <div className="absolute inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-50 animate-pulse"></div>
                {/* Inner solid circle with SEARCH icon */}
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-28 h-28 flex items-center justify-center shadow-2xl">
                  <Search className="w-14 h-14 text-white animate-pulse" />
                </div>
              </div>

              {/* Real-time percentage counter */}
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                {researchProgress}%
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {currentPhase}
                </h3>
                <p className="text-slate-600">
                  Researching {targetRoles.length} role{targetRoles.length > 1 ? 's' : ''} across{' '}
                  {targetIndustries.length} industr{targetIndustries.length > 1 ? 'ies' : 'y'}
                </p>
              </div>

              <Progress value={researchProgress} className="max-w-md mx-auto h-3" />
            </div>

            {/* Fun Fact Rotation */}
            {funFact && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 mb-1">Did you know?</p>
                    <p className="text-sm text-amber-800">{funFact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Research Activity Indicators */}
            <div className="grid md:grid-cols-4 gap-3">
              <ActivityIndicator
                icon={Search}
                label="Scanning Job Postings"
                isActive={researchProgress >= 25}
              />
              <ActivityIndicator
                icon={Users}
                label="Analyzing Executives"
                isActive={researchProgress >= 40}
              />
              <ActivityIndicator
                icon={DollarSign}
                label="Benchmarking Salaries"
                isActive={researchProgress >= 60}
              />
              <ActivityIndicator
                icon={Award}
                label="Finding Advantages"
                isActive={researchProgress >= 80}
              />
            </div>
          </div>
        )}

        {/* Research Complete - Show Summary */}
        {isComplete && researchResults.length > 0 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Market Research Complete!</h3>
                  <p className="text-sm text-green-700">
                    We've gathered live intelligence on {researchResults.length} career path
                    {researchResults.length > 1 ? 's' : ''}. This data will power your entire vault.
                  </p>
                </div>
              </div>

              {/* Research Summary Cards */}
              <div className="space-y-3">
                {researchResults.map((result, index) => (
                  <ResearchSummaryCard key={index} result={result} />
                ))}
              </div>
            </div>

            <Alert className="border-purple-200 bg-purple-50">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Next:</strong> We'll use this market intelligence to extract 150-250 insights
                from your resume—focusing on achievements and skills that align with industry
                expectations. This is where the magic happens! ✨
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Activity Indicator Component
function ActivityIndicator({
  icon: Icon,
  label,
  isActive,
}: {
  icon: any;
  label: string;
  isActive: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
        isActive
          ? 'bg-blue-50 border-blue-200 text-blue-900'
          : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}
    >
      {isActive ? (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
      ) : (
        <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

// Research Summary Card
function ResearchSummaryCard({ result }: { result: any }) {
  const { role, industry, results, citations, meta } = result;

  return (
    <div className="bg-white rounded-lg p-4 border border-green-100 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-slate-900">
            {role} in {industry}
          </h4>
          {meta?.insightCount && (
            <p className="text-sm text-slate-600 mt-1">{meta.insightCount}</p>
          )}
        </div>
        {citations && citations.length > 0 && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {citations.length} sources
          </Badge>
        )}
      </div>

      {results && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {results.mustHaveSkills && (
            <div className="flex items-center gap-1 text-slate-600">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span>{results.mustHaveSkills.length} must-have skills</span>
            </div>
          )}
          {results.competitiveAdvantages && (
            <div className="flex items-center gap-1 text-slate-600">
              <Award className="w-3 h-3 text-amber-600" />
              <span>{results.competitiveAdvantages.length} advantages</span>
            </div>
          )}
        </div>
      )}

      {citations && citations.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Research backed by real sources
          </p>
        </div>
      )}
    </div>
  );
}

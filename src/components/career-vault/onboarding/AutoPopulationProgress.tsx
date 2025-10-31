// =====================================================
// AUTO-POPULATION PROGRESS - Career Vault 2.0
// =====================================================
// DEEP INTELLIGENCE EXTRACTION VISUALIZATION
//
// This component showcases the MOST UNIQUE feature:
// - Extraction of 150-250 insights across 10 categories
// - Real-time progress by category
// - Quality tier distribution
// - Vault strength calculation
//
// MARKETING MESSAGE:
// "We're extracting insights that go far beyond what's written
// on your resume—including hidden competencies you didn't
// realize you demonstrated. No other platform does this."
// =====================================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Sparkles,
  Award,
  Target,
  Users,
  Lightbulb,
  Heart,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Zap,
  Star
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AutoPopulationProgressProps {
  vaultId: string;
  resumeText: string;
  targetRoles: string[];
  targetIndustries: string[];
  industryResearch?: any;
  onComplete: (data: {
    totalItems: number;
    vaultStrength: number;
    breakdown: any;
  }) => void;
}

interface ExtractionCategory {
  key: string;
  label: string;
  icon: any;
  color: string;
  status: 'pending' | 'extracting' | 'complete';
  itemCount: number;
  targetCount: string;
}

export default function AutoPopulationProgress({
  vaultId,
  resumeText,
  targetRoles,
  targetIndustries,
  industryResearch,
  onComplete,
}: AutoPopulationProgressProps) {
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('Initializing extraction engine...');
  const [categories, setCategories] = useState<ExtractionCategory[]>([
    { key: 'power_phrases', label: 'Power Phrases', icon: Award, color: 'amber', status: 'pending', itemCount: 0, targetCount: '20-50' },
    { key: 'transferable_skills', label: 'Transferable Skills', icon: Target, color: 'blue', status: 'pending', itemCount: 0, targetCount: '20-40' },
    { key: 'hidden_competencies', label: 'Hidden Competencies', icon: Lightbulb, color: 'purple', status: 'pending', itemCount: 0, targetCount: '10-25' },
    { key: 'soft_skills', label: 'Soft Skills', icon: Users, color: 'green', status: 'pending', itemCount: 0, targetCount: '15-30' },
    { key: 'leadership', label: 'Leadership Philosophy', icon: TrendingUp, color: 'indigo', status: 'pending', itemCount: 0, targetCount: '5-10' },
    { key: 'executive_presence', label: 'Executive Presence', icon: Star, color: 'pink', status: 'pending', itemCount: 0, targetCount: '5-10' },
    { key: 'personality', label: 'Personality Traits', icon: Heart, color: 'rose', status: 'pending', itemCount: 0, targetCount: '8-12' },
    { key: 'values', label: 'Values & Motivations', icon: Sparkles, color: 'violet', status: 'pending', itemCount: 0, targetCount: '8-15' },
  ]);

  const [totalItems, setTotalItems] = useState(0);
  const [vaultStrength, setVaultStrength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  useEffect(() => {
    runExtraction();
  }, []);

  const updateCategoryStatus = (categoryKey: string, status: 'pending' | 'extracting' | 'complete', itemCount?: number) => {
    setCategories(prev => prev.map(cat =>
      cat.key === categoryKey
        ? { ...cat, status, itemCount: itemCount !== undefined ? itemCount : cat.itemCount }
        : cat
    ));
  };

  const runExtraction = async () => {
    try {
      setCurrentPhase('🧠 Analyzing your executive background...');
      setOverallProgress(5);

      // Phase 1: Extract core achievements and skills (auto-populate-vault-v2)
      setCurrentPhase('📊 Extracting quantified achievements and skills...');
      updateCategoryStatus('power_phrases', 'extracting');
      updateCategoryStatus('transferable_skills', 'extracting');
      updateCategoryStatus('hidden_competencies', 'extracting');
      updateCategoryStatus('soft_skills', 'extracting');

      const { data: coreData, error: coreError } = await supabase.functions.invoke('auto-populate-vault-v2', {
        body: {
          resumeText,
          vaultId,
          targetRoles,
          targetIndustries,
          industryResearch: industryResearch?.[0]?.results, // Use first research result
        },
      });

      if (coreError) throw coreError;
      if (!coreData.success) throw new Error(coreData.error || 'Extraction failed');

      const coreBreakdown = coreData.data.breakdown;

      updateCategoryStatus('power_phrases', 'complete', coreBreakdown.powerPhrases);
      updateCategoryStatus('transferable_skills', 'complete', coreBreakdown.transferableSkills);
      updateCategoryStatus('hidden_competencies', 'complete', coreBreakdown.hiddenCompetencies);
      updateCategoryStatus('soft_skills', 'complete', coreBreakdown.softSkills);

      setOverallProgress(50);
      setCurrentPhase('🌟 Extracting leadership intelligence and executive presence...');

      // Phase 2: Extract intangibles (leadership, presence, personality, values)
      updateCategoryStatus('leadership', 'extracting');
      updateCategoryStatus('executive_presence', 'extracting');
      updateCategoryStatus('personality', 'extracting');
      updateCategoryStatus('values', 'extracting');

      const { data: intangiblesData, error: intangiblesError } = await supabase.functions.invoke('extract-vault-intangibles', {
        body: {
          resumeText,
          vaultId,
          existingVaultData: {
            powerPhrases: [], // Would be populated from DB in real scenario
            skills: [],
            competencies: [],
          },
        },
      });

      if (intangiblesError) throw intangiblesError;
      if (!intangiblesData.success) throw new Error(intangiblesData.error || 'Intangibles extraction failed');

      const intangiblesBreakdown = intangiblesData.data.breakdown;

      updateCategoryStatus('leadership', 'complete', intangiblesBreakdown.leadershipPhilosophy);
      updateCategoryStatus('executive_presence', 'complete', intangiblesBreakdown.executivePresence);
      updateCategoryStatus('personality', 'complete', intangiblesBreakdown.personalityTraits);
      updateCategoryStatus('values', 'complete', intangiblesBreakdown.valuesMotivations);

      setOverallProgress(90);
      setCurrentPhase('🎯 Calculating vault strength and quality distribution...');

      // Calculate totals
      const total = coreData.data.totalItems + intangiblesData.data.totalIntangibles;
      const strength = coreData.data.vaultStrength;

      setTotalItems(total);
      setVaultStrength(strength);
      setOverallProgress(100);
      setCurrentPhase('✅ Extraction complete!');
      setIsComplete(true);

      toast({
        title: '🎉 Intelligence Extraction Complete!',
        description: `Extracted ${total} insights across ${categories.length} categories.`,
      });

      // Auto-advance after showing results
      setTimeout(() => {
        onComplete({
          totalItems: total,
          vaultStrength: strength,
          breakdown: {
            ...coreBreakdown,
            ...intangiblesBreakdown,
          },
        });
      }, 3000);

    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'Extraction failed');
      toast({
        title: 'Extraction Failed',
        description: err.message || 'Could not complete extraction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const completedCategories = categories.filter(c => c.status === 'complete').length;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600" />
          Extracting Career Intelligence
        </CardTitle>
        <CardDescription>
          Deep analysis across {categories.length} intelligence categories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marketing message */}
        <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-slate-700">
            <strong className="text-purple-700">Deep Intelligence Extraction:</strong> We're extracting
            insights that go <strong>far beyond what's written on your resume</strong>—including hidden
            competencies you didn't realize you demonstrated, behavioral patterns that predict success,
            and executive presence indicators.
            <strong className="block mt-1 text-pink-700">
              No other platform performs this level of analysis.
            </strong>
          </AlertDescription>
        </Alert>

        {/* Overall Progress */}
        {!isComplete && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="relative mx-auto w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse opacity-40"></div>
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-24 h-24 flex items-center justify-center shadow-2xl">
                  <Brain className="w-12 h-12 text-white animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {currentPhase}
                </h3>
                <p className="text-slate-600">
                  {completedCategories} of {categories.length} categories complete
                </p>
              </div>

              <Progress value={overallProgress} className="max-w-md mx-auto h-3" />

              <div className="text-sm font-medium text-purple-600">
                {overallProgress}% Complete
              </div>
            </div>

            {/* Category Progress Grid */}
            <div className="grid md:grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const colorClasses = {
                  amber: 'border-amber-200 bg-amber-50 text-amber-900',
                  blue: 'border-blue-200 bg-blue-50 text-blue-900',
                  purple: 'border-purple-200 bg-purple-50 text-purple-900',
                  green: 'border-green-200 bg-green-50 text-green-900',
                  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
                  pink: 'border-pink-200 bg-pink-50 text-pink-900',
                  rose: 'border-rose-200 bg-rose-50 text-rose-900',
                  violet: 'border-violet-200 bg-violet-50 text-violet-900',
                };

                return (
                  <div
                    key={category.key}
                    className={`border rounded-lg p-3 transition-all ${
                      category.status === 'complete'
                        ? colorClasses[category.color as keyof typeof colorClasses]
                        : category.status === 'extracting'
                        ? 'border-slate-300 bg-slate-50 text-slate-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {category.status === 'extracting' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : category.status === 'complete' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      {category.status === 'complete' ? (
                        <Badge variant="outline" className="text-xs">
                          {category.itemCount} found
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-500">{category.targetCount}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fun extraction facts */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">What's happening?</p>
                  <p className="text-sm text-blue-800">
                    Our AI is reading your resume multiple times—each pass extracts different
                    types of intelligence. We're looking for explicit achievements, implied
                    capabilities, behavioral patterns, and executive presence indicators.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completion Summary */}
        {isComplete && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">
                    Extraction Complete! 🎉
                  </h3>
                  <p className="text-sm text-green-700">
                    We've extracted <strong>{totalItems} insights</strong> across{' '}
                    {categories.length} intelligence categories. Your vault is now{' '}
                    <strong>{vaultStrength}% complete</strong>.
                  </p>
                </div>
              </div>

              {/* Category breakdown */}
              <div className="grid md:grid-cols-4 gap-3">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div key={category.key} className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-slate-600" />
                        <span className="text-xs text-slate-600">{category.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{category.itemCount}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vault Strength Meter */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">Vault Strength</h4>
                <Badge variant="outline" className="bg-white">
                  {vaultStrength}%
                </Badge>
              </div>
              <Progress value={vaultStrength} className="h-4 mb-2" />
              <p className="text-sm text-slate-600">
                {vaultStrength >= 85
                  ? '🏆 Excellent! Your vault is at professional-grade strength.'
                  : vaultStrength >= 70
                  ? '✨ Good progress! A few more questions will get you to 85%+.'
                  : '📈 Solid foundation! We\'ll boost this with targeted questions next.'}
              </p>
            </div>

            <Alert className="border-purple-200 bg-purple-50">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-900">
                <strong>Next:</strong> Review and verify the extracted insights. We'll prioritize
                items that need your attention and auto-approve high-confidence items. This takes
                just 5-8 minutes thanks to smart batch operations.
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

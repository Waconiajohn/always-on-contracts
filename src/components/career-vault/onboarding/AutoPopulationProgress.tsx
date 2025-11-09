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

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Sparkles,
  Award,
  Target,
  Users,
  Lightbulb,
  CheckCircle2,
  Loader2,
  Zap,
  Activity
} from 'lucide-react';
import { useSupabaseClient } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { validateInput, invokeEdgeFunction, AutoPopulateVaultSchema } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';

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

interface ActivityLogItem {
  id: string;
  timestamp: Date;
  category: string;
  content: string;
  type: 'power_phrase' | 'skill' | 'competency' | 'soft_skill';
  quality_tier?: string;
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
    { key: 'power_phrases', label: 'Power Phrases', icon: Award, color: 'amber', status: 'pending', itemCount: 0, targetCount: '12-20' },
    { key: 'transferable_skills', label: 'Transferable Skills', icon: Target, color: 'blue', status: 'pending', itemCount: 0, targetCount: '15-25' },
    { key: 'hidden_competencies', label: 'Hidden Competencies', icon: Lightbulb, color: 'purple', status: 'pending', itemCount: 0, targetCount: '8-15' },
    { key: 'soft_skills', label: 'Soft Skills', icon: Users, color: 'green', status: 'pending', itemCount: 0, targetCount: '10-18' },
  ]);

  const [totalItems, setTotalItems] = useState(0);
  const [vaultStrength, setVaultStrength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const activityLogRef = useRef<HTMLDivElement>(null);

  const supabase = useSupabaseClient();
  const { toast } = useToast();

  // Auto-scroll activity log to bottom
  useEffect(() => {
    if (activityLogRef.current) {
      activityLogRef.current.scrollTop = activityLogRef.current.scrollHeight;
    }
  }, [activityLog]);

  // Real-time subscription to vault data insertions
  useEffect(() => {
    if (isComplete) return;

    const channel = supabase
      .channel('extraction-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vault_power_phrases',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload: any) => {
          const newItem: ActivityLogItem = {
            id: payload.new.id,
            timestamp: new Date(),
            category: 'Power Phrase',
            content: payload.new.power_phrase,
            type: 'power_phrase',
            quality_tier: payload.new.quality_tier
          };
          setActivityLog(prev => [...prev, newItem]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vault_transferable_skills',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload: any) => {
          const newItem: ActivityLogItem = {
            id: payload.new.id,
            timestamp: new Date(),
            category: 'Transferable Skill',
            content: payload.new.stated_skill,
            type: 'skill',
            quality_tier: payload.new.quality_tier
          };
          setActivityLog(prev => [...prev, newItem]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vault_hidden_competencies',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload: any) => {
          const newItem: ActivityLogItem = {
            id: payload.new.id,
            timestamp: new Date(),
            category: 'Hidden Competency',
            content: payload.new.inferred_capability,
            type: 'competency',
            quality_tier: payload.new.quality_tier
          };
          setActivityLog(prev => [...prev, newItem]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vault_soft_skills',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload: any) => {
          const newItem: ActivityLogItem = {
            id: payload.new.id,
            timestamp: new Date(),
            category: 'Soft Skill',
            content: payload.new.skill_name,
            type: 'soft_skill',
            quality_tier: payload.new.quality_tier
          };
          setActivityLog(prev => [...prev, newItem]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vaultId, isComplete, supabase]);

  // Poll vault completion percentage during extraction
  useEffect(() => {
    if (isComplete) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: vault } = await supabase
          .from('career_vault')
          .select('review_completion_percentage')
          .eq('id', vaultId)
          .maybeSingle();

        if (vault?.review_completion_percentage !== undefined && vault.review_completion_percentage !== null) {
          setCompletionPercentage(Math.round(vault.review_completion_percentage * 100));
        }
        } catch (err) {
          logger.error('Error polling completion', err);
        }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [vaultId, isComplete, supabase]);

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

      // Phase 1: Extract core achievements and skills (auto-populate-vault-v3)
      setCurrentPhase('📊 Extracting quantified achievements and skills...');
      updateCategoryStatus('power_phrases', 'extracting');
      updateCategoryStatus('transferable_skills', 'extracting');
      updateCategoryStatus('hidden_competencies', 'extracting');
      updateCategoryStatus('soft_skills', 'extracting');

      const validated = validateInput(AutoPopulateVaultSchema, {
        resumeText,
        vaultId,
        targetRoles,
        targetIndustries
      });

      const { data: coreData, error: coreError } = await invokeEdgeFunction(
        supabase,
        'auto-populate-vault-v3',
        {
          ...validated,
          industryResearch: industryResearch?.[0]?.results
        }
      );

      if (coreError || !coreData?.success) {
        throw new Error(coreError?.message || coreData?.error || 'Extraction failed');
      }

      const extracted = coreData.data.extracted;

      updateCategoryStatus('power_phrases', 'complete', extracted.powerPhrasesCount);
      updateCategoryStatus('transferable_skills', 'complete', extracted.skillsCount);
      updateCategoryStatus('hidden_competencies', 'complete', extracted.competenciesCount);
      updateCategoryStatus('soft_skills', 'complete', extracted.softSkillsCount);

      setOverallProgress(90);
      setCurrentPhase('🎯 Calculating vault strength and quality distribution...');

      // Calculate totals (only 4 categories now)
      const total = extracted.total;
      const strength = Math.min(100, (extracted.total * 2) + (extracted.powerPhrasesCount * 3));

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
            powerPhrases: extracted.powerPhrasesCount,
            transferableSkills: extracted.skillsCount,
            hiddenCompetencies: extracted.competenciesCount,
            softSkills: extracted.softSkillsCount,
          },
        });
      }, 3000);

    } catch (err: any) {
      logger.error('Extraction error', err);
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

        {/* Overall Progress - ALWAYS VISIBLE during extraction */}
        {!isComplete && (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              {/* Animated pulsing loader with throbbing brain */}
              <div className="relative mx-auto w-28 h-28">
                {/* Outer ping ring - slower, more visible throb */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-30 animate-ping"></div>
                {/* Middle pulse ring */}
                <div className="absolute inset-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-50 animate-pulse"></div>
                {/* Inner solid circle with BRAIN icon */}
                <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-28 h-28 flex items-center justify-center shadow-2xl">
                  <Brain className="w-14 h-14 text-white animate-pulse" />
                </div>
              </div>

              {/* Real-time percentage counter */}
              <div className="space-y-2">
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  {completionPercentage}%
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Extraction Progress
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

            {/* Real-time Activity Feed */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-slate-900">Live Extraction Feed</h4>
                  <Badge variant="outline" className="ml-auto">
                    {activityLog.length} insights
                  </Badge>
                </div>
              </div>
              
              <ScrollArea className="h-[300px]">
                <div ref={activityLogRef} className="p-4 space-y-3">
                  {activityLog.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
                      <p className="text-sm">Waiting for first insights...</p>
                    </div>
                  ) : (
                    activityLog.map((item, index) => {
                      const iconMap = {
                        power_phrase: Award,
                        skill: Target,
                        competency: Lightbulb,
                        soft_skill: Users
                      };
                      const colorMap = {
                        power_phrase: 'text-amber-600 bg-amber-50 border-amber-200',
                        skill: 'text-blue-600 bg-blue-50 border-blue-200',
                        competency: 'text-purple-600 bg-purple-50 border-purple-200',
                        soft_skill: 'text-green-600 bg-green-50 border-green-200'
                      };
                      const Icon = iconMap[item.type];
                      
                      return (
                        <div
                          key={item.id}
                          className={`flex gap-3 p-3 rounded-lg border animate-in fade-in slide-in-from-bottom-2 duration-300 ${colorMap[item.type]}`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold uppercase tracking-wide">
                                {item.category}
                              </span>
                              {item.quality_tier && (
                                <Badge variant="outline" className="text-xs py-0 h-4">
                                  {item.quality_tier}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-900 leading-relaxed">
                              {item.content}
                            </p>
                            <span className="text-xs text-slate-500 mt-1 block">
                              {item.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
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

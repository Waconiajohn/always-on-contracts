// =====================================================
// CAREER VAULT ONBOARDING - Career Vault 2.0
// =====================================================
// The COMPLETE, DEFINITIVE onboarding experience
//
// This is the single source of truth for Career Vault
// onboarding - combining the best of all previous
// approaches into ONE streamlined, intelligent flow.
//
// UNIQUE VALUE MESSAGING at every step:
// - "No other platform does this level of analysis"
// - Real-time progress with vault strength scoring
// - Educational tooltips explaining the "why"
// - Celebration of achievements
// =====================================================

import { useState, useEffect } from 'react';
import { useUser, useSupabaseClient } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, TrendingUp, Target, Brain, CheckCircle2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CareerVaultErrorBoundary } from '@/components/ErrorBoundary';
import { OnboardingData } from '@/types/career-vault';
import { useOnboardingAutoSave } from '@/hooks/useAutoSave';

// Step components (to be created)
import ResumeAnalysisStep from '@/components/career-vault/onboarding/ResumeAnalysisStep';
import CareerDirectionStep from '@/components/career-vault/onboarding/CareerDirectionStep';
import IndustryResearchProgress from '@/components/career-vault/onboarding/IndustryResearchProgress';
import AutoPopulationProgress from '@/components/career-vault/onboarding/AutoPopulationProgress';
import SmartReviewWorkflow from '@/components/career-vault/onboarding/SmartReviewWorkflow';
import GapFillingQuestionsFlow from '@/components/career-vault/onboarding/GapFillingQuestionsFlow';
import VaultCompletionSummary from '@/components/career-vault/onboarding/VaultCompletionSummary';

// UI step type (different from database OnboardingStep)
type UIStep =
  | 'upload'
  | 'analysis'
  | 'direction'
  | 'research'
  | 'extraction'
  | 'review'
  | 'gaps'
  | 'complete';

export default function CareerVaultOnboarding() {
  const [currentStep, setCurrentStep] = useState<UIStep>('upload');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const { toast } = useToast();

  // Auto-save progress
  const saveStatus = useOnboardingAutoSave(onboardingData.vaultId, currentStep);

  // Check if resuming existing onboarding
  useEffect(() => {
    const checkExistingVault = async () => {
      if (!user) return;

      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingVault && existingVault.onboarding_step !== 'onboarding_complete') {
        const dbStep = existingVault.onboarding_step;

        // Map onboarding step to UI step (handles both old and new naming conventions)
        const stepMap: Record<string, UIStep> = {
          'not_started': 'upload',
          'resume_upload': 'upload',          // Backwards compatibility for incomplete uploads
          'resume_uploaded': 'analysis',
          'analysis_complete': 'direction',
          'targets_set': 'research',
          'research_complete': 'extraction',
          'auto_population_complete': 'review',
          'review_complete': 'gaps',
        };

        const mappedStep = (dbStep && stepMap[dbStep]) || 'upload';

        // Check for incomplete analysis state (resume uploaded but analysis failed/incomplete)
        const hasResumeText = existingVault.resume_raw_text && existingVault.resume_raw_text.length > 100;
        const hasAnalysis = existingVault.initial_analysis && Object.keys(existingVault.initial_analysis).length > 0;

        // Check completion indicators to determine actual step
        const reviewCompletion = existingVault.review_completion_percentage || 0;
        const hasVaultData = existingVault.vault_strength_after_qa || existingVault.vault_strength_before_qa;
        const hasTargets = existingVault.target_roles && existingVault.target_industries;
        
        // Determine actual step based on what's completed, not just onboarding_step
        let actualStep = mappedStep;
        
        if (reviewCompletion >= 1) {
          // Review is 100% complete - skip to gaps
          actualStep = 'gaps';
        } else if (hasVaultData) {
          // Has vault data - should be on review
          actualStep = 'review';
        } else if (hasTargets && hasAnalysis) {
          // Has career direction set - should be on research or beyond
          if (mappedStep === 'upload' || mappedStep === 'analysis' || mappedStep === 'direction') {
            actualStep = 'research';
          }
        }

        // Only restore data and show "Welcome Back" if there's actual progress
        // (not_started means they haven't uploaded a resume yet)
        if (dbStep && dbStep !== 'not_started') {
          
          // SMART DETECTION: If we have resume text but no analysis, resume from analysis step
          if (hasResumeText && !hasAnalysis && (dbStep === 'resume_upload' || dbStep === 'resume_uploaded')) {
            setOnboardingData({
              vaultId: existingVault.id,
              resumeText: existingVault.resume_raw_text || undefined,
              // Don't set initialAnalysis - let ResumeAnalysisStep show the trigger UI
            });
            setCurrentStep('analysis'); // Force to analysis step
            
            toast({
              title: '📄 Resume Found',
              description: 'Your resume is saved. Complete the AI analysis to continue.',
              duration: 4000,
            });
            return; // Exit early to prevent showing "Welcome Back" message
          }
          
          // Normal flow: We have both resume and analysis
          setOnboardingData({
            vaultId: existingVault.id,
            resumeText: existingVault.resume_raw_text || undefined,
            initialAnalysis: existingVault.initial_analysis as any, // JSON type from DB
            careerDirection: existingVault.career_direction as 'stay' | 'pivot' | 'explore' | undefined,
            targetRoles: existingVault.target_roles || undefined,
            targetIndustries: existingVault.target_industries || undefined,
            vaultStrength: existingVault.vault_strength_after_qa || existingVault.vault_strength_before_qa || undefined
          });

          // Use actualStep instead of mappedStep to skip completed phases
          setCurrentStep(actualStep);

          const stepLabels: Record<UIStep, string> = {
            upload: 'Upload Resume',
            analysis: 'AI Analysis',
            direction: 'Career Direction',
            research: 'Market Research',
            extraction: 'Intelligence Extraction',
            review: 'Vault Review',
            gaps: 'Gap Analysis',
            complete: 'Complete'
          };

          toast({
            title: '🔄 Welcome Back!',
            description: `Continuing from: ${stepLabels[actualStep]}`,
          });
        } else {
          // Just set the vaultId for reuse, but start fresh at upload step
          setOnboardingData({
            vaultId: existingVault.id,
          });
          setCurrentStep('upload');
        }
      }
    };

    checkExistingVault();
  }, [user, toast]);

  // Step configuration with marketing messages
  const steps = [
    {
      key: 'upload',
      label: 'Upload Resume',
      icon: Sparkles,
      description: 'Instant AI analysis',
      marketingHook: 'Unlike basic parsers, we understand executive careers'
    },
    {
      key: 'direction',
      label: 'Career Direction',
      icon: Target,
      description: 'Personalized path',
      marketingHook: 'AI suggests opportunities you never considered'
    },
    {
      key: 'research',
      label: 'Market Research',
      icon: TrendingUp,
      description: 'Live industry data',
      marketingHook: 'Real-time intelligence from Perplexity AI'
    },
    {
      key: 'extraction',
      label: 'Intelligence Extraction',
      icon: Brain,
      description: '150-250 insights',
      marketingHook: 'Deep analysis no other platform can match'
    },
    {
      key: 'review',
      label: 'Smart Review',
      icon: CheckCircle2,
      description: '5-minute verification',
      marketingHook: 'Batch operations save 20+ minutes'
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep ||
    (currentStep === 'analysis' && s.key === 'upload') ||
    (currentStep === 'gaps' && s.key === 'review') ||
    (currentStep === 'complete' && s.key === 'review')
  );

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  // Update onboarding data from step completion
  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  // Render current step component with guards to prevent flashing
  const renderStep = () => {
    // Ensure we have required data before rendering steps that need it
    if (currentStep === 'extraction' && !onboardingData.vaultId) {
      return null; // Prevent flash by not rendering until data is ready
    }
    
    if (currentStep === 'review' && !onboardingData.vaultId) {
      return null;
    }
    
    switch (currentStep) {
      case 'upload':
      case 'analysis':
        return (
          <ResumeAnalysisStep
            onComplete={(data) => {
              updateOnboardingData(data);
              setCurrentStep('direction');
            }}
            existingData={onboardingData}
          />
        );

      case 'direction':
        return (
          <CareerDirectionStep
            onComplete={(data) => {
              updateOnboardingData(data);
              setCurrentStep('research');
            }}
            initialAnalysis={onboardingData.initialAnalysis}
            vaultId={onboardingData.vaultId || ''}
          />
        );

      case 'research':
        return (
          <IndustryResearchProgress
            vaultId={onboardingData.vaultId || ''}
            targetRoles={onboardingData.targetRoles || []}
            targetIndustries={onboardingData.targetIndustries || []}
            careerDirection={onboardingData.careerDirection || 'stay'}
            onComplete={(researchData) => {
              updateOnboardingData({ industryResearch: researchData });
              setCurrentStep('extraction');
            }}
          />
        );

      case 'extraction':
        return (
          <AutoPopulationProgress
            vaultId={onboardingData.vaultId || ''}
            resumeText={onboardingData.resumeText || ''}
            targetRoles={onboardingData.targetRoles || []}
            targetIndustries={onboardingData.targetIndustries || []}
            industryResearch={onboardingData.industryResearch}
            onComplete={(extractedData) => {
              updateOnboardingData({
                extractedData,
                vaultStrength: extractedData.vaultStrength
              });
              setCurrentStep('review');
            }}
          />
        );

      case 'review':
        return (
          <SmartReviewWorkflow
            vaultId={onboardingData.vaultId!}
            initialVaultStrength={onboardingData.vaultStrength || 0}
            onComplete={(reviewData) => {
              updateOnboardingData({ vaultStrength: reviewData.newVaultStrength });

              // ALWAYS go to gap questions - let user decide to skip
              // Gap questions are smart and won't ask about confirmed data
              setCurrentStep('gaps');
            }}
            onSkip={() => {
              // Skip to completion
              setCurrentStep('complete');
            }}
          />
        );

      case 'gaps':
        return (
          <GapFillingQuestionsFlow
            vaultId={onboardingData.vaultId!}
            currentVaultStrength={onboardingData.vaultStrength || 0}
            industryResearch={onboardingData.industryResearch}
            onComplete={(gapData) => {
              updateOnboardingData({ vaultStrength: gapData.newVaultStrength });
              setCurrentStep('complete');
            }}
            onSkip={() => {
              setCurrentStep('complete');
            }}
          />
        );

      case 'complete':
        return (
          <VaultCompletionSummary
            vaultId={onboardingData.vaultId!}
            finalVaultStrength={onboardingData.vaultStrength || 0}
            targetRoles={onboardingData.targetRoles || []}
            targetIndustries={onboardingData.targetIndustries || []}
          />
        );

      default:
        return null;
    }
  };

  return (
    <CareerVaultErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Career Vault 2.0: Executive Intelligence Platform
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Build Your Career Intelligence
          </h1>

          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            AI-powered analysis that goes deeper than any resume tool.
            We extract <span className="font-semibold text-blue-600">150-250 insights</span> that
            power your resumes, LinkedIn, and interview prep.
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 p-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Step {currentStepIndex + 1} of {steps.length}
              </span>
              <div className="flex items-center gap-3">
                {/* Auto-save status indicator */}
                {saveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-blue-600 text-xs">
                    <Save className="w-3 h-3 animate-pulse" />
                    Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-green-600 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Saved
                  </span>
                )}
                <span className="text-slate-600">
                  {onboardingData.vaultStrength
                    ? `Vault Strength: ${onboardingData.vaultStrength}%`
                    : 'Starting your journey...'}
                </span>
              </div>
            </div>

            <Progress value={progressPercentage} className="h-2" />

            {/* Step indicators */}
            <div className="grid grid-cols-5 gap-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isComplete = index < currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className={`text-center transition-all ${
                      isActive
                        ? 'scale-105'
                        : isComplete
                        ? 'opacity-60'
                        : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                        isActive
                          ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                          : isComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      {step.label}
                    </div>
                    {isActive && (
                      <div className="text-xs text-blue-600 mt-1">
                        {step.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Marketing hook for current step */}
            {steps[currentStepIndex] && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 border border-blue-100">
                <p className="text-sm text-slate-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    <strong className="text-blue-700">What makes us different:</strong>{' '}
                    {steps[currentStepIndex].marketingHook}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Current Step Component */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-500">
          <p>
            💡 Your progress is automatically saved. Feel free to take a break and return anytime.
          </p>
        </div>
      </div>
    </div>
    </CareerVaultErrorBoundary>
  );
}

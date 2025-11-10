import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Target, Brain, CheckCircle, Sparkles, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction, ParseResumeMilestonesSchema, safeValidateInput } from '@/lib/edgeFunction';
import { logger } from '@/lib/logger';
import { ResumeUploadCard } from '@/components/career-vault/ResumeUploadCard';
import { CareerGoalsStep } from '@/components/career-vault/CareerGoalsStep';
import { AutoPopulateStep } from '@/components/career-vault/AutoPopulateStep';
import { VaultReviewInterface } from '@/components/career-vault/VaultReviewInterface';
import { VoiceNoteRecorder } from '@/components/career-vault/VoiceNoteRecorder';
import { CompetencyQuizEngine } from '@/components/career-vault/CompetencyQuizEngine';
import { CompetencyQuizResults } from '@/components/career-vault/CompetencyQuizResults';
import { Button } from '@/components/ui/button';
import { VaultDuplicationDialog } from '@/components/career-vault/VaultDuplicationDialog';
import { useOnboardingTour, OnboardingStep as TourStep } from '@/hooks/useOnboardingTour';
import { OnboardingTooltip } from '@/components/ui/onboarding-tooltip';
import { HelpCircle } from 'lucide-react';

type OnboardingStep = 'upload' | 'goals' | 'auto-populate' | 'review' | 'quiz' | 'quiz-results' | 'enhance' | 'complete';

/**
 * CAREER VAULT ONBOARDING - ENHANCED
 *
 * New streamlined flow:
 * 1. Upload resume (2 min)
 * 2. Set career goals (2 min)
 * 3. AI auto-populates vault (1 min)
 * 4. User reviews/validates (5-10 min)
 * 5. Competency quiz (5-10 min)
 * 6. Review quiz results with percentile scores
 * 7. Optional: Voice notes for gaps (5 min)
 * TOTAL: 15-30 minutes vs 45-60 minutes with old interview
 */
const CareerVaultOnboardingEnhanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [quizResults, setQuizResults] = useState<any>(null);
  const hasCheckedVault = useRef(false);
  const [showDuplicationDialog, setShowDuplicationDialog] = useState(false);
  const [existingVaultData, setExistingVaultData] = useState<any>(null);

  const tourSteps: TourStep[] = [
    {
      id: 'upload',
      target: 'upload-card',
      title: '📄 Upload Your Resume',
      content: 'Start by uploading your resume. We support PDF, DOCX, and TXT formats. Our AI will extract your career intelligence in seconds.',
      placement: 'bottom'
    },
    {
      id: 'goals',
      target: 'goals-card',
      title: '🎯 Set Career Goals',
      content: 'Tell us about your target roles and industries. This helps us tailor your vault to match your career aspirations.',
      placement: 'bottom'
    },
    {
      id: 'ai-analysis',
      target: 'ai-analysis-card',
      title: '🧠 AI Extraction',
      content: 'Watch as our AI analyzes your resume and extracts power phrases, skills, competencies, and more into structured categories.',
      placement: 'bottom'
    },
    {
      id: 'review',
      target: 'review-card',
      title: '✅ Review & Validate',
      content: 'Review the extracted intelligence. You can edit, add, or remove items to ensure everything is accurate and complete.',
      placement: 'bottom'
    },
    {
      id: 'quiz',
      target: 'quiz-card',
      title: '📝 Competency Assessment',
      content: 'Complete a quick quiz to verify your skills and build a competency profile. This improves matching accuracy for job applications.',
      placement: 'bottom'
    }
  ];

  const tour = useOnboardingTour('career-vault-onboarding', tourSteps);

  const steps = [
    { id: 'upload', label: 'Upload Resume', icon: Upload },
    { id: 'goals', label: 'Career Goals', icon: Target },
    { id: 'auto-populate', label: 'AI Analysis', icon: Brain },
    { id: 'review', label: 'Review', icon: Sparkles },
    { id: 'quiz', label: 'Assessment', icon: ClipboardCheck },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    // Only check on initial mount
    if (hasCheckedVault.current) return;
    hasCheckedVault.current = true;

    const checkExistingVault = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: existingVault } = await supabase
          .from('career_vault')
          .select('*')
          .eq('user_id', user.id)
          .single();

      if (existingVault) {
        setVaultId(existingVault.id);
        setExistingVaultData(existingVault);

        // Note: Removed auto-redirect logic. Users can access vault even if interview is complete
        // because they may need to verify assumed items or improve vault quality.
      }
      } catch (error) {
        logger.error('Error checking vault', error);
      }
    };

    checkExistingVault();
  }, [navigate, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const handleUpload = async (bypassDuplicationCheck: boolean = false) => {
    if (!resumeFile) return;

    // Check for existing vault before upload (unless bypassing)
    if (existingVaultData && !bypassDuplicationCheck) {
      console.log('[UPLOAD] Existing vault detected, showing duplication dialog');
      setShowDuplicationDialog(true);
      return;
    }

    console.log('[UPLOAD] Starting upload process', { bypassDuplicationCheck });
    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Read file
      let fileData = '';
      let fileText = '';

      if (resumeFile.type === 'text/plain') {
        fileText = await resumeFile.text();
      } else {
        const arrayBuffer = await resumeFile.arrayBuffer();
        fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      }

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
      await supabase.storage.from('resumes').upload(filePath, resumeFile);

      // Process resume
      const { data: processData, error } = await invokeEdgeFunction(
        'process-resume',
        {
          ...(fileData ? { fileData } : { fileText }),
          fileName: resumeFile.name,
          fileSize: resumeFile.size,
          fileType: resumeFile.type,
          userId: user.id
        }
      );

      if (error || !processData.success) {
        throw new Error(processData?.error || 'Failed to process resume');
      }

      // Create or update vault with extraction metadata
      const extractionRunId = `extract_${Date.now()}_${user.id.slice(0, 8)}`;
      const { data: vaultData } = await supabase
        .from('career_vault')
        .upsert({
          user_id: user.id,
          resume_raw_text: processData.extractedText,
          initial_analysis: processData.analysis || {},
          extraction_run_id: extractionRunId,
          extraction_timestamp: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (vaultData) {
        setVaultId(vaultData.id);
        setResumeText(processData.extractedText);
        setResumeAnalysis(processData.analysis || {});
        
        // Parse resume into structured milestones (once)
        try {
          logger.info('[MILESTONE_PARSE] Starting milestone extraction');
          
          const milestoneData = {
            resume_text: processData.extractedText
          };

          const validation = safeValidateInput(ParseResumeMilestonesSchema, milestoneData);
          if (!validation.success) {
            logger.error('[MILESTONE_PARSE] Validation failed');
          } else {
            const { data: milestonesData, error: milestonesError } = await invokeEdgeFunction(
              'parse-resume-milestones',
              milestoneData
            );
            
            if (milestonesError) {
              logger.error('[MILESTONE_PARSE] Error', milestonesError);
              // Don't block the flow - user can still proceed
            } else {
              const count = milestonesData?.milestones?.length || 0;
              logger.info(`[MILESTONE_PARSE] Success: Extracted ${count} career milestones`);
            }
          }
        } catch (milestoneErr) {
          logger.error('[MILESTONE_PARSE] Exception', milestoneErr);
          // Continue anyway - milestones enhance the experience but aren't critical for onboarding
        }
      }

      toast({
        title: 'Resume Uploaded!',
        description: 'Now let\'s set your career goals'
      });

      setCurrentStep('goals');
    } catch (error: any) {
      logger.error('[UPLOAD] Error', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReplaceVault = async () => {
    console.log('[REPLACE] User confirmed vault replacement');
    setShowDuplicationDialog(false);
    
    // Call handleUpload with bypass flag to skip duplication check
    await handleUpload(true);
  };

  const handleGoalsComplete = async (goalsData: { target_roles: string[]; target_industries: string[] }) => {
    setTargetRoles(goalsData.target_roles);
    setTargetIndustries(goalsData.target_industries);

    // Save goals to profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({
          target_roles: goalsData.target_roles,
          target_industries: goalsData.target_industries
        })
        .eq('user_id', user.id);

      // Update vault
      if (vaultId) {
        await supabase
          .from('career_vault')
          .update({
            target_roles: goalsData.target_roles,
            target_industries: goalsData.target_industries
          })
          .eq('id', vaultId);
      }
    }

    setCurrentStep('auto-populate');
  };

  const handleAutoPopulateComplete = (data: any) => {
    console.log('[ONBOARDING] Auto-populate complete! Received data:', data);
    console.log('[ONBOARDING] Extracted data:', data.extractedData);
    
    if (data.useManualInterview) {
      console.log('[ONBOARDING] Falling back to manual interview');
      navigate('/career-vault-onboarding');
      return;
    }

    // Extract the actual intelligence data from the response
    const extractedDataToUse = data.extractedData || data;
    console.log('[ONBOARDING] Setting extracted data for review:', extractedDataToUse);
    setExtractedData(extractedDataToUse);
    setCurrentStep('review');
  };

  const handleReviewComplete = () => {
    setCurrentStep('quiz');

    toast({
      title: 'Vault Reviewed!',
      description: 'Now let\'s assess your competencies'
    });
  };

  const handleQuizComplete = (results: any) => {
    console.log('[QUIZ] Quiz completed! Results:', results);

    setQuizResults(results);
    setCurrentStep('quiz-results');

    toast({
      title: 'Competency Assessment Complete!',
      description: `Identified ${results.competenciesIdentified} competencies with ${results.completionPercentage.toFixed(0)}% completion`
    });
  };

  const handleQuizResultsContinue = () => {
    setCurrentStep('complete');
  };

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Build Your Career Vault</h1>
          <p className="text-muted-foreground">
            AI extracts your career intelligence in 10-15 minutes
          </p>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 transition-all ${
                idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <step.icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Help Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => tour.resetTour()}
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          Show Guide
        </Button>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <OnboardingTooltip
          isOpen={tour.isActive && tour.stepIndex === 0}
          title={tour.currentStep?.title || ''}
          content={tour.currentStep?.content || ''}
          stepIndex={tour.stepIndex}
          totalSteps={tour.totalSteps}
          placement={tour.currentStep?.placement}
          onNext={tour.nextStep}
          onPrevious={tour.previousStep}
          onSkip={tour.skipTour}
        >
          <div id="upload-card">
            <ResumeUploadCard
              resumeFile={resumeFile}
              isUploading={isUploading}
              onFileSelect={handleFileSelect}
              onUpload={handleUpload}
            />
          </div>
        </OnboardingTooltip>
      )}

      {currentStep === 'goals' && (
        <OnboardingTooltip
          isOpen={tour.isActive && tour.stepIndex === 1}
          title={tour.currentStep?.title || ''}
          content={tour.currentStep?.content || ''}
          stepIndex={tour.stepIndex}
          totalSteps={tour.totalSteps}
          placement={tour.currentStep?.placement}
          onNext={tour.nextStep}
          onPrevious={tour.previousStep}
          onSkip={tour.skipTour}
        >
          <div id="goals-card">
            <CareerGoalsStep
              resumeAnalysis={resumeAnalysis}
              onComplete={handleGoalsComplete}
            />
          </div>
        </OnboardingTooltip>
      )}

      {currentStep === 'auto-populate' && vaultId && (
        <OnboardingTooltip
          isOpen={tour.isActive && tour.stepIndex === 2}
          title={tour.currentStep?.title || ''}
          content={tour.currentStep?.content || ''}
          stepIndex={tour.stepIndex}
          totalSteps={tour.totalSteps}
          placement={tour.currentStep?.placement}
          onNext={tour.nextStep}
          onPrevious={tour.previousStep}
          onSkip={tour.skipTour}
        >
          <div id="ai-analysis-card">
            <AutoPopulateStep
              vaultId={vaultId}
              resumeText={resumeText}
              targetRoles={targetRoles}
              targetIndustries={targetIndustries}
              onComplete={handleAutoPopulateComplete}
            />
          </div>
        </OnboardingTooltip>
      )}

      {currentStep === 'review' && vaultId && (
        <OnboardingTooltip
          isOpen={tour.isActive && tour.stepIndex === 3}
          title={tour.currentStep?.title || ''}
          content={tour.currentStep?.content || ''}
          stepIndex={tour.stepIndex}
          totalSteps={tour.totalSteps}
          placement={tour.currentStep?.placement}
          onNext={tour.nextStep}
          onPrevious={tour.previousStep}
          onSkip={tour.skipTour}
        >
          <div id="review-card">
            <VaultReviewInterface
              vaultId={vaultId}
              onComplete={handleReviewComplete}
            />
          </div>
        </OnboardingTooltip>
      )}

      {currentStep === 'quiz' && vaultId && (
        <OnboardingTooltip
          isOpen={tour.isActive && tour.stepIndex === 4}
          title={tour.currentStep?.title || ''}
          content={tour.currentStep?.content || ''}
          stepIndex={tour.stepIndex}
          totalSteps={tour.totalSteps}
          placement={tour.currentStep?.placement}
          onNext={tour.nextStep}
          onPrevious={tour.previousStep}
          onSkip={tour.skipTour}
        >
          <div id="quiz-card" className="space-y-6">
            <Card>
              <CardContent className="py-6">
                <div className="text-center mb-6">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h2 className="text-2xl font-bold mb-2">Competency Assessment</h2>
                  <p className="text-muted-foreground">
                    Answer questions about your experience to build a verified competency profile.
                    This helps us match you to roles with precision.
                  </p>
                </div>
              </CardContent>
            </Card>

            <CompetencyQuizEngine
              vaultId={vaultId}
              role={targetRoles[0] || 'Professional'}
              industry={targetIndustries[0] || 'General'}
              experienceLevel={resumeAnalysis?.yearsOfExperience || 5}
              onComplete={handleQuizComplete}
            />
          </div>
        </OnboardingTooltip>
      )}

      {currentStep === 'quiz-results' && vaultId && quizResults && (
        <CompetencyQuizResults
          vaultId={vaultId}
          role={targetRoles[0] || 'Professional'}
          industry={targetIndustries[0] || 'General'}
          onContinue={handleQuizResultsContinue}
        />
      )}

      {currentStep === 'enhance' && vaultId && (
        <div className="space-y-6">
          <Card>
            <CardContent className="py-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Want to Add More?</h2>
              <p className="text-muted-foreground mb-6">
                Your vault is at 85% power. You can use voice notes to fill any gaps.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('complete')}
                >
                  Skip - I'm Good
                </Button>
                <Button onClick={() => setCurrentStep('enhance')}>
                  Add Voice Notes
                </Button>
              </div>
            </CardContent>
          </Card>

          <VoiceNoteRecorder
            vaultId={vaultId}
            prompt="Tell me about a major achievement we might have missed"
            onComplete={() => {
              toast({
                title: 'Intelligence Added!',
                description: 'Voice note processed and added to your vault'
              });
            }}
          />
        </div>
      )}

      {currentStep === 'complete' && (
        <Card className="p-12 text-center max-w-3xl mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Onboarding Complete! 🎉</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Your Career Vault is built and ready to power resume generation and job applications
          </p>

          {/* Vault Strength Preview */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {extractedData?.totalExtracted || extractedData?.summary?.totalItemsExtracted || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Intelligence Items Extracted</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">
                {extractedData?.categories?.length || 20}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Categories Populated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">
                {extractedData?.vaultCompletion || 100}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Initial Setup</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Next Step:</strong> Visit the Vault Control Panel to review your strength scores and improve your vault quality.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/career-vault')} className="gap-2">
              <Sparkles className="h-5 w-5" />
              Go to Vault Control Panel
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/command-center')}>
              Command Center
            </Button>
          </div>
        </Card>
      )}

      {/* Vault Duplication Dialog */}
      <VaultDuplicationDialog
        open={showDuplicationDialog}
        onOpenChange={setShowDuplicationDialog}
        existingVault={existingVaultData}
        onReplace={handleReplaceVault}
        onCancel={() => setShowDuplicationDialog(false)}
      />
    </div>
  );
};

export default CareerVaultOnboardingEnhanced;

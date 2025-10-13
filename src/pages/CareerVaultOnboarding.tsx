import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, Sparkles, ArrowRight, RotateCcw, FileEdit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LinearCareerVaultInterview } from '@/components/LinearCareerVaultInterview';
import { CareerGoalsStep } from '@/components/career-vault/CareerGoalsStep';
import { ResumeUploadChoiceModal } from '@/components/career-vault/ResumeUploadChoiceModal';
import { ResumeUploadCard } from '@/components/career-vault/ResumeUploadCard';
import { ResumeManagementModal } from '@/components/career-vault/ResumeManagementModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';

type OnboardingStep = 'upload' | 'goals' | 'interview-decision' | 'interview' | 'complete';

const CareerVaultOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showResumeChoiceModal, setShowResumeChoiceModal] = useState(false);
  const [existingVaultStats, setExistingVaultStats] = useState<{
    completionPercentage: number;
    totalIntelligence: number;
    milestoneCount: number;
  } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showStartOverDialog, setShowStartOverDialog] = useState(false);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    { id: 'upload', label: 'Upload Resume', icon: Upload },
    { id: 'goals', label: 'Career Goals', icon: FileText },
    { id: 'interview-decision', label: 'Choose Power Level', icon: Sparkles },
    { id: 'interview', label: 'Intelligence Extraction', icon: Sparkles },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Check existing vault and determine starting step
  useEffect(() => {
    const checkExistingVault = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Check if career vault already exists
      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('id, interview_completion_percentage, resume_raw_text')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingVault) {
        // No vault exists, start at upload
        setCurrentStep('upload');
        return;
      }

      // Store vault ID and analysis for later use
      setVaultId(existingVault.id);
      
      // Fetch the full vault data to get initial_analysis
      const { data: fullVault } = await supabase
        .from('career_vault')
        .select('initial_analysis')
        .eq('id', existingVault.id)
        .maybeSingle();
      
      if (fullVault?.initial_analysis) {
        setResumeAnalysis(fullVault.initial_analysis);
      }

      // If 100% complete, redirect to dashboard
      if ((existingVault.interview_completion_percentage ?? 0) >= 100) {
        navigate('/career-vault');
        return;
      }

      // Check if milestones exist
      const { data: existingMilestones } = await supabase
        .from('vault_resume_milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (existingMilestones && existingMilestones.length > 0) {
        // Resume has been uploaded and parsed, go to interview
        setMilestones(existingMilestones);
        setCurrentStep('interview');
        toast({
          title: "Resuming Career Vault",
          description: `Continuing with ${existingMilestones.length} career milestones`,
        });
      } else if (existingVault.resume_raw_text) {
        // Resume uploaded but no milestones, start at goals
        setCurrentStep('goals');
        toast({
          title: "Resuming Career Vault",
          description: "Let's set your career goals",
        });
      } else {
        // Vault exists but no resume, start at upload
        setCurrentStep('upload');
      }
    };

    checkExistingVault();
  }, [navigate, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setPendingFile(file);
    }
  };

  const clearVaultData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('[VAULT-RESET] Clearing all vault data for user:', user.id);

    try {
      // Delete all related records (in order due to foreign keys)
      await supabase.from('vault_interview_responses').delete().eq('user_id', user.id);
      await supabase.from('vault_power_phrases').delete().eq('user_id', user.id);
      await supabase.from('vault_transferable_skills').delete().eq('user_id', user.id);
      await supabase.from('vault_hidden_competencies').delete().eq('user_id', user.id);
      await supabase.from('vault_soft_skills').delete().eq('user_id', user.id);
      await supabase.from('vault_leadership_philosophy').delete().eq('user_id', user.id);
      await supabase.from('vault_executive_presence').delete().eq('user_id', user.id);
      await supabase.from('vault_personality_traits').delete().eq('user_id', user.id);
      await supabase.from('vault_work_style').delete().eq('user_id', user.id);
      await supabase.from('vault_values_motivations').delete().eq('user_id', user.id);
      await supabase.from('vault_behavioral_indicators').delete().eq('user_id', user.id);
      await supabase.from('vault_resume_milestones').delete().eq('user_id', user.id);
      await supabase.from('vault_confirmed_skills').delete().eq('user_id', user.id);

      // Reset career_vault counters
      await supabase
        .from('career_vault')
        .update({
          interview_completion_percentage: 0,
          total_power_phrases: 0,
          total_transferable_skills: 0,
          total_hidden_competencies: 0,
          total_soft_skills: 0,
          total_leadership_philosophy: 0,
          total_executive_presence: 0,
          total_personality_traits: 0,
          total_work_style: 0,
          total_values: 0,
          total_behavioral_indicators: 0
        })
        .eq('user_id', user.id);

      // Clear session storage
      sessionStorage.removeItem('career-vault-goals');
      sessionStorage.removeItem('career-vault-skills');

      toast({
        title: "Vault Reset",
        description: "Starting fresh with your new resume",
      });
    } catch (error) {
      console.error('[VAULT-RESET] Error clearing vault data:', error);
      toast({
        title: "Error",
        description: "Failed to clear vault data. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleVaultChoice = async (choice: 'replace' | 'enhance') => {
    setShowResumeChoiceModal(false);

    if (choice === 'replace') {
      await clearVaultData();
    }

    // Continue with upload
    await continueResumeUpload();
  };

  const continueResumeUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Read file as text (for TXT files) or base64 (for PDF/DOCX)
      let fileData = '';
      let fileText = '';
      
      if (pendingFile.type === 'text/plain') {
        // For TXT files, read as text
        fileText = await pendingFile.text();
      } else {
        // For PDF/DOCX, convert to base64
        const arrayBuffer = await pendingFile.arrayBuffer();
        fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      }

      // Upload to storage first
      const filePath = `${user.id}/${Date.now()}_${pendingFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, pendingFile);

      if (uploadError) throw uploadError;

      // Use new unified process-resume function
      const { data: processData, error: processError } = await supabase.functions.invoke('process-resume', {
        body: {
          ...(fileData ? { fileData } : { fileText }),
          fileName: pendingFile.name,
          fileSize: pendingFile.size,
          fileType: pendingFile.type,
          userId: user.id
        }
      });

      if (processError) throw processError;
      
      if (!processData.success) {
        toast({
          title: "Processing Failed",
          description: processData.error || "Failed to process resume",
          variant: "destructive"
        });

        if (processData.solutions) {
          logger.debug("Suggested solutions:", { solutions: processData.solutions });
        }
        return;
      }

      // Store resume text in career_vault immediately, but DON'T parse milestones yet
      const { data: vaultData } = await supabase
        .from('career_vault')
        .upsert({
          user_id: user.id,
          resume_raw_text: processData.extractedText,
          initial_analysis: processData.analysis || {}
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      // Store vault ID and analysis for later use
      if (vaultData) {
        sessionStorage.setItem('careerVaultId', vaultData.id);
        setVaultId(vaultData.id);
        setResumeAnalysis(vaultData.initial_analysis);
      }

      toast({
        title: "Resume Uploaded",
        description: "Now let's define your career focus to build a targeted vault.",
      });

      // Go to career goals BEFORE parsing milestones
      setCurrentStep('goals');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload resume",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!resumeFile) return;

    // Check if vault exists with data
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingVault } = await supabase
      .from('career_vault')
      .select('interview_completion_percentage, id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVault && (existingVault.interview_completion_percentage ?? 0) > 0) {
      // Fetch milestone count
      const { count } = await supabase
        .from('vault_resume_milestones')
        .select('*', { count: 'exact', head: true })
        .eq('vault_id', existingVault.id);

      // Calculate total intelligence items
      const { data: vaultData } = await supabase
        .from('career_vault')
        .select('total_power_phrases, total_transferable_skills, total_hidden_competencies, total_soft_skills, total_leadership_philosophy, total_executive_presence, total_personality_traits, total_work_style, total_values, total_behavioral_indicators')
        .eq('user_id', user.id)
        .maybeSingle();

      const totalIntelligence = vaultData
        ? (vaultData.total_power_phrases || 0) +
          (vaultData.total_transferable_skills || 0) +
          (vaultData.total_hidden_competencies || 0) +
          (vaultData.total_soft_skills || 0) +
          (vaultData.total_leadership_philosophy || 0) +
          (vaultData.total_executive_presence || 0) +
          (vaultData.total_personality_traits || 0) +
          (vaultData.total_work_style || 0) +
          (vaultData.total_values || 0) +
          (vaultData.total_behavioral_indicators || 0)
        : 0;

      setExistingVaultStats({
        completionPercentage: existingVault.interview_completion_percentage || 0,
        totalIntelligence,
        milestoneCount: count || 0
      });

      setShowResumeChoiceModal(true);
      return;
    }

    // No existing vault or vault is empty, proceed normally
    await continueResumeUpload();
  };

  // Function to refresh milestone data
  const refreshMilestones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vault } = await supabase
        .from('career_vault')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vault) return;

      // Load fresh milestone data
      const { data: milestonesData } = await supabase
        .from('vault_resume_milestones')
        .select('*')
        .eq('vault_id', vault.id)
        .order('start_date', { ascending: false });

      if (milestonesData) {
        setMilestones(milestonesData);
      }
    } catch (error) {
      console.error('Error refreshing milestones:', error);
    }
  };

  const handleInterviewComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('career_vault')
        .update({ interview_completion_percentage: 100 })
        .eq('user_id', user.id);

      setCurrentStep('complete');

      toast({
        title: 'Career Vault Complete!',
        description: 'All features are now unlocked.'
      });

      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const handleSkipInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('career_vault')
        .update({ interview_completion_percentage: 40 })
        .eq('user_id', user.id);

      setCurrentStep('complete');

      toast({
        title: 'Vault Ready!',
        description: 'Starting at 40% power - you can boost this anytime.'
      });

      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (error) {
      console.error('Error skipping interview:', error);
    }
  };

  const handleStartOver = async () => {
    setShowStartOverDialog(false);
    try {
      await clearVaultData();
      setCurrentStep('upload');
      setResumeFile(null);
      setPendingFile(null);
      setMilestones([]);
      toast({
        title: "Vault Reset",
        description: "Starting fresh with a clean slate",
      });
    } catch (error) {
      console.error('Error resetting vault:', error);
      toast({
        title: "Error",
        description: "Failed to reset vault",
        variant: "destructive",
      });
    }
  };

  const handleResumeUploaded = async () => {
    await refreshMilestones();
    setCurrentStep('interview-decision');
  };

  const handleStepClick = (stepId: string) => {
    const targetStepIndex = steps.findIndex(s => s.id === stepId);
    if (targetStepIndex <= currentStepIndex) {
      setCurrentStep(stepId as OnboardingStep);
    }
  };

  return (
    <>
      {existingVaultStats && (
        <ResumeUploadChoiceModal
          isOpen={showResumeChoiceModal}
          onClose={() => setShowResumeChoiceModal(false)}
          onChoice={handleVaultChoice}
          currentStats={existingVaultStats}
        />
      )}

      <div className="container max-w-4xl py-8 space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Build Your Career Vault</h1>
            <p className="text-muted-foreground">
              Extract your career intelligence in 4 simple steps
            </p>
          </div>
          {currentStep !== 'upload' && vaultId && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowResumeModal(true)}
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Manage Resume
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowStartOverDialog(true)}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start Over
              </Button>
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const isAccessible = isCompleted || isCurrent;
            
            return (
              <div
                key={step.id}
                onClick={() => isAccessible && handleStepClick(step.id)}
                className={`flex items-center gap-2 transition-all ${
                  isAccessible ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'
                } ${
                  idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <step.icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <ResumeUploadCard
          resumeFile={resumeFile}
          isUploading={isUploading}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
        />
      )}

      {currentStep === 'goals' && (
        <CareerGoalsStep
          resumeAnalysis={resumeAnalysis}
          onComplete={async (goalsData) => {
            // Parse resume into milestones immediately after goals
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              // Save career goals to profile
              await supabase
                .from('profiles')
                .update({
                  target_roles: goalsData.target_roles,
                  target_industries: goalsData.target_industries
                })
                .eq('user_id', user.id);

              const { data: vault } = await supabase
                .from('career_vault')
                .select('id, resume_raw_text')
                .eq('user_id', user.id)
                .maybeSingle();

              if (vault && vault.resume_raw_text) {
                toast({
                  title: "Building Your Focused Vault",
                  description: "Extracting career milestones relevant to your goals..."
                });

                const { data: milestonesData, error: parseError } = await supabase.functions.invoke('parse-resume-milestones', {
                  body: {
                    resumeText: vault.resume_raw_text,
                    vaultId: vault.id,
                    targetRoles: goalsData.target_roles,
                    targetIndustries: goalsData.target_industries
                  }
                });

                if (parseError) {
                  console.error('Error parsing milestones:', parseError);
                  toast({
                    title: 'Error',
                    description: 'Failed to parse career milestones',
                    variant: 'destructive'
                  });
                } else if (milestonesData?.success) {
                  setMilestones(milestonesData.milestones);
                  
                  // Update vault with career focus
                  await supabase
                    .from('career_vault')
                    .update({
                      target_roles: goalsData.target_roles,
                      target_industries: goalsData.target_industries,
                      focus_set_at: new Date().toISOString()
                    })
                    .eq('id', vault.id);

                  toast({
                    title: 'Career Vault Ready',
                    description: `Found ${milestonesData.milestones.length} relevant career milestones for ${goalsData.target_roles.join(', ')}`,
                  });
                }
              }
            } catch (error) {
              console.error('Error parsing milestones:', error);
            }
            
            setCurrentStep('interview-decision');
          }}
        />
      )}

      {currentStep === 'interview-decision' && (
        <Card>
          <CardHeader>
            <CardTitle>Your Career Vault is Ready!</CardTitle>
            <CardDescription>
              You can start using all tools now, or boost your power first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-semibold text-lg">Operating at 40% Power</p>
                  <p className="text-sm text-muted-foreground">
                    Based on resume extraction only
                  </p>
                </div>
              </div>
              <Progress value={40} className="h-2" />
            </div>

            {/* Two Options */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Option 1: Start Now */}
              <Card className="border-2 border-primary/50 hover:border-primary cursor-pointer transition-colors"
                    onClick={handleSkipInterview}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Start Using Tools Now
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✓ Resume Builder unlocked</li>
                    <li>✓ Job Search ready</li>
                    <li>✓ Networking tools active</li>
                    <li>⚡ Operating at 40% power</li>
                  </ul>
                  <Button className="w-full mt-4">
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>

              {/* Option 2: Boost Power */}
              <Card className="border-2 border-amber-500/50 hover:border-amber-500 cursor-pointer transition-colors"
                    onClick={() => setCurrentStep('interview')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Boost to 100% Power
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>✓ 3X more power phrases</li>
                    <li>✓ Hidden competencies revealed</li>
                    <li>✓ Transferable skills identified</li>
                    <li>⚡ Unlock full AI intelligence</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-4">
                    Complete Interview (20 min)
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              You can always come back and complete the interview later
            </p>
          </CardContent>
        </Card>
      )}

      {currentStep === 'interview' && milestones.length > 0 && (
        <LinearCareerVaultInterview
          userId={userId}
          milestones={milestones}
          onComplete={handleInterviewComplete}
          onMilestoneUpdate={refreshMilestones}
        />
      )}

      {currentStep === 'complete' && (
        <Card className="animate-scale-in">
          <CardContent className="py-12 text-center space-y-4">
            <div className="p-4 bg-success/10 rounded-full w-fit mx-auto animate-fade-in">
              <CheckCircle className="h-12 w-12 text-success" />
            </div>
            <h2 className="text-2xl font-bold animate-fade-in">Career Vault Complete!</h2>
            <p className="text-muted-foreground animate-fade-in">
              All features are now unlocked. Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      )}
      </div>

      {vaultId && (
        <ResumeManagementModal
          open={showResumeModal}
          onOpenChange={setShowResumeModal}
          vaultId={vaultId}
          onResumeUploaded={handleResumeUploaded}
        />
      )}

      <AlertDialog open={showStartOverDialog} onOpenChange={setShowStartOverDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all your vault data including milestones, interview responses, and achievements. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartOver} className="bg-destructive hover:bg-destructive/90">
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CareerVaultOnboarding;

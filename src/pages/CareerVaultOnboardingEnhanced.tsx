import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Target, Brain, CheckCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResumeUploadCard } from '@/components/career-vault/ResumeUploadCard';
import { CareerGoalsStep } from '@/components/career-vault/CareerGoalsStep';
import { AutoPopulateStep } from '@/components/career-vault/AutoPopulateStep';
import { VaultReviewInterface } from '@/components/career-vault/VaultReviewInterface';
import { VoiceNoteRecorder } from '@/components/career-vault/VoiceNoteRecorder';
import { Button } from '@/components/ui/button';

type OnboardingStep = 'upload' | 'goals' | 'auto-populate' | 'review' | 'enhance' | 'complete';

/**
 * CAREER VAULT ONBOARDING - ENHANCED
 *
 * New streamlined flow:
 * 1. Upload resume (2 min)
 * 2. Set career goals (2 min)
 * 3. AI auto-populates vault (1 min)
 * 4. User reviews/validates (5-10 min)
 * 5. Optional: Voice notes for gaps (5 min)
 * TOTAL: 10-20 minutes vs 45-60 minutes with old interview
 */
const CareerVaultOnboardingEnhanced = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);

  const steps = [
    { id: 'upload', label: 'Upload Resume', icon: Upload },
    { id: 'goals', label: 'Career Goals', icon: Target },
    { id: 'auto-populate', label: 'AI Analysis', icon: Brain },
    { id: 'review', label: 'Review', icon: Sparkles },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  useEffect(() => {
    const checkExistingVault = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      // Check if vault is already complete
      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('id, interview_completion_percentage, auto_populated')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVault) {
        setVaultId(existingVault.id);

        // If vault is complete or nearly complete, redirect to dashboard
        if ((existingVault.interview_completion_percentage ?? 0) >= 85) {
          toast({
            title: 'Vault Already Complete',
            description: 'Redirecting to your Career Vault dashboard...'
          });
          navigate('/career-vault');
        }
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

  const handleUpload = async () => {
    if (!resumeFile) return;

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
      const { data: processData, error } = await supabase.functions.invoke('process-resume', {
        body: {
          ...(fileData ? { fileData } : { fileText }),
          fileName: resumeFile.name,
          fileSize: resumeFile.size,
          fileType: resumeFile.type,
          userId: user.id
        }
      });

      if (error || !processData.success) {
        throw new Error(processData?.error || 'Failed to process resume');
      }

      // Create or update vault
      const { data: vaultData } = await supabase
        .from('career_vault')
        .upsert({
          user_id: user.id,
          resume_raw_text: processData.extractedText,
          initial_analysis: processData.analysis || {}
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (vaultData) {
        setVaultId(vaultData.id);
        setResumeText(processData.extractedText);
      }

      toast({
        title: 'Resume Uploaded!',
        description: 'Now let\'s set your career goals'
      });

      setCurrentStep('goals');
    } catch (error: any) {
      console.error('[UPLOAD] Error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
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
    if (data.useManualInterview) {
      // Fallback to old interview method
      navigate('/career-vault/onboarding'); // Use old onboarding
      return;
    }

    setExtractedData(data);
    setCurrentStep('review');
  };

  const handleReviewComplete = () => {
    setCurrentStep('complete');

    toast({
      title: 'Career Vault Complete!',
      description: 'Your vault is ready to power all AI agents'
    });

    setTimeout(() => {
      navigate('/career-vault');
    }, 2000);
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
          {steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 transition-all ${
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
          resumeAnalysis={null}
          onComplete={handleGoalsComplete}
        />
      )}

      {currentStep === 'auto-populate' && vaultId && (
        <AutoPopulateStep
          vaultId={vaultId}
          resumeText={resumeText}
          targetRoles={targetRoles}
          targetIndustries={targetIndustries}
          onComplete={handleAutoPopulateComplete}
        />
      )}

      {currentStep === 'review' && vaultId && extractedData && (
        <VaultReviewInterface
          vaultId={vaultId}
          extractedData={extractedData}
          onComplete={handleReviewComplete}
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
        <Card className="animate-scale-in">
          <CardContent className="py-12 text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-full w-fit mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600 animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold">Career Vault Complete!</h2>
            <p className="text-muted-foreground">
              All AI agents are now powered by your comprehensive career intelligence.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={() => navigate('/command-center')}>
                Go to Command Center
              </Button>
              <Button onClick={() => navigate('/career-vault')}>
                View My Vault
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerVaultOnboardingEnhanced;

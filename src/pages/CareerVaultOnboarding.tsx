import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, MessageSquare, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CareerVaultInterview } from '@/components/CareerVaultInterview';
import { CareerGoalsStep } from '@/components/career-vault/CareerGoalsStep';
import { AIAnalysisStep } from '@/components/career-vault/AIAnalysisStep';
import { SkillConfirmationStep } from '@/components/career-vault/SkillConfirmationStep';
import { MilestoneProgress } from '@/components/career-vault/MilestoneProgress';
import { logger } from '@/lib/logger';

type OnboardingStep = 'upload' | 'goals' | 'analysis' | 'skills' | 'interview' | 'complete';

const CareerVaultOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [currentMilestoneId, setCurrentMilestoneId] = useState<string | null>(null);
  const [totalIntelligenceExtracted, setTotalIntelligenceExtracted] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    { id: 'upload', label: 'Resume Upload', icon: Upload },
    { id: 'goals', label: 'Career Goals', icon: FileText },
    { id: 'analysis', label: 'AI Analysis', icon: MessageSquare },
    { id: 'skills', label: 'Skills Review', icon: CheckCircle },
    { id: 'interview', label: 'Interview', icon: MessageSquare },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Check if user has already completed onboarding and redirect if so
  useEffect(() => {
    const checkExistingVault = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if career vault already exists and is complete
      const { data: existingVault } = await supabase
        .from('career_vault')
        .select('id, interview_completion_percentage')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVault && (existingVault.interview_completion_percentage ?? 0) >= 100) {
        // User has completed onboarding, redirect to dashboard
        navigate('/career-vault');
      }
    };

    checkExistingVault();
  }, [navigate]);

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

      // Read file as text (for TXT files) or base64 (for PDF/DOCX)
      let fileData = '';
      let fileText = '';
      
      if (resumeFile.type === 'text/plain') {
        // For TXT files, read as text
        fileText = await resumeFile.text();
      } else {
        // For PDF/DOCX, convert to base64
        const arrayBuffer = await resumeFile.arrayBuffer();
        fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      }

      // Upload to storage first
      const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      // Use new unified process-resume function
      const { data: processData, error: processError } = await supabase.functions.invoke('process-resume', {
        body: {
          ...(fileData ? { fileData } : { fileText }),
          fileName: resumeFile.name,
          fileSize: resumeFile.size,
          fileType: resumeFile.type,
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

      setResumeText(processData.extractedText);
      setResumeAnalysis(processData.analysis);

      // CRITICAL FIX: Store resume text in career_vault immediately
      const { error: vaultError } = await supabase
        .from('career_vault')
        .upsert({
          user_id: user.id,
          resume_raw_text: processData.extractedText,
          initial_analysis: processData.analysis || {}
        }, {
          onConflict: 'user_id'
        });

      if (vaultError) {
        console.error('Failed to update career vault:', vaultError);
      }

      toast({
        title: "Resume Processed",
        description: processData.cached 
          ? "Found matching resume in cache - instant analysis!"
          : "Your resume has been analyzed successfully",
      });

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

  const handleSkillsComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // CRITICAL FIX: Update career vault with current resume text
      const { error: updateError } = await supabase
        .from('career_vault')
        .update({ resume_raw_text: resumeText })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update career vault with resume text:', updateError);
        toast({
          title: 'Error',
          description: 'Failed to save resume data. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Parse resume into milestones BEFORE starting interview
      const { data: vault } = await supabase
        .from('career_vault')
        .select('id, resume_raw_text')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vault && vault.resume_raw_text) {
        logger.debug('Parsing resume into milestones...');
        const { data: milestonesData, error: parseError } = await supabase.functions.invoke('parse-resume-milestones', {
          body: {
            resumeText: vault.resume_raw_text,
            vaultId: vault.id
          }
        });

        if (parseError) {
          console.error('Error parsing milestones:', parseError);
          toast({
            title: 'Warning',
            description: 'Could not parse resume milestones, proceeding with standard interview',
            variant: 'destructive'
          });
        } else if (milestonesData?.success) {
          setMilestones(milestonesData.milestones);
          setCurrentMilestoneId(milestonesData.milestones[0]?.id || null);
          setTotalIntelligenceExtracted(0);
          
          toast({
            title: 'Resume parsed!',
            description: `Found ${milestonesData.milestones.length} career milestones to expand on`,
          });
        }
      }

      setCurrentStep('interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: 'Error',
        description: 'Failed to start interview. Please try again.',
        variant: 'destructive'
      });
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

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Build Your Career Vault</h1>
        <p className="text-muted-foreground">
          Let's gather your career intelligence in 4 simple steps
        </p>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 ${
                idx <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <step.icon className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your Resume</CardTitle>
            <CardDescription>
              Upload your current resume to kickstart your Career Vault development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Drop your resume here or click to browse</p>
                <p className="text-sm text-muted-foreground">PDF, DOCX, or TXT up to 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload">
                <Button variant="outline" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
              {resumeFile && (
                <p className="text-sm text-primary">Selected: {resumeFile.name}</p>
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={!resumeFile || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Continue'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {currentStep === 'goals' && resumeAnalysis && (
        <CareerGoalsStep 
          resumeAnalysis={resumeAnalysis}
          onComplete={async () => {
            // Fetch target roles and industries from profile
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('target_roles, target_industries')
                  .eq('user_id', user.id)
                  .single();
                
                if (profile) {
                  setTargetRoles(profile.target_roles || []);
                  setTargetIndustries(profile.target_industries || []);
                }
              }
            } catch (error) {
              console.error('Error fetching profile data:', error);
            }
            setCurrentStep('analysis');
          }}
        />
      )}

      {currentStep === 'analysis' && resumeText && (
        <AIAnalysisStep
          resumeText={resumeText}
          targetRoles={targetRoles}
          targetIndustries={targetIndustries}
          onComplete={() => setCurrentStep('skills')}
        />
      )}

      {currentStep === 'skills' && (
        <SkillConfirmationStep 
          onComplete={handleSkillsComplete}
        />
      )}

      {currentStep === 'interview' && (
        <div className="space-y-6">
          {/* Milestone Progress Sidebar */}
          {milestones.length > 0 && (
            <MilestoneProgress
              milestones={milestones}
              currentMilestoneId={currentMilestoneId || undefined}
              onSelectMilestone={setCurrentMilestoneId}
              totalIntelligenceExtracted={totalIntelligenceExtracted}
            />
          )}

          {/* Interview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resume Intelligence Extraction</CardTitle>
              <CardDescription>
                Let's expand on your career milestones with specific examples and quantified achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CareerVaultInterview 
                onComplete={handleInterviewComplete}
                currentMilestoneId={currentMilestoneId}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">Career Vault Complete!</h2>
            <p className="text-muted-foreground">
              All features are now unlocked. Redirecting to dashboard...
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CareerVaultOnboarding;

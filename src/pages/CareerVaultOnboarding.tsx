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

type OnboardingStep = 'upload' | 'goals' | 'analysis' | 'skills' | 'interview' | 'complete';

const CareerVaultOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
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
          console.log("Suggested solutions:", processData.solutions);
        }
        return;
      }

      setResumeText(processData.extractedText);
      setResumeAnalysis(processData.analysis);

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
        title: 'War Chest Complete!',
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
        <h1 className="text-3xl font-bold">Build Your Career War Chest</h1>
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
              Upload your current resume to kickstart your War Chest development
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
          onComplete={() => setCurrentStep('interview')}
        />
      )}

      {currentStep === 'interview' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Career Interview</CardTitle>
            <CardDescription>
              Answer questions to help us understand your full career potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CareerVaultInterview onComplete={handleInterviewComplete} />
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full w-fit mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">War Chest Complete!</h2>
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

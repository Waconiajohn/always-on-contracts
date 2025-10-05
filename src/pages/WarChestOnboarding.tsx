import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, MessageSquare, CheckCircle, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WarChestInterview } from '@/components/WarChestInterview';

type OnboardingStep = 'upload' | 'interview' | 'review' | 'complete';

const WarChestOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const steps = [
    { id: 'upload', label: 'Resume Upload', icon: Upload },
    { id: 'interview', label: 'AI Interview', icon: MessageSquare },
    { id: 'review', label: 'Review', icon: FileText },
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

      // Upload to storage
      const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) throw uploadError;

      // Parse resume
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: { fileName: resumeFile.name, filePath }
      });

      if (error) throw error;

      setResumeText(data.rawText || '');

      // Initialize War Chest
      await supabase.from('career_war_chest').upsert({
        user_id: user.id,
        resume_raw_text: data.rawText,
        interview_completion_percentage: 25,
        initial_analysis: data.analysis
      });

      toast({
        title: 'Resume Uploaded',
        description: 'Starting AI interview...'
      });

      setCurrentStep('interview');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Please try again.',
        variant: 'destructive'
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
        .from('career_war_chest')
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
                <p className="text-sm text-muted-foreground">PDF, DOCX up to 10MB</p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
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

      {currentStep === 'interview' && (
        <Card>
          <CardHeader>
            <CardTitle>AI Career Interview</CardTitle>
            <CardDescription>
              Answer questions to help us understand your full career potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WarChestInterview onComplete={handleInterviewComplete} />
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

export default WarChestOnboarding;

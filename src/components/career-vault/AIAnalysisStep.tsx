import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIAnalysisStepProps {
  resumeText: string;
  targetRoles: string[];
  targetIndustries: string[];
  onComplete: () => void;
}

interface AnalysisStep {
  label: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export const AIAnalysisStep = ({
  resumeText,
  targetRoles,
  targetIndustries,
  onComplete,
}: AIAnalysisStepProps) => {
  const [steps, setSteps] = useState<AnalysisStep[]>([
    { label: 'Analyzing your resume', status: 'in-progress' },
    { label: 'Researching target roles', status: 'pending' },
    { label: 'Identifying skill gaps', status: 'pending' },
    { label: 'Verifying with market data', status: 'pending' },
    { label: 'Generating recommendations', status: 'pending' },
  ]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    performAnalysis();
  }, []);

  const updateStep = (index: number, status: AnalysisStep['status']) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    );
  };

  const performAnalysis = async () => {
    try {
      // Step 1: Analyzing resume
      setProgress(25);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      updateStep(0, 'complete');
      updateStep(1, 'in-progress');

      // Step 2: Researching target roles
      setProgress(50);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      updateStep(1, 'complete');
      updateStep(2, 'in-progress');

      // Step 3: Call the AI analysis function
      setProgress(75);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('analyze-resume-and-research', {
        body: {
          resume_text: resumeText,
          target_roles: targetRoles,
          target_industries: targetIndustries,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      updateStep(2, 'complete');
      updateStep(3, 'in-progress');

      // Step 4: Verification (if done)
      setProgress(85);
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateStep(3, 'complete');
      updateStep(4, 'in-progress');

      // Step 5: Complete
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      updateStep(4, 'complete');

      const verificationMsg = data.verified 
        ? ` & verified with ${data.citations_count} sources`
        : '';
      toast.success(`Analysis complete! Found ${data.skills_count} skills${verificationMsg}`);

      // Wait a moment then proceed
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error('Error during analysis:', error);
      toast.error('Failed to complete analysis. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Sparkles className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-3xl font-bold">Building Your Profile</h2>
        <p className="text-muted-foreground">
          Our AI is analyzing your resume and researching your target roles...
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <Progress value={progress} className="h-2" />

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                {step.status === 'complete' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
                {step.status === 'in-progress' && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                )}
                {step.status === 'pending' && (
                  <div className="h-5 w-5 rounded-full border-2 border-muted flex-shrink-0" />
                )}
                <span
                  className={`text-sm ${
                    step.status === 'complete'
                      ? 'text-foreground font-medium'
                      : step.status === 'in-progress'
                      ? 'text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        This usually takes 30-60 seconds. Please don't close this page.
      </p>
    </div>
  );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useResumeBuilderStore } from '@/stores/resumeBuilderStore';
import { toast } from 'sonner';
import { HiringManagerReviewPanel } from '@/components/resume-builder/HiringManagerReviewPanel';
import { ATSScoreReportPanel } from '@/components/resume-builder/ATSScoreReportPanel';

type WizardStep = 
  | 'job-input' 
  | 'gap-analysis' 
  | 'format-selection' 
  | 'requirement-filter'
  | 'requirement-builder'
  | 'section-wizard'
  | 'generation'
  | 'hiring-manager-review'
  | 'ats-score-report'
  | 'final-review';

export default function ResumeBuilderV2() {
  const navigate = useNavigate();
  const store = useResumeBuilderStore();
  const [currentStep, setCurrentStep] = useState<WizardStep>('job-input');

  // Main navigation between steps
  const handleStepComplete = (nextStep: WizardStep) => {
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    // Simple back navigation logic
    const stepOrder: WizardStep[] = [
      'job-input',
      'gap-analysis',
      'format-selection',
      'requirement-filter',
      'requirement-builder',
      'section-wizard',
      'generation',
      'hiring-manager-review',
      'ats-score-report',
      'final-review'
    ];

    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleExportResume = () => {
    // Export functionality
    toast.success('Resume exported successfully!');
    navigate('/dashboard');
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'hiring-manager-review':
        return (
          <HiringManagerReviewPanel
            resumeContent={store.displayJobText} // This should be the actual resume content
            jobDescription={store.displayJobText}
            jobTitle={store.jobAnalysis?.roleProfile?.title}
            industry={store.jobAnalysis?.roleProfile?.industry}
            onContinue={() => handleStepComplete('ats-score-report')}
            onBack={handleBack}
          />
        );

      case 'ats-score-report':
        return (
          <ATSScoreReportPanel
            resumeContent={store.displayJobText} // This should be the actual resume content
            jobDescription={store.displayJobText}
            jobTitle={store.jobAnalysis?.roleProfile?.title}
            industry={store.jobAnalysis?.roleProfile?.industry}
            onExport={handleExportResume}
            onBack={handleBack}
          />
        );

      default:
        return (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Resume Builder V2</h2>
              <p className="text-muted-foreground">
                This is a placeholder for the resume builder wizard.
                The hiring manager review and ATS score report steps are now integrated.
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setCurrentStep('hiring-manager-review')}>
                  Test Hiring Manager Review
                </Button>
                <Button onClick={() => setCurrentStep('ats-score-report')}>
                  Test ATS Score Report
                </Button>
              </div>
            </div>
          </Card>
        );
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      {currentStep !== 'job-input' && (
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      )}
      
      {renderStep()}
    </div>
  );
}

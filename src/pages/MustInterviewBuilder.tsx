import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";

// V3 Step Components
import { TargetSetup } from "@/components/resume-builder/v3/TargetSetup";
import { AIAssessmentPanel } from "@/components/resume-builder/v3/AIAssessmentPanel";
import { SectionBuilder } from "@/components/resume-builder/v3/SectionBuilder";
import { HiringManagerReview } from "@/components/resume-builder/v3/HiringManagerReview";
import { FinalizeExport } from "@/components/resume-builder/v3/FinalizeExport";
import { ProgressTracker } from "@/components/resume-builder/v3/ProgressTracker";

// Types
import type { 
  MustInterviewState, 
  ResumeAssessment, 
  ResumeSection,
  BuilderStep 
} from "@/types/mustInterviewBuilder";

const STEPS: { id: BuilderStep; label: string; description: string }[] = [
  { id: 'target', label: 'Set Target', description: 'Upload résumé & job description' },
  { id: 'assessment', label: 'AI Assessment', description: 'Review alignment & pick format' },
  { id: 'build', label: 'Build & Refine', description: 'Fix gaps & polish sections' },
  { id: 'review', label: 'Hiring Manager Review', description: 'AI self-review & refinement' },
  { id: 'finalize', label: 'Finalize & Export', description: 'ATS check & download' },
];

const MustInterviewBuilderContent = () => {
  const { toast } = useToast();
  const location = useLocation();

  // Current step
  const [currentStep, setCurrentStep] = useState<BuilderStep>('target');
  const [resumeId, setResumeId] = useState<string | null>(null);

  // State for the entire flow
  const [state, setState] = useState<MustInterviewState>({
    // Target inputs
    resumeText: '',
    resumeFile: null,
    jobDescription: '',
    jobUrl: '',

    // Analysis results
    assessment: null,
    selectedFormat: null,

    // Generated content
    sections: [],
    
    // Progress tracking
    initialScore: null,
    currentScore: null,
    
    // Review results
    hiringManagerFeedback: null,
    atsReport: null,
    
    // Meta
    isLoading: false,
    error: null,
  });

  // Auto-load from job search navigation
  useEffect(() => {
    const jobData = location.state as any;
    
    if (jobData?.fromJobSearch && jobData?.jobDescription) {
      setState(prev => ({
        ...prev,
        jobDescription: jobData.jobDescription,
        jobUrl: jobData.applyUrl || '',
      }));
      
      toast({
        title: "Job loaded",
        description: "Ready to build your must-interview résumé",
      });
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Save progress periodically
  useEffect(() => {
    const saveProgress = async () => {
      if (!resumeId || !state.assessment) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('resumes').update({
          job_analysis: state.assessment,
          sections: state.sections,
          selected_format: state.selectedFormat,
          updated_at: new Date().toISOString(),
        }).eq('id', resumeId);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const timeout = setTimeout(saveProgress, 30000); // Auto-save every 30s
    return () => clearTimeout(timeout);
  }, [resumeId, state.assessment, state.sections, state.selectedFormat]);

  // Step navigation
  const goToStep = (step: BuilderStep) => {
    setCurrentStep(step);
  };

  const goNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const goBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  // State update handlers
  const handleTargetComplete = (data: {
    resumeText: string;
    jobDescription: string;
    assessment: ResumeAssessment;
  }) => {
    setState(prev => ({
      ...prev,
      resumeText: data.resumeText,
      jobDescription: data.jobDescription,
      assessment: data.assessment,
      initialScore: data.assessment.alignmentScore,
      currentScore: data.assessment.alignmentScore,
    }));
    goNext();
  };

  const handleFormatSelected = (format: string) => {
    setState(prev => ({
      ...prev,
      selectedFormat: format,
    }));
    goNext();
  };

  const handleSectionsUpdated = (sections: ResumeSection[], newScore?: number) => {
    setState(prev => ({
      ...prev,
      sections,
      currentScore: newScore ?? prev.currentScore,
    }));
  };

  const handleBuildComplete = () => {
    goNext();
  };

  const handleReviewComplete = (feedback: any) => {
    setState(prev => ({
      ...prev,
      hiringManagerFeedback: feedback,
    }));
    goNext();
  };

  const handleATSReport = (report: any) => {
    setState(prev => ({
      ...prev,
      atsReport: report,
    }));
  };

  // Calculate progress percentage
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Progress Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={goBack} disabled={currentStep === 'target'}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Must-Interview Résumé Builder</h1>
                <p className="text-sm text-muted-foreground">
                  {STEPS.find(s => s.id === currentStep)?.description}
                </p>
              </div>
            </div>

            {/* Live Score Display */}
            {state.currentScore !== null && (
              <ProgressTracker
                initialScore={state.initialScore || 0}
                currentScore={state.currentScore}
                targetScore={80}
              />
            )}
          </div>

          {/* Step Indicators */}
          <div className="flex gap-1">
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                onClick={() => {
                  // Only allow going back, not forward
                  if (index <= currentStepIndex) {
                    goToStep(step.id);
                  }
                }}
                className={`
                  flex-1 h-2 rounded-full transition-all
                  ${index < currentStepIndex 
                    ? 'bg-green-500' 
                    : index === currentStepIndex 
                      ? 'bg-primary' 
                      : 'bg-muted'
                  }
                  ${index <= currentStepIndex ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                `}
                title={step.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentStep === 'target' && (
          <TargetSetup
            initialResumeText={state.resumeText}
            initialJobDescription={state.jobDescription}
            initialJobUrl={state.jobUrl}
            onComplete={handleTargetComplete}
          />
        )}

        {currentStep === 'assessment' && state.assessment && (
          <AIAssessmentPanel
            assessment={state.assessment}
            resumeText={state.resumeText}
            jobDescription={state.jobDescription}
            selectedFormat={state.selectedFormat}
            onFormatSelected={handleFormatSelected}
            onBack={goBack}
          />
        )}

        {currentStep === 'build' && state.assessment && state.selectedFormat && (
          <SectionBuilder
            assessment={state.assessment}
            resumeText={state.resumeText}
            jobDescription={state.jobDescription}
            selectedFormat={state.selectedFormat}
            sections={state.sections}
            onSectionsUpdated={handleSectionsUpdated}
            onComplete={handleBuildComplete}
            onBack={goBack}
          />
        )}

        {currentStep === 'review' && (
          <HiringManagerReview
            sections={state.sections}
            jobDescription={state.jobDescription}
            assessment={state.assessment}
            onComplete={handleReviewComplete}
            onBack={goBack}
          />
        )}

        {currentStep === 'finalize' && (
          <FinalizeExport
            sections={state.sections}
            assessment={state.assessment}
            jobDescription={state.jobDescription}
            selectedFormat={state.selectedFormat}
            hiringManagerFeedback={state.hiringManagerFeedback}
            initialScore={state.initialScore}
            currentScore={state.currentScore}
            onATSReport={handleATSReport}
            onBack={goBack}
          />
        )}
      </div>
    </div>
  );
};

export default function MustInterviewBuilder() {
  return (
    <ProtectedRoute>
      <MustInterviewBuilderContent />
    </ProtectedRoute>
  );
}

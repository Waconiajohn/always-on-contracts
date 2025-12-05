/**
 * ResumeBuilderV7 - Main orchestrator for the redesigned resume builder
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

import { FloatingScorePill } from './components/FloatingScorePill';
import { StepProgress } from './components/StepProgress';
import { TemplateGallery } from './components/TemplateGallery';
import { SectionStudio } from './components/SectionStudio';
import { QuickGlanceSimulator } from './components/QuickGlanceSimulator';
import { ATSControlCenter } from './components/ATSControlCenter';
import { HumanizationLab } from './components/HumanizationLab';
import { HMReviewDashboard } from './components/HMReviewDashboard';
import { ExportCelebration } from './components/ExportCelebration';

import type { 
  V7Step, 
  V7BuilderState, 
  ResumeTemplate, 
  SectionType
} from './types';
import { V7_STEP_ORDER } from './types';

import { GapAssessmentStep } from './components/GapAssessmentStep';
import { exportAsPDF, exportAsDOCX, exportAsTXT } from './utils/exportResume';
import { debouncedRecalculateScore } from './utils/scoreRecalculator';

export default function ResumeBuilderV7() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const locationState = location.state as any;

  // Main state
  const [state, setState] = useState<V7BuilderState>(() => ({
    resumeText: locationState?.resumeText || '',
    jobDescription: locationState?.jobDescription || '',
    initialScore: locationState?.scoreResult?.overallScore || 0,
    currentScore: locationState?.scoreResult?.overallScore || 0,
    scores: locationState?.scoreResult?.scores || { ats: 0, requirements: 0, competitive: 0 },
    detected: locationState?.scoreResult?.detected || { role: 'Professional', industry: 'General', level: 'Mid-Level' },
    gapAnalysis: locationState?.scoreResult?.gapAnalysis || null,
    quickWins: locationState?.scoreResult?.quickWins || [],
    selectedTemplate: null,
    sections: {
      summary: { id: 'summary', type: 'summary', title: 'Summary', content: '', isComplete: false },
      experience: { id: 'experience', type: 'experience', title: 'Experience', content: '', isComplete: false },
      skills: { id: 'skills', type: 'skills', title: 'Skills', content: '', isComplete: false },
      education: { id: 'education', type: 'education', title: 'Education', content: '', isComplete: false },
      certifications: { id: 'certifications', type: 'certifications', title: 'Certifications', content: '', isComplete: false }
    },
    currentSection: 'summary',
    quickGlanceResult: null,
    atsAuditResult: null,
    humanizationResult: null,
    hmReviewResult: null,
    industryResearch: null,
    isProcessing: false,
    processingMessage: ''
  }));

  const [currentStep, setCurrentStep] = useState<V7Step>('gap-analysis');
  const [completedSteps, setCompletedSteps] = useState<Set<V7Step>>(new Set());

  // Redirect if no data
  useEffect(() => {
    if (!state.resumeText || !state.jobDescription) {
      toast({ title: 'Missing Data', description: 'Please start from Quick Score.', variant: 'destructive' });
      navigate('/quick-score');
    }
  }, []);

  // Navigation
  const goToStep = useCallback((step: V7Step) => setCurrentStep(step), []);
  const goToNextStep = useCallback(() => {
    const idx = V7_STEP_ORDER.indexOf(currentStep);
    if (idx < V7_STEP_ORDER.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(V7_STEP_ORDER[idx + 1]);
    }
  }, [currentStep]);
  const goToPrevStep = useCallback(() => {
    const idx = V7_STEP_ORDER.indexOf(currentStep);
    if (idx > 0) setCurrentStep(V7_STEP_ORDER[idx - 1]);
  }, [currentStep]);

  // Handlers
  const handleTemplateSelect = (template: ResumeTemplate) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
    goToNextStep();
  };

  const handleSectionContentChange = (section: SectionType, content: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        sections: { ...prev.sections, [section]: { ...prev.sections[section], content } }
      };
      
      // Trigger debounced score recalculation
      debouncedRecalculateScore(
        { sections: newState.sections, jobDescription: prev.jobDescription, targetRole: prev.detected.role },
        (result) => {
          setState(current => ({
            ...current,
            previousScore: current.currentScore,
            currentScore: result.overallScore,
            scores: result.scores
          }));
        }
      );
      
      return newState;
    });
  };

  const handleSectionComplete = (section: SectionType) => {
    setState(prev => ({
      ...prev,
      sections: { ...prev.sections, [section]: { ...prev.sections[section], isComplete: true } }
    }));
  };

  const completedSections = new Set(
    Object.entries(state.sections).filter(([_, s]) => s.isComplete).map(([k]) => k as SectionType)
  );

  const getResumeContent = () => Object.values(state.sections).map(s => s.content).join('\n\n');

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    toast({ title: 'Exporting...', description: `Generating ${format.toUpperCase()} file` });
    
    const exportData = {
      sections: state.sections,
      detected: state.detected,
      finalScore: state.currentScore
    };
    
    try {
      if (format === 'pdf') {
        await exportAsPDF(exportData);
      } else if (format === 'docx') {
        await exportAsDOCX(exportData);
      } else {
        await exportAsTXT(exportData);
      }
      toast({ title: 'Success!', description: `Resume downloaded as ${format.toUpperCase()}` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export failed', description: 'Please try again', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Floating Score */}
      <FloatingScorePill 
        score={state.currentScore} 
        previousScore={state.previousScore}
        breakdown={state.scores} 
      />

      {/* Step Progress */}
      <StepProgress 
        currentStep={currentStep} 
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      {/* Main Content */}
      <main className="h-[calc(100vh-60px)]">
        {currentStep === 'gap-analysis' && (
          <GapAssessmentStep
            state={state}
            onNext={goToNextStep}
          />
        )}

        {currentStep === 'template-gallery' && (
          <TemplateGallery
            detected={state.detected}
            selectedTemplate={state.selectedTemplate}
            onSelect={handleTemplateSelect}
          />
        )}

        {currentStep === 'section-studio' && (
          <SectionStudio
            detected={state.detected}
            jobDescription={state.jobDescription}
            gapAnalysis={state.gapAnalysis}
            industryResearch={state.industryResearch}
            sectionContent={Object.fromEntries(
              Object.entries(state.sections).map(([k, v]) => [k, v.content])
            ) as Record<SectionType, string>}
            completedSections={completedSections}
            onContentChange={handleSectionContentChange}
            onSectionComplete={handleSectionComplete}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 'quick-glance-test' && (
          <QuickGlanceSimulator
            resumeContent={getResumeContent()}
            jobDescription={state.jobDescription}
            detected={state.detected}
            onComplete={(r) => setState(prev => ({ ...prev, quickGlanceResult: r }))}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 'ats-control-center' && (
          <ATSControlCenter
            resumeContent={getResumeContent()}
            jobDescription={state.jobDescription}
            detected={state.detected}
            onComplete={(r) => setState(prev => ({ ...prev, atsAuditResult: r }))}
            onKeywordInsert={() => {}}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 'humanization-lab' && (
          <HumanizationLab
            resumeContent={getResumeContent()}
            onComplete={(r) => setState(prev => ({ ...prev, humanizationResult: r }))}
            onApply={() => {}}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 'hm-review' && (
          <HMReviewDashboard
            resumeContent={getResumeContent()}
            jobDescription={state.jobDescription}
            detected={state.detected}
            onComplete={(r) => setState(prev => ({ ...prev, hmReviewResult: r }))}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        )}

        {currentStep === 'export' && (
          <ExportCelebration
            finalScore={state.currentScore}
            scores={state.scores}
            resumeContent={getResumeContent()}
            onExport={handleExport}
            onBack={goToPrevStep}
            onStartNew={() => navigate('/quick-score')}
          />
        )}
      </main>
    </div>
  );
}

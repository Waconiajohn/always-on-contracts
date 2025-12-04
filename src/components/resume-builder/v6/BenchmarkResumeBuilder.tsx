/**
 * BenchmarkResumeBuilder V6 - Complete Resume Transformation System
 * 
 * 7-Step Flow:
 * 1. Upload & Initial Score
 * 2. Gap Assessment Dashboard
 * 3. Template Selection (4 templates with preview)
 * 4. Section-by-Section Editing (Full Width)
 * 5. ATS Audit
 * 6. Humanize + Hiring Manager Review
 * 7. Export Beautiful Resume
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { invokeEdgeFunction } from '@/lib/edgeFunction';

// Step Components
import { GapAssessmentStep } from './steps/GapAssessmentStep';
import { TemplateSelectionStep } from './steps/TemplateSelectionStep';
import { SectionEditorStep } from './steps/SectionEditorStep';
import { QuickGlanceEditStep } from './steps/QuickGlanceEditStep';
import { ATSAuditStep } from './steps/ATSAuditStep';
import { HumanizeReviewStep } from './steps/HumanizeReviewStep';
import { ExportStep } from './steps/ExportStep';

// Shared Components
import { StepIndicator } from './components/StepIndicator';
import { LiveScoreHeader } from './components/LiveScoreHeader';

// Types
import type { 
  BenchmarkBuilderState,
  ResumeTemplate,
  ScoreBreakdown,
  ATSAuditResult,
  HMReviewResult
} from './types';

export type BuilderStep = 
  | 'gap-assessment'
  | 'template-selection'
  | 'section-editor'
  | 'quick-glance'
  | 'ats-audit'
  | 'humanize-review'
  | 'export';

const STEP_ORDER: BuilderStep[] = [
  'gap-assessment',
  'template-selection',
  'section-editor',
  'quick-glance',
  'ats-audit',
  'humanize-review',
  'export'
];

const STEP_LABELS: Record<BuilderStep, string> = {
  'gap-assessment': 'Gap Analysis',
  'template-selection': 'Choose Format',
  'section-editor': 'Edit Sections',
  'quick-glance': 'Quick Glance',
  'ats-audit': 'ATS Audit',
  'humanize-review': 'Final Polish',
  'export': 'Export'
};

interface BenchmarkResumeBuilderProps {
  initialState?: Partial<BenchmarkBuilderState>;
}

export default function BenchmarkResumeBuilder({ initialState }: BenchmarkResumeBuilderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get data from navigation state (from QuickScore)
  const locationState = location.state as any;

  // Main builder state
  const [state, setState] = useState<BenchmarkBuilderState>(() => ({
    // Input data
    resumeText: locationState?.resumeText || initialState?.resumeText || '',
    jobDescription: locationState?.jobDescription || initialState?.jobDescription || '',
    
    // Score data from QuickScore
    initialScore: locationState?.scoreResult?.overallScore || initialState?.initialScore || 0,
    currentScore: locationState?.scoreResult?.overallScore || initialState?.currentScore || 0,
    previousScore: undefined,
    
    // Score breakdown
    scores: locationState?.scoreResult?.scores || initialState?.scores || {
      ats: 0,
      requirements: 0,
      competitive: 0
    },
    
    // Detected info
    detected: locationState?.scoreResult?.detected || initialState?.detected || {
      role: 'Unknown Role',
      industry: 'General',
      level: 'Mid-Level'
    },
    
    // Gap analysis
    gaps: locationState?.scoreResult?.priorityFixes?.map((fix: any, i: number) => ({
      id: `gap-${i}`,
      severity: fix.priority === 1 ? 'critical' : fix.priority === 2 ? 'important' : 'nice-to-have',
      category: fix.category,
      issue: fix.issue,
      fix: fix.fix,
      impact: fix.impact,
      resolved: false
    })) || [],
    
    // Quick wins
    quickWins: locationState?.scoreResult?.quickWins || [],
    
    // Structured gap analysis (new format)
    gapAnalysis: locationState?.scoreResult?.gapAnalysis || null,
    
    // Template
    selectedTemplate: null,
    
    // Sections
    sections: [],
    currentSectionIndex: 0,
    
    // ATS Audit
    atsAuditResult: null,
    
    // HM Review
    hmReviewResult: null,
    
    // Humanization
    humanizedContent: null,
    
    // Processing states
    isProcessing: false,
    processingMessage: '',
    
    // Industry research (Perplexity)
    industryResearch: null
  }));

  // Current step
  const [currentStep, setCurrentStep] = useState<BuilderStep>('gap-assessment');

  // Redirect if no data
  useEffect(() => {
    if (!state.resumeText || !state.jobDescription) {
      toast({
        title: 'Missing Data',
        description: 'Please start from Quick Score to analyze your resume first.',
        variant: 'destructive'
      });
      navigate('/quick-score');
    }
  }, [state.resumeText, state.jobDescription, navigate, toast]);

  // Fetch industry research on mount
  useEffect(() => {
    if (state.detected.role && state.detected.industry && !state.industryResearch) {
      fetchIndustryResearch();
    }
  }, [state.detected]);

  const fetchIndustryResearch = async () => {
    try {
      const { data } = await invokeEdgeFunction('perplexity-research', {
        research_type: 'market_intelligence',
        query_params: {
          role: state.detected.role,
          industry: state.detected.industry
        }
      });

      if (data?.success) {
        setState(prev => ({ ...prev, industryResearch: data.research_result }));
      }
    } catch (error) {
      console.error('Failed to fetch industry research:', error);
    }
  };

  // Navigation helpers
  const goToStep = useCallback((step: BuilderStep) => {
    setCurrentStep(step);
  }, []);

  const goToNextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [currentStep]);

  // Score update handler
  const handleScoreUpdate = useCallback((newScore: number, breakdown?: Partial<ScoreBreakdown>) => {
    setState(prev => ({
      ...prev,
      previousScore: prev.currentScore,
      currentScore: newScore,
      scores: breakdown ? { ...prev.scores, ...breakdown } : prev.scores
    }));
  }, []);

  // Template selection handler
  const handleTemplateSelect = useCallback((template: ResumeTemplate) => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
    // Auto-advance to section editor
    goToNextStep();
  }, [goToNextStep]);

  // ATS Audit completion handler
  const handleATSAuditComplete = useCallback((result: ATSAuditResult) => {
    setState(prev => ({ ...prev, atsAuditResult: result }));
  }, []);

  // HM Review completion handler
  const handleHMReviewComplete = useCallback((result: HMReviewResult) => {
    setState(prev => ({ ...prev, hmReviewResult: result }));
  }, []);

  // State updater
  const updateState = useCallback((updates: Partial<BenchmarkBuilderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Live Score Header - Always visible */}
      <LiveScoreHeader
        currentScore={state.currentScore}
        previousScore={state.previousScore}
        scores={state.scores}
        detected={state.detected}
        stepLabel={STEP_LABELS[currentStep]}
      />

      {/* Step Indicator */}
      <StepIndicator
        steps={STEP_ORDER as string[]}
        currentStep={currentStep}
        labels={STEP_LABELS as Record<string, string>}
        onStepClick={(step) => goToStep(step as BuilderStep)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentStep === 'gap-assessment' && (
            <motion.div
              key="gap-assessment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <GapAssessmentStep
                state={state}
                onNext={goToNextStep}
                onUpdateState={updateState}
              />
            </motion.div>
          )}

          {currentStep === 'template-selection' && (
            <motion.div
              key="template-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <TemplateSelectionStep
                state={state}
                onSelectTemplate={handleTemplateSelect}
                onBack={goToPrevStep}
              />
            </motion.div>
          )}

          {currentStep === 'section-editor' && (
            <motion.div
              key="section-editor"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <SectionEditorStep
                state={state}
                onScoreUpdate={handleScoreUpdate}
                onNext={goToNextStep}
                onBack={goToPrevStep}
              />
            </motion.div>
          )}

          {currentStep === 'quick-glance' && (
            <motion.div
              key="quick-glance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <QuickGlanceEditStep
                state={state}
                onScoreUpdate={handleScoreUpdate}
                onNext={goToNextStep}
                onBack={goToPrevStep}
                onUpdateState={updateState}
              />
            </motion.div>
          )}

          {currentStep === 'ats-audit' && (
            <motion.div
              key="ats-audit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ATSAuditStep
                state={state}
                onComplete={handleATSAuditComplete}
                onNext={goToNextStep}
                onBack={goToPrevStep}
              />
            </motion.div>
          )}

          {currentStep === 'humanize-review' && (
            <motion.div
              key="humanize-review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <HumanizeReviewStep
                state={state}
                onComplete={handleHMReviewComplete}
                onScoreUpdate={handleScoreUpdate}
                onNext={goToNextStep}
                onBack={goToPrevStep}
                onUpdateState={updateState}
              />
            </motion.div>
          )}

          {currentStep === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ExportStep
                state={state}
                onBack={goToPrevStep}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/**
 * ResumeBuilderV8 - State-of-the-art evidence-first resume builder
 * 
 * Key innovations:
 * - Evidence-first approach (never hallucinate)
 * - 4 streamlined steps (not 8)
 * - Real-time score updates
 * - Split-screen editing with live preview
 * - Full Career Vault integration
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { ProgressRail } from './components/ProgressRail';
import { ScorePulse } from './components/ScorePulse';
import { EvidenceMatrixStep } from './steps/EvidenceMatrixStep';
import { BuildStep } from './steps/BuildStep';
import { FineTuneStep } from './steps/FineTuneStep';
import { ExportStep } from './steps/ExportStep';

// Hooks
import { useResumeBuilderState } from './hooks/useResumeBuilderState';

// Types
import { V8_STEP_CONFIG, type V8Step } from './types';

export default function ResumeBuilderV8() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Extract data passed from QuickScore
  const locationState = location.state as {
    fromQuickScore?: boolean;
    resumeText?: string;
    jobDescription?: string;
    scoreResult?: any;
    jobTitle?: string;
    industry?: string;
  } | null;

  // Initialize state management
  const {
    state,
    goToStep,
    goToNextStep,
    goToPrevStep,
    fetchEvidenceMatrix,
    enhanceSection,
    runHumanization,
    runATSAudit,
    runHMReview,
    updateSectionContent,
    markSectionComplete,
    toggleEvidenceSelection,
    canProceedFromStep,
    getFullResumeContent
  } = useResumeBuilderState({
    initialData: locationState ? {
      resumeText: locationState.resumeText || '',
      jobDescription: locationState.jobDescription || '',
      scoreResult: locationState.scoreResult
    } : undefined
  });

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
  }, [state.resumeText, state.jobDescription, toast, navigate]);

  // Auto-fetch evidence matrix on mount
  useEffect(() => {
    if (state.gapAnalysis && !state.evidenceMatrix && state.currentStep === 'evidence-matrix') {
      fetchEvidenceMatrix();
    }
  }, [state.gapAnalysis, state.evidenceMatrix, state.currentStep, fetchEvidenceMatrix]);

  // Render current step
  const renderStep = () => {
    switch (state.currentStep) {
      case 'evidence-matrix':
        return (
          <EvidenceMatrixStep
            gapAnalysis={state.gapAnalysis}
            evidenceMatrix={state.evidenceMatrix}
            detected={state.detected}
            isProcessing={state.isProcessing}
            processingMessage={state.processingMessage}
            onToggleEvidence={toggleEvidenceSelection}
            onRefresh={fetchEvidenceMatrix}
            onNext={goToNextStep}
            canProceed={canProceedFromStep('evidence-matrix')}
          />
        );
      
      case 'build':
        return (
          <BuildStep
            sections={state.sections}
            evidenceMatrix={state.evidenceMatrix}
            detected={state.detected}
            jobDescription={state.jobDescription}
            currentScore={state.currentScore}
            previousScore={state.previousScore}
            isProcessing={state.isProcessing}
            onContentChange={updateSectionContent}
            onSectionComplete={markSectionComplete}
            onEnhance={enhanceSection}
            onNext={goToNextStep}
            onBack={goToPrevStep}
            canProceed={canProceedFromStep('build')}
          />
        );
      
      case 'fine-tune':
        return (
          <FineTuneStep
            resumeContent={getFullResumeContent()}
            humanizationResult={state.humanizationResult}
            atsAuditResult={state.atsAuditResult}
            hmReviewResult={state.hmReviewResult}
            isProcessing={state.isProcessing}
            processingMessage={state.processingMessage}
            onRunHumanization={runHumanization}
            onRunATSAudit={runATSAudit}
            onRunHMReview={runHMReview}
            onNext={goToNextStep}
            onBack={goToPrevStep}
          />
        );
      
      case 'export':
        return (
          <ExportStep
            resumeContent={getFullResumeContent()}
            sections={state.sections}
            detected={state.detected}
            initialScore={state.initialScore}
            finalScore={state.currentScore}
            scoreBreakdown={state.scoreBreakdown}
            onBack={goToPrevStep}
            onStartNew={() => navigate('/quick-score')}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Fixed Header with Progress */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center gap-3">
              <span className="text-2xl">{V8_STEP_CONFIG[state.currentStep].icon}</span>
              <div>
                <h1 className="text-lg font-semibold">
                  {V8_STEP_CONFIG[state.currentStep].title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {V8_STEP_CONFIG[state.currentStep].subtitle}
                </p>
              </div>
            </div>

            {/* Score Pulse (shows during build step) */}
            {state.currentStep === 'build' && (
              <ScorePulse
                score={state.currentScore}
                previousScore={state.previousScore}
                breakdown={state.scoreBreakdown}
              />
            )}
          </div>

          {/* Progress Rail */}
          <div className="mt-4">
            <ProgressRail
              currentStep={state.currentStep}
              completedSteps={state.completedSteps}
              onStepClick={goToStep}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Processing Overlay */}
      <AnimatePresence>
        {state.isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium">{state.processingMessage || 'Processing...'}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

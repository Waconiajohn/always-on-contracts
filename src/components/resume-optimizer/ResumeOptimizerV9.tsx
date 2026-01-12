import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressStepper } from './components/ProgressStepper';
import { Step2GapAnalysis } from './steps/Step2GapAnalysis';
import { Step3GapCloser } from './steps/Step3GapCloser';
import { Step4Customization } from './steps/Step4Customization';
import { Step5StrategicVersions } from './steps/Step5StrategicVersions';
import { Step6HiringManager } from './steps/Step6HiringManager';
import { SessionRecoveryDialog } from './components/SessionRecoveryDialog';
import { AutoSaveIndicator } from './components/AutoSaveIndicator';
import { VersionHistory } from './components/VersionHistory';
import { OptimizerErrorBoundary } from './components/OptimizerErrorBoundary';
import { STEP_CONFIG } from './types';
import { Loader2 } from 'lucide-react';
import { useOptimizerStore } from '@/stores/optimizerStore';

interface SavedResumeState {
  savedResumeId?: string;
  savedContent?: {
    sections?: any[];
    changelog?: any[];
    resumeText?: string;
  };
  savedCustomizations?: any;
  savedTemplatId?: string;
}

export default function ResumeOptimizerV9() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { 
    currentStep,
    isProcessing,
    processingMessage,
    resumeText,
    jobDescription,
    hasActiveSession, 
    clearSession, 
    setInput,
    reset,
    setBenchmarkResume,
    setCustomization,
    selectTemplate,
    setStep,
  } = useOptimizerStore();
  
  // Track if there's unsaved work for beforeunload warning
  const hasUnsavedWork = Boolean(resumeText && jobDescription);
  
  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedWork) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedWork]);
  
  // Track if new data was passed in
  const [pendingNewData, setPendingNewData] = useState<{
    resumeText: string;
    jobDescription: string;
    jobTitle?: string;
    company?: string;
  } | null>(null);
  
  // Check for existing session on mount
  useEffect(() => {
    // Avoid running if already initialized
    if (isInitialized) return;
    
    const stateData = location.state as ({ 
      resumeText?: string; 
      jobDescription?: string; 
      jobTitle?: string; 
      company?: string; 
      fromQuickScore?: boolean 
    } & SavedResumeState) | null;
    
    // Handle loading a saved resume from My Resumes
    if (stateData?.savedResumeId && stateData?.savedContent) {
      // Load the saved resume into the store
      const content = stateData.savedContent;
      
      // Set the benchmark resume from saved content
      if (content.sections || content.resumeText) {
        setBenchmarkResume({
          sections: content.sections || [],
          changelog: content.changelog || [],
          resumeText: content.resumeText || '',
          followUpQuestions: []
        });
      }
      
      // Set customizations if available
      if (stateData.savedCustomizations) {
        setCustomization(stateData.savedCustomizations);
      }
      
      // Set template if available
      if (stateData.savedTemplatId) {
        selectTemplate({ id: stateData.savedTemplatId, name: 'Saved Template' });
      }
      
      // Navigate to strategic versions to review/edit the saved resume
      setStep('strategic-versions');
      setIsInitialized(true);
      return;
    }
    
    const hasNewData = stateData?.resumeText && stateData?.jobDescription;
    const hasExistingSession = hasActiveSession();
    const isFromQuickScore = stateData?.fromQuickScore === true;
    
    // KEY FIX: If coming from Quick Score with new data, ALWAYS use the new data
    // This prevents the confusing "continue session?" dialog when starting a new analysis
    if (hasNewData && isFromQuickScore) {
      // Clear any existing session and use the fresh data
      clearSession();
      setInput(stateData.resumeText!, stateData.jobDescription!, stateData.jobTitle, stateData.company);
      setIsInitialized(true);
      // Clear the location state to prevent re-triggering on navigation
      window.history.replaceState({}, document.title);
      return;
    }
    
    // If there's new data (not from Quick Score) AND an existing session, let user choose
    if (hasNewData && hasExistingSession) {
      setPendingNewData({
        resumeText: stateData.resumeText!,
        jobDescription: stateData.jobDescription!,
        jobTitle: stateData.jobTitle,
        company: stateData.company
      });
      setShowRecoveryDialog(true);
      return;
    }
    
    // If only new data (no existing session), use it directly
    if (hasNewData) {
      setInput(stateData.resumeText!, stateData.jobDescription!, stateData.jobTitle, stateData.company);
      setIsInitialized(true);
      return;
    }
    
    // Check for existing session without new data - only show recovery dialog if session is less than 2 hours old
    if (hasExistingSession) {
      setShowRecoveryDialog(true);
      return;
    }
    
    // No data and no session - redirect to quick-score
    // Use a slight delay to avoid React navigation-during-render issues
    const redirectTimer = setTimeout(() => {
      navigate('/quick-score', { replace: true });
    }, 0);
    
    return () => clearTimeout(redirectTimer);
  }, [isInitialized]);
  
  const handleContinueSession = () => {
    // Zustand already has the persisted state, just close dialog
    setPendingNewData(null);
    setShowRecoveryDialog(false);
    setIsInitialized(true);
  };
  
  const handleStartFresh = () => {
    // If there's pending new data, use it instead of redirecting
    if (pendingNewData) {
      clearSession();
      setInput(pendingNewData.resumeText, pendingNewData.jobDescription, pendingNewData.jobTitle, pendingNewData.company);
      setPendingNewData(null);
      setShowRecoveryDialog(false);
      setIsInitialized(true);
    } else {
      clearSession();
      setShowRecoveryDialog(false);
      navigate('/quick-score');
    }
  };
  
  const stepConfig = STEP_CONFIG[currentStep];
  
  const renderStep = () => {
    switch (currentStep) {
      case 'gap-analysis':
        return <Step2GapAnalysis />;
      case 'proof-collector':
        return <Step3GapCloser />;
      case 'customization':
        return <Step4Customization />;
      case 'strategic-versions':
        return <Step5StrategicVersions />;
      case 'hiring-manager':
        return <Step6HiringManager />;
      default:
        return <Step2GapAnalysis />;
    }
  };
  
  // Show loading while checking session
  if (!isInitialized && !showRecoveryDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Session Recovery Dialog */}
      <SessionRecoveryDialog
        open={showRecoveryDialog}
        onContinue={handleContinueSession}
        onStartFresh={handleStartFresh}
      />
      
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stepConfig.icon}</span>
              <div>
                <h1 className="text-lg font-semibold">{stepConfig.title}</h1>
                <p className="text-sm text-muted-foreground">{stepConfig.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <AutoSaveIndicator />
              <VersionHistory />
              <div className="text-sm text-muted-foreground">
                ~{stepConfig.estimatedTime}
              </div>
            </div>
          </div>
          
          <ProgressStepper 
            currentStep={currentStep} 
            className="mt-4" 
          />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container py-6">
        <OptimizerErrorBoundary onReset={reset}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </OptimizerErrorBoundary>
      </main>
      
      {/* Processing Overlay */}
      {isProcessing && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          role="alertdialog"
          aria-busy="true"
          aria-live="assertive"
          aria-label="Processing in progress"
        >
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{processingMessage}</p>
            <span className="sr-only">Please wait, processing your resume...</span>
          </div>
        </div>
      )}
    </div>
  );
}

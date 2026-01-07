import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useBlocker } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgressStepper } from './components/ProgressStepper';
import { Step2GapAnalysis } from './steps/Step2GapAnalysis';
import { Step3AnswerAssistant } from './steps/Step3AnswerAssistant';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  } = useOptimizerStore();
  
  // Block navigation when there's unsaved work
  const hasUnsavedWork = Boolean(resumeText && jobDescription);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedWork && currentLocation.pathname !== nextLocation.pathname
  );
  
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
    const stateData = location.state as { 
      resumeText?: string; 
      jobDescription?: string; 
      jobTitle?: string; 
      company?: string; 
      fromQuickScore?: boolean 
    } | null;
    
    const hasNewData = stateData?.resumeText && stateData?.jobDescription;
    const hasExistingSession = hasActiveSession();
    
    // If there's both new data AND an existing session, let user choose
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
    
    // If only new data, use it
    if (hasNewData) {
      setInput(stateData.resumeText!, stateData.jobDescription!, stateData.jobTitle, stateData.company);
      setIsInitialized(true);
      return;
    }
    
    // Check for existing session without new data
    if (hasExistingSession) {
      setShowRecoveryDialog(true);
    } else if (!resumeText || !jobDescription) {
      // Redirect to quick-score if no input data
      navigate('/quick-score');
      return;
    }
    
    setIsInitialized(true);
  }, []);
  
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
      case 'answer-assistant':
        return <Step3AnswerAssistant />;
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{processingMessage}</p>
          </div>
        </div>
      )}
      
      {/* Navigation Blocker Dialog */}
      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Resume Optimizer?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress is auto-saved, but you'll leave the optimization flow. Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Stay
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

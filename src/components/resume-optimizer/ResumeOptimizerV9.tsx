import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizerProvider, useOptimizer } from './context/OptimizerContext';
import { ProgressStepper } from './components/ProgressStepper';
import { Step1CareerProfile } from './steps/Step1CareerProfile';
import { Step2GapAnalysis } from './steps/Step2GapAnalysis';
import { Step3AnswerAssistant } from './steps/Step3AnswerAssistant';
import { Step4Customization } from './steps/Step4Customization';
import { Step5StrategicVersions } from './steps/Step5StrategicVersions';
import { Step6HiringManager } from './steps/Step6HiringManager';
import { STEP_CONFIG } from './types';
import { Loader2 } from 'lucide-react';

function OptimizerContent() {
  const { state, dispatch } = useOptimizer();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize from location state (from QuickScore)
  useEffect(() => {
    const stateData = location.state as any;
    if (stateData?.resumeText && stateData?.jobDescription) {
      dispatch({
        type: 'SET_INPUT',
        resumeText: stateData.resumeText,
        jobDescription: stateData.jobDescription,
        jobTitle: stateData.jobTitle,
        company: stateData.company
      });
    } else if (!state.resumeText || !state.jobDescription) {
      // Redirect to quick-score if no input data
      navigate('/quick-score');
    }
  }, [location.state, dispatch, navigate, state.resumeText, state.jobDescription]);
  
  const stepConfig = STEP_CONFIG[state.currentStep];
  
  const renderStep = () => {
    switch (state.currentStep) {
      case 'career-profile':
        return <Step1CareerProfile />;
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
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
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
            <div className="text-sm text-muted-foreground">
              ~{stepConfig.estimatedTime}
            </div>
          </div>
          
          <ProgressStepper 
            currentStep={state.currentStep} 
            className="mt-4" 
          />
        </div>
      </div>
      
      {/* Main Content */}
      <main className="container py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Processing Overlay */}
      {state.isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{state.processingMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResumeOptimizerV9() {
  return (
    <OptimizerProvider>
      <OptimizerContent />
    </OptimizerProvider>
  );
}

// =====================================================
// EXECUTIVE STRATEGY DASHBOARD - Premium Minimal Design
// =====================================================
// Replaces FitAnalysisStep with a high-end command center
// Shows 3 Levels of Acceptance with radar visualization
// =====================================================

import { useResumeBuilderV3Store, StandardsResult, QuestionsResult } from "@/stores/resumeBuilderV3Store";
import { useLevelScores } from "@/hooks/useLevelScores";
import { ExecutiveRadar } from "./components/ExecutiveRadar";
import { LevelCard } from "./components/LevelCard";
import { KeywordsAnalysis } from "./components/KeywordsAnalysis";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { LoadingSkeletonV3 } from "./LoadingSkeletonV3";
import { useResumeBuilderApi } from "./hooks/useResumeBuilderApi";
import { motion } from "framer-motion";

export function ExecutiveStrategyDashboard() {
  const {
    fitAnalysis,
    standards,
    resumeText,
    jobDescription,
    setStandards,
    setQuestions,
    setStep,
    setLoading,
    isLoading,
  } = useResumeBuilderV3Store();

  const { callApi, isRetrying, currentAttempt, cancel, maxAttempts } = useResumeBuilderApi();
  
  const levelScores = useLevelScores({ 
    fitAnalysis, 
    standards 
  });

  if (!fitAnalysis || !levelScores) return null;

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Loading industry standards">
        <LoadingSkeletonV3 
          type="standards" 
          message={isRetrying ? `Retrying... (Attempt ${currentAttempt}/${maxAttempts})` : "Researching industry standards and preparing interview questions..."} 
          onCancel={() => {
            cancel();
            setLoading(false);
          }}
        />
      </div>
    );
  }

  const handleContinue = async () => {
    setLoading(true);

    const standardsResult = await callApi<StandardsResult>({
      step: "standards",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
      },
      successMessage: "Standards analysis complete!",
    });

    if (!standardsResult) {
      setLoading(false);
      return;
    }
    
    setStandards(standardsResult);

    const questionsResult = await callApi<QuestionsResult>({
      step: "questions",
      body: {
        resumeText,
        jobDescription,
        fitAnalysis,
        standards: standardsResult,
      },
      successMessage: "Interview questions ready!",
    });

    if (questionsResult) {
      setQuestions(questionsResult);
      setStep(2);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* Header - Overall Score */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex flex-col items-center">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Overall Readiness
          </span>
          <div className="text-6xl font-light tracking-tight text-foreground">
            {levelScores.overall}
            <span className="text-3xl text-muted-foreground">%</span>
          </div>
        </div>
        <p className="mt-4 text-muted-foreground max-w-lg mx-auto text-sm">
          {fitAnalysis.executive_summary}
        </p>
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <ExecutiveRadar scores={levelScores} className="max-w-md" />
      </motion.div>

      {/* Level Cards Grid - 3 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <LevelCard levelScore={levelScores.ats} index={0} />
        <LevelCard levelScore={levelScores.recruiter} index={1} />
        <LevelCard levelScore={levelScores.hiring_manager} index={2} />
      </div>

      {/* Keywords Analysis Section */}
      <KeywordsAnalysis
        keywordsFound={fitAnalysis.keywords_found}
        keywordsMissing={fitAnalysis.keywords_missing}
        jobDescription={jobDescription}
        resumeText={resumeText}
      />

      {/* Quick Stats Row */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-2"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{fitAnalysis.keywords_found.length}</span>
          <span>of {fitAnalysis.keywords_found.length + fitAnalysis.keywords_missing.length} keywords</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{fitAnalysis.strengths.length}</span>
          <span>strengths</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{fitAnalysis.gaps.length}</span>
          <span>gaps</span>
        </div>
      </motion.div>

      {/* Continue Button */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center pt-4"
      >
        <Button size="lg" onClick={handleContinue} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Standards...
            </>
          ) : (
            <>
              Continue to Interview
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

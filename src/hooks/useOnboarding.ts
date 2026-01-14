import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingStatus {
  hasResume: boolean;
  hasCompletedInterview: boolean;
  hasReviewedResume: boolean;
  isOnboardingComplete: boolean;
  loading: boolean;
  resumeCompletionPercentage: number;
  resumeStrengthScore: number;
  totalIntelligenceCount: number;
  completionMilestone: 'none' | 'basic' | 'intermediate' | 'advanced' | 'elite';
}

export const useOnboarding = () => {
  const [status, setStatus] = useState<OnboardingStatus>({
    hasResume: false,
    hasCompletedInterview: false,
    hasReviewedResume: false,
    isOnboardingComplete: false,
    loading: true,
    resumeCompletionPercentage: 0,
    resumeStrengthScore: 0,
    totalIntelligenceCount: 0,
    completionMilestone: 'none',
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus(prev => ({ ...prev, loading: false }));
        return;
      }

      // Check for resume upload
      const { data: resumes } = await supabase
        .from("resumes")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      const hasResume = (resumes?.length || 0) > 0;

      // Check for career vault and interview responses
      const { data: vault } = await supabase
        .from("career_vault")
        .select("id, review_completion_percentage, overall_strength_score")
        .eq("user_id", user.id)
        .single();

      // Check if user has completed at least 10 interview responses
      let hasCompletedInterview = false;
      if (vault) {
        const { count } = await supabase
          .from("vault_interview_responses")
          .select("*", { count: 'exact', head: true })
          .eq("vault_id", vault.id);
        
        hasCompletedInterview = (count || 0) >= 10;
      }

      // Check for resume review (assuming they've accessed it)
      const hasReviewedResume = localStorage.getItem(`resume_reviewed_${user.id}`) === "true";
      
      // Get resume completion metrics
      // Use review_completion_percentage for actual user review progress
      const resumeCompletionPercentage = vault?.review_completion_percentage || 0;
      const resumeStrengthScore = vault?.overall_strength_score || 0;
      
      // Calculate total intelligence (would need to query actual tables for accurate count)
      const totalIntelligenceCount = 0; // Placeholder
      
      // Determine completion milestone
      let completionMilestone: OnboardingStatus['completionMilestone'] = 'none';
      if (resumeCompletionPercentage >= 100) completionMilestone = 'elite';
      else if (resumeCompletionPercentage >= 75) completionMilestone = 'advanced';
      else if (resumeCompletionPercentage >= 50) completionMilestone = 'intermediate';
      else if (resumeCompletionPercentage >= 25) completionMilestone = 'basic';
      
      // Simple onboarding completion check based on key milestones
      const isOnboardingComplete = hasResume && hasCompletedInterview;

      setStatus({
        hasResume,
        hasCompletedInterview,
        hasReviewedResume,
        isOnboardingComplete,
        loading: false,
        resumeCompletionPercentage,
        resumeStrengthScore,
        totalIntelligenceCount,
        completionMilestone,
      });
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const markOnboardingComplete = async () => {
    try {
      setStatus(prev => ({ ...prev, isOnboardingComplete: true }));
    } catch (error) {
      console.error("Error marking onboarding complete:", error);
    }
  };

  const markResumeReviewed = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`resume_reviewed_${user.id}`, "true");
        setStatus(prev => ({ ...prev, hasReviewedResume: true }));
      }
    });
  };

  return {
    ...status,
    markOnboardingComplete,
    markResumeReviewed,
    refresh: checkOnboardingStatus,
  };
};
